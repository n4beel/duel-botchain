// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/Duel.sol";

contract MaliciousActor {
  Duel public duel;
  uint256 public duelId;
  bool public attackWithdraw;

  constructor(Duel _duel) {
    duel = _duel;
  }

  function setDuelId(uint256 id) external {
    duelId = id;
  }

  function setAttackWithdraw(bool v) external {
    attackWithdraw = v;
  }

  receive() external payable {
    if (attackWithdraw) {
      duel.withdraw();
    } else if (duelId > 0) {
      duel.cancel(duelId);
    }
  }
}

contract DuelTest is Test {
  Duel public duel;

  address public alice = address(0x1111);
  address public bob = address(0x2222);
  address public charlie = address(0x3333);

  uint128 public constant STAKE = 1 ether;
  uint8 public constant DAYS = 7;

  function setUp() public {
    duel = new Duel();
    vm.deal(alice, 100 ether);
    vm.deal(bob, 100 ether);
    vm.deal(charlie, 100 ether);

    vm.warp(1000 days + 12 hours);
  }

  function test_ChallengeEscrowsStake() public {
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Morning 5k Run");

    Duel.Match memory m = duel.matchOf(id);
    assertEq(m.a, alice);
    assertEq(m.b, bob);
    assertEq(uint8(m.state), uint8(Duel.State.Offered));
    assertEq(m.stake, STAKE);
    assertEq(m.numDays, DAYS);
    assertEq(address(duel).balance, STAKE);
  }

  function test_BadOpponentDaysStakeRevert() public {
    vm.startPrank(alice);

    // Opponent zero
    vm.expectRevert(Duel.BadOpponent.selector);
    duel.challenge{value: STAKE}(address(0), DAYS, "Memo");

    // Opponent self
    vm.expectRevert(Duel.BadOpponent.selector);
    duel.challenge{value: STAKE}(alice, DAYS, "Memo");

    // Opponent contract
    vm.expectRevert(Duel.BadOpponent.selector);
    duel.challenge{value: STAKE}(address(duel), DAYS, "Memo");

    // Days < 3 or > 30
    vm.expectRevert(Duel.BadDays.selector);
    duel.challenge{value: STAKE}(bob, 2, "Memo");

    vm.expectRevert(Duel.BadDays.selector);
    duel.challenge{value: STAKE}(bob, 31, "Memo");

    // Stake < 0.01 ether or > 100,000 ether
    vm.expectRevert(abi.encodeWithSelector(Duel.BadStake.selector, 0.01 ether, 100_000 ether));
    duel.challenge{value: 0.005 ether}(bob, DAYS, "Memo");

    // Memo > 80 bytes
    bytes memory longMemo = new bytes(81);
    vm.expectRevert(Duel.BadMemo.selector);
    duel.challenge{value: STAKE}(bob, DAYS, string(longMemo));

    vm.stopPrank();
  }

  function test_AcceptMatchesStake_StartsTomorrow() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");

    // Bob accepts
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    Duel.Match memory m = duel.matchOf(id);
    assertEq(uint8(m.state), uint8(Duel.State.Active));
    assertEq(m.startDay, today + 1);
    assertEq(address(duel).balance, STAKE * 2);
  }

  function test_AcceptLateOrByStrangerReverts() public {
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");

    // Stranger cannot accept
    vm.prank(charlie);
    vm.expectRevert(Duel.NotOpponent.selector);
    duel.accept{value: STAKE}(id);

    // Wrong payment
    vm.prank(bob);
    vm.expectRevert(abi.encodeWithSelector(Duel.WrongPayment.selector, STAKE));
    duel.accept{value: STAKE / 2}(id);

    // Accept after window (3 days)
    vm.warp(block.timestamp + 3 days + 1);
    vm.prank(bob);
    vm.expectRevert(Duel.TooLate.selector);
    duel.accept{value: STAKE}(id);
  }

  function test_CancelBeforeAcceptRefunds() public {
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");

    // Stranger cannot cancel
    vm.prank(bob);
    vm.expectRevert(Duel.NotChallenger.selector);
    duel.cancel(id);

    // Alice cancels
    uint256 preBal = alice.balance;
    vm.prank(alice);
    duel.cancel(id);

    assertEq(alice.balance, preBal + STAKE);
    assertEq(uint8(duel.matchOf(id).state), uint8(Duel.State.Cancelled));
  }

  function test_CheckInSetsTodaysBit() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Warp to Day 0
    vm.warp((today + 1) * 1 days + 10 hours);

    // Alice checks in
    vm.prank(alice);
    duel.checkIn(id);
    assertEq(duel.daysDone(id, alice), 1); // bit 0

    // Bob checks in
    vm.prank(bob);
    duel.checkIn(id);
    assertEq(duel.daysDone(id, bob), 1);
  }

  function test_CheckInTwiceReverts_ArgsDay() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    vm.warp((today + 1) * 1 days + 10 hours);

    vm.prank(alice);
    duel.checkIn(id);

    vm.prank(alice);
    vm.expectRevert(abi.encodeWithSelector(Duel.AlreadyCheckedIn.selector, uint8(0)));
    duel.checkIn(id);
  }

  function test_CheckInBeforeStartReverts_ArgsStartDay() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Before startDay (still on today)
    vm.prank(alice);
    vm.expectRevert(abi.encodeWithSelector(Duel.NotRunning.selector, today + 1, DAYS));
    duel.checkIn(id);
  }

  function test_CheckInAfterEndReverts() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // After duel finishes (day 7+, i.e. today + 1 + 7 = today + 8)
    vm.warp((today + 8) * 1 days + 1 hours);
    vm.prank(alice);
    vm.expectRevert(abi.encodeWithSelector(Duel.NotRunning.selector, today + 1, DAYS));
    duel.checkIn(id);
  }

  function test_SettleWhenOnePlayerMissesADay() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Day 0: both check in
    vm.warp((today + 1) * 1 days + 8 hours);
    vm.prank(alice);
    duel.checkIn(id);
    vm.prank(bob);
    duel.checkIn(id);

    // Day 1: Alice checks in, Bob misses!
    vm.warp((today + 2) * 1 days + 8 hours);
    vm.prank(alice);
    duel.checkIn(id);

    // Warp to Day 2: Day 1 is now fully over
    vm.warp((today + 3) * 1 days + 2 hours);

    duel.settle(id);

    Duel.Match memory m = duel.matchOf(id);
    assertEq(uint8(m.state), uint8(Duel.State.Settled));
    assertEq(m.winner, alice);
    assertEq(duel.pending(alice), STAKE * 2);
    assertEq(duel.pending(bob), 0);

    // Alice withdraws
    uint256 preAlice = alice.balance;
    vm.prank(alice);
    duel.withdraw();
    assertEq(alice.balance, preAlice + STAKE * 2);
  }

  function test_SettleBothMissedSameDayIsDraw() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, DAYS, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Day 0: Both miss!
    // Day 0 passes -> Warp to Day 1
    vm.warp((today + 2) * 1 days + 2 hours);

    duel.settle(id);

    Duel.Match memory m = duel.matchOf(id);
    assertEq(uint8(m.state), uint8(Duel.State.Settled));
    assertEq(m.winner, address(0)); // Draw
    assertEq(duel.pending(alice), STAKE);
    assertEq(duel.pending(bob), STAKE);
  }

  function test_SettleEarlyAfterFirstMiss_BeforeEnd() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, 30, "Long duel");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Bob checks in Day 0, Alice misses Day 0
    vm.warp((today + 1) * 1 days + 5 hours);
    vm.prank(bob);
    duel.checkIn(id);

    // Warp to Day 1: Day 0 is over, Alice missed
    vm.warp((today + 2) * 1 days + 2 hours);

    // Can settle immediately on day 1 without waiting 30 days!
    duel.settle(id);
    assertEq(duel.matchOf(id).winner, bob);
    assertEq(duel.pending(bob), STAKE * 2);
  }

  function test_SettleNobodyMissedAtEndIsDraw() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, 3, "Short duel");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Both check in on all 3 days
    for (uint64 k = 0; k < 3; k++) {
      vm.warp((today + 1 + k) * 1 days + 8 hours);
      vm.prank(alice);
      duel.checkIn(id);
      vm.prank(bob);
      duel.checkIn(id);
    }

    // Warp past Day 2 (Day 3)
    vm.warp((today + 4) * 1 days + 2 hours);

    duel.settle(id);
    assertEq(duel.matchOf(id).winner, address(0));
    assertEq(duel.pending(alice), STAKE);
    assertEq(duel.pending(bob), STAKE);
  }

  function test_SettleTooEarlyReverts() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, 5, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Day 0: Both check in
    vm.warp((today + 1) * 1 days + 8 hours);
    vm.prank(alice);
    duel.checkIn(id);
    vm.prank(bob);
    duel.checkIn(id);

    // Still during day 0, no misses yet
    vm.expectRevert(Duel.NothingToSettle.selector);
    duel.settle(id);
  }

  function test_FirstMissDecides_LaterCatchUpDoesNotHelp() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, 5, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    // Day 0: Alice checks in, Bob misses
    vm.warp((today + 1) * 1 days + 8 hours);
    vm.prank(alice);
    duel.checkIn(id);

    // Day 1: Alice misses, Bob checks in!
    vm.warp((today + 2) * 1 days + 8 hours);
    vm.prank(bob);
    duel.checkIn(id);

    // Day 2 arrives
    vm.warp((today + 3) * 1 days + 2 hours);

    duel.settle(id);

    // Day 0 decided it! Alice was first to make it when Bob missed -> Alice wins
    assertEq(duel.matchOf(id).winner, alice);
    assertEq(duel.pending(alice), STAKE * 2);
  }

  function test_SettleOnce() public {
    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, 3, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    vm.warp((today + 2) * 1 days + 2 hours);
    duel.settle(id);

    // Second settle reverts with InvalidState
    vm.expectRevert(Duel.InvalidState.selector);
    duel.settle(id);
  }

  function test_ReentrantCancelBlocked() public {
    MaliciousActor mal = new MaliciousActor(duel);
    vm.deal(address(mal), 10 ether);

    vm.prank(address(mal));
    uint256 id = duel.challenge{value: 2 ether}(bob, 5, "Memo");
    mal.setDuelId(id);

    // Attacking cancel should revert
    vm.expectRevert(Duel.TransferFailed.selector);
    vm.prank(address(mal));
    duel.cancel(id);
  }

  function test_ReentrantWithdrawBlocked() public {
    MaliciousActor mal = new MaliciousActor(duel);
    vm.deal(address(mal), 10 ether);

    vm.prank(address(mal));
    uint256 id = duel.challenge{value: 2 ether}(bob, 3, "Memo");
    mal.setAttackWithdraw(true);

    vm.prank(bob);
    duel.accept{value: 2 ether}(id);

    // Warp to Day 1, both missed Day 0
    uint64 today = uint64(block.timestamp / 1 days);
    vm.warp((today + 2) * 1 days + 2 hours);
    duel.settle(id);

    // mal has 2 ether pending
    vm.expectRevert(Duel.TransferFailed.selector);
    vm.prank(address(mal));
    duel.withdraw();
  }

  function testFuzz_SettleMatchesReference(uint8 numDaysIn, uint32 aBitsIn, uint32 bBitsIn) public {
    uint8 numDays = uint8(bound(numDaysIn, 3, 30));

    // Mask bits to numDays
    uint32 mask = uint32((1 << numDays) - 1);
    uint32 aBits = aBitsIn & mask;
    uint32 bBits = bBitsIn & mask;

    uint64 today = uint64(block.timestamp / 1 days);
    vm.prank(alice);
    uint256 id = duel.challenge{value: STAKE}(bob, numDays, "Memo");
    vm.prank(bob);
    duel.accept{value: STAKE}(id);

    for (uint8 k = 0; k < numDays; k++) {
      vm.warp((today + 1 + k) * 1 days + 8 hours);
      if (((aBits >> k) & 1) != 0) {
        vm.prank(alice);
        duel.checkIn(id);
      }
      if (((bBits >> k) & 1) != 0) {
        vm.prank(bob);
        duel.checkIn(id);
      }
    }

    // Warp past end of duel
    vm.warp((today + 1 + numDays + 1) * 1 days + 2 hours);

    // Reference logic
    address refWinner = address(0);
    bool decided = false;
    for (uint8 k = 0; k < numDays; k++) {
      bool aDone = ((aBits >> k) & 1) != 0;
      bool bDone = ((bBits >> k) & 1) != 0;
      if (!aDone || !bDone) {
        decided = true;
        if (!aDone && !bDone) refWinner = address(0);
        else if (!aDone) refWinner = bob;
        else refWinner = alice;
        break;
      }
    }

    duel.settle(id);
    assertEq(duel.matchOf(id).winner, refWinner);
  }

  function testFuzz_Conservation(uint8 numDuelsIn) public {
    uint8 numDuels = uint8(bound(numDuelsIn, 1, 6));

    uint256 totalEscrow = 0;
    for (uint8 i = 0; i < numDuels; i++) {
      address a = address(uint160(0xA000 + i));
      address b = address(uint160(0xB000 + i));
      vm.deal(a, 10 ether);
      vm.deal(b, 10 ether);

      vm.prank(a);
      uint256 id = duel.challenge{value: 1 ether}(b, 3, "Duel");
      totalEscrow += 1 ether;

      if (i % 2 == 0) {
        vm.prank(b);
        duel.accept{value: 1 ether}(id);
        totalEscrow += 1 ether;
      }
    }

    assertEq(address(duel).balance, totalEscrow);
  }

  function test_SpecificMutantKillers() public {
    // 1. Boundary checks: MIN_DAYS=3, MAX_DAYS=30, MIN_STAKE=0.01 ether, MAX_STAKE=100_000 ether
    vm.prank(alice);
    uint256 idMin = duel.challenge{value: 0.01 ether}(bob, 3, "Min");
    assertEq(duel.matchOf(idMin).stake, 0.01 ether);

    // Exact MAX_MEMO_BYTES (80 bytes)
    string memory memo80 = "12345678901234567890123456789012345678901234567890123456789012345678901234567890";
    vm.prank(alice);
    uint256 idMemo = duel.challenge{value: 0.01 ether}(bob, 3, memo80);
    assertEq(duel.matchOf(idMemo).stake, 0.01 ether);

    // Accept exactly at acceptBy boundary
    uint64 acceptBy = duel.matchOf(idMin).acceptBy;
    vm.warp(acceptBy);
    vm.prank(bob);
    duel.accept{value: 0.01 ether}(idMin);
    assertEq(uint8(duel.matchOf(idMin).state), 1); // Active

    // Status view checks for running duel
    (uint64 curToday, uint64 startDay, int32 dayNum, bool canSettle) = duel.status(idMin);
    assertEq(startDay, (acceptBy / 1 days) + 1);
    assertEq(dayNum, -int32(uint32(startDay - curToday)));
    assertFalse(canSettle);

    // Warp to day 0 of duel (curToday == startDay)
    vm.warp(startDay * 1 days + 1 hours);
    (, , dayNum, canSettle) = duel.status(idMin);
    assertEq(dayNum, 1);
    assertFalse(canSettle);

    // Warp to day 1, neither checked in on day 0 -> Settleable!
    vm.warp((startDay + 1) * 1 days + 1 hours);
    (, , dayNum, canSettle) = duel.status(idMin);
    assertEq(dayNum, 2);
    assertTrue(canSettle);

    // Settle it
    duel.settle(idMin);
    assertEq(uint8(duel.matchOf(idMin).state), 2); // Settled

    // Inactive status view
    (, , , canSettle) = duel.status(idMin);
    assertFalse(canSettle);

    // Check status revert on out of bounds
    vm.expectRevert(Duel.MatchNotFound.selector);
    duel.status(0);
    vm.expectRevert(Duel.MatchNotFound.selector);
    duel.status(999);

    // Check latest view pagination & id math
    (uint256[] memory ids, , ) = duel.latest(0, 1);
    assertEq(ids.length, 1);
    assertEq(ids[0], duel.matchCount());

    vm.deal(alice, 200_000 ether);
    vm.prank(alice);
    uint256 idMax = duel.challenge{value: 100_000 ether}(bob, 30, "Max");
    assertEq(duel.matchOf(idMax).stake, 100_000 ether);
  }
}
