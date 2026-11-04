// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/Duel.sol";

contract DuelHandler is Test {
  Duel public duel;
  address public alice = address(0xAA11);
  address public bob = address(0xBB22);
  uint256 public activeDuelId;

  constructor(Duel _duel) {
    duel = _duel;
    vm.deal(alice, 1000 ether);
    vm.deal(bob, 1000 ether);

    vm.warp(1000 days + 12 hours);

    vm.prank(alice);
    activeDuelId = duel.challenge{value: 1 ether}(bob, 7, "Invariant Duel");
  }

  function acceptDuel() external {
    Duel.Match memory m = duel.matchOf(activeDuelId);
    if (m.state == Duel.State.Offered && block.timestamp <= m.acceptBy) {
      vm.prank(bob);
      duel.accept{value: m.stake}(activeDuelId);
    }
  }

  function checkInAlice() external {
    Duel.Match memory m = duel.matchOf(activeDuelId);
    uint64 today = uint64(block.timestamp / 1 days);
    if (
      m.state == Duel.State.Active &&
      today >= m.startDay &&
      today < m.startDay + uint64(m.numDays)
    ) {
      uint8 idx = uint8(today - m.startDay);
      if ((m.aBits & (uint32(1) << idx)) == 0) {
        vm.prank(alice);
        duel.checkIn(activeDuelId);
      }
    }
  }

  function checkInBob() external {
    Duel.Match memory m = duel.matchOf(activeDuelId);
    uint64 today = uint64(block.timestamp / 1 days);
    if (
      m.state == Duel.State.Active &&
      today >= m.startDay &&
      today < m.startDay + uint64(m.numDays)
    ) {
      uint8 idx = uint8(today - m.startDay);
      if ((m.bBits & (uint32(1) << idx)) == 0) {
        vm.prank(bob);
        duel.checkIn(activeDuelId);
      }
    }
  }

  function advanceTime(uint32 hoursToAdvance) external {
    uint32 h = uint32(bound(hoursToAdvance, 1, 36));
    vm.warp(block.timestamp + h * 1 hours);
  }

  function settleDuel() external {
    Duel.Match memory m = duel.matchOf(activeDuelId);
    if (m.state == Duel.State.Active) {
      try duel.settle(activeDuelId) {} catch {}
    }
  }

  function withdrawPending() external {
    if (duel.pending(alice) > 0) {
      vm.prank(alice);
      duel.withdraw();
    }
    if (duel.pending(bob) > 0) {
      vm.prank(bob);
      duel.withdraw();
    }
  }
}

contract DuelInvariantTest is Test {
  Duel public duel;
  DuelHandler public handler;

  function setUp() public {
    duel = new Duel();
    handler = new DuelHandler(duel);

    targetContract(address(handler));
  }

  function invariant_BalanceEqualsEscrowPlusPending() public view {
    // Invariant: balance == Σ stake of Offered + Σ 2*stake of Active + Σ pending
    uint256 count = duel.matchCount();
    uint256 expectedBalance = 0;

    for (uint256 id = 1; id <= count; id++) {
      Duel.Match memory m = duel.matchOf(id);
      if (m.state == Duel.State.Offered) {
        expectedBalance += m.stake;
      } else if (m.state == Duel.State.Active) {
        expectedBalance += uint256(m.stake) * 2;
      }
    }

    expectedBalance += duel.pending(handler.alice());
    expectedBalance += duel.pending(handler.bob());

    assertEq(address(duel).balance, expectedBalance);
  }
}
