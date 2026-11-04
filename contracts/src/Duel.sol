// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title Duel
 * @notice Two people. Habit bet. Miss one day and you pay.
 */
contract Duel {
  enum State {
    Offered,
    Active,
    Settled,
    Cancelled
  }

  struct Match {
    address a;
    address b;
    State state;
    uint8 numDays;
    uint32 aBits;
    uint32 bBits;
    uint64 acceptBy;
    uint64 startDay;
    uint128 stake;
    address winner; // 0 on draw
    uint32 memoBlock;
  }

  uint8 public constant MIN_DAYS = 3;
  uint8 public constant MAX_DAYS = 30;
  uint128 public constant MIN_STAKE = 0.01 ether;
  uint128 public constant MAX_STAKE = 100_000 ether;
  uint64 public constant ACCEPT_WINDOW = 3 days;
  uint256 public constant MAX_MEMO_BYTES = 80;
  uint256 public constant MAX_PAGE = 50;

  mapping(uint256 => Match) private _matches;
  mapping(address => uint256[]) private _byParty;
  mapping(address => uint256) public pending;
  uint256 public matchCount; // ids start at 1

  bool private _locked;

  // Custom errors
  error BadOpponent();
  error BadDays();
  error BadStake(uint128 min, uint128 max);
  error BadMemo();
  error MatchNotFound();
  error NotOpponent();
  error TooLate();
  error WrongPayment(uint128 expected);
  error NotChallenger();
  error InvalidState();
  error NotAPlayer();
  error NotRunning(uint64 startDay, uint8 numDays);
  error AlreadyCheckedIn(uint8 dayIndex);
  error NothingToSettle();
  error NothingToWithdraw();
  error TransferFailed();
  error ReentrantCall();

  // Events
  event Challenged(
    uint256 indexed id,
    address indexed a,
    address indexed b,
    uint128 stake,
    uint8 numDays,
    uint64 acceptBy,
    string memo
  );
  event Accepted(uint256 indexed id, uint64 startDay);
  event CheckedIn(uint256 indexed id, address indexed who, uint8 dayIndex);
  event Settled(uint256 indexed id, address indexed winner, uint8 firstMissDay);
  event Cancelled(uint256 indexed id);
  event Withdrawn(address indexed to, uint256 amount);

  modifier nonReentrant() {
    if (_locked) revert ReentrantCall();
    _locked = true;
    _;
    _locked = false;
  }

  /**
   * @notice Propose a duel to an opponent
   */
  function challenge(
    address opponent,
    uint8 numDays,
    string calldata memo
  ) external payable returns (uint256 id) {
    if (opponent == address(0) || opponent == msg.sender || opponent == address(this)) {
      revert BadOpponent();
    }
    if (numDays < MIN_DAYS || numDays > MAX_DAYS) {
      revert BadDays();
    }
    if (msg.value < MIN_STAKE || msg.value > MAX_STAKE) {
      revert BadStake(MIN_STAKE, MAX_STAKE);
    }
    if (bytes(memo).length > MAX_MEMO_BYTES) {
      revert BadMemo();
    }

    id = ++matchCount;
    uint64 acceptBy = uint64(block.timestamp + ACCEPT_WINDOW);

    Match storage m = _matches[id];
    m.a = msg.sender;
    m.b = opponent;
    m.state = State.Offered;
    m.numDays = numDays;
    m.acceptBy = acceptBy;
    m.stake = uint128(msg.value);
    m.memoBlock = uint32(block.number);

    _byParty[msg.sender].push(id);
    _byParty[opponent].push(id);

    emit Challenged(id, msg.sender, opponent, uint128(msg.value), numDays, acceptBy, memo);
  }

  /**
   * @notice Opponent accepts the challenge by matching the stake
   */
  function accept(uint256 id) external payable {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];

    if (msg.sender != m.b) revert NotOpponent();
    if (m.state != State.Offered) revert InvalidState();
    if (block.timestamp > m.acceptBy) revert TooLate();
    if (msg.value != m.stake) revert WrongPayment(m.stake);

    uint64 today = uint64(block.timestamp / 1 days);
    uint64 startDay = today + 1;

    m.startDay = startDay;
    m.state = State.Active;

    emit Accepted(id, startDay);
  }

  /**
   * @notice Challenger cancels unaccepted challenge and retrieves stake
   */
  function cancel(uint256 id) external nonReentrant {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];

    if (msg.sender != m.a) revert NotChallenger();
    if (m.state != State.Offered) revert InvalidState();

    m.state = State.Cancelled;
    uint128 stake = m.stake;

    emit Cancelled(id);

    (bool ok, ) = msg.sender.call{value: stake}("");
    if (!ok) revert TransferFailed();
  }

  /**
   * @notice Check in for today's UTC day
   */
  function checkIn(uint256 id) external {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];

    if (m.state != State.Active) revert InvalidState();
    if (msg.sender != m.a && msg.sender != m.b) revert NotAPlayer();

    uint64 today = uint64(block.timestamp / 1 days);
    if (today < m.startDay || today >= m.startDay + uint64(m.numDays)) {
      revert NotRunning(m.startDay, m.numDays);
    }

    uint8 dayIndex = uint8(today - m.startDay);
    uint32 mask = uint32(1) << dayIndex;

    if (msg.sender == m.a) {
      if ((m.aBits & mask) != 0) revert AlreadyCheckedIn(dayIndex);
      m.aBits |= mask;
    } else {
      if ((m.bBits & mask) != 0) revert AlreadyCheckedIn(dayIndex);
      m.bBits |= mask;
    }

    emit CheckedIn(id, msg.sender, dayIndex);
  }

  /**
   * @notice Settle duel after first miss or at completion
   */
  function settle(uint256 id) external {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];

    if (m.state != State.Active) revert InvalidState();

    uint64 today = uint64(block.timestamp / 1 days);
    uint8 n = 0;
    if (today > m.startDay) {
      uint64 elapsed = today - m.startDay;
      if (elapsed > uint64(m.numDays)) {
        n = m.numDays;
      } else {
        n = uint8(elapsed);
      }
    }

    for (uint8 k = 0; k < n; k++) {
      uint32 mask = uint32(1) << k;
      bool aDone = (m.aBits & mask) != 0;
      bool bDone = (m.bBits & mask) != 0;

      if (!aDone || !bDone) {
        m.state = State.Settled;
        if (!aDone && !bDone) {
          // Both missed on the same day -> Draw
          m.winner = address(0);
          pending[m.a] += m.stake;
          pending[m.b] += m.stake;
          emit Settled(id, address(0), k);
          return;
        } else if (!aDone) {
          // A missed, B made it -> B wins
          m.winner = m.b;
          pending[m.b] += uint256(m.stake) * 2;
          emit Settled(id, m.b, k);
          return;
        } else {
          // B missed, A made it -> A wins
          m.winner = m.a;
          pending[m.a] += uint256(m.stake) * 2;
          emit Settled(id, m.a, k);
          return;
        }
      }
    }

    // No miss up to day n
    if (n == m.numDays) {
      m.state = State.Settled;
      m.winner = address(0);
      pending[m.a] += m.stake;
      pending[m.b] += m.stake;
      emit Settled(id, address(0), 0);
      return;
    }

    revert NothingToSettle();
  }

  /**
   * @notice Pull payment of winnings or refunded stakes
   */
  function withdraw() external nonReentrant {
    uint256 amt = pending[msg.sender];
    if (amt == 0) revert NothingToWithdraw();

    pending[msg.sender] = 0;
    emit Withdrawn(msg.sender, amt);

    (bool ok, ) = msg.sender.call{value: amt}("");
    if (!ok) revert TransferFailed();
  }

  // Views

  function matchOf(uint256 id) external view returns (Match memory) {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    return _matches[id];
  }

  function daysDone(uint256 id, address who) external view returns (uint32) {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];
    if (who == m.a) return m.aBits;
    if (who == m.b) return m.bBits;
    return 0;
  }

  function status(
    uint256 id
  )
    external
    view
    returns (
      uint64 today,
      uint64 startDay,
      int32 dayNumber,
      bool canSettle
    )
  {
    if (id == 0 || id > matchCount) revert MatchNotFound();
    Match storage m = _matches[id];

    today = uint64(block.timestamp / 1 days);
    startDay = m.startDay;

    if (m.state == State.Offered) {
      dayNumber = 0;
      canSettle = false;
      return (today, startDay, dayNumber, canSettle);
    }

    if (today < startDay) {
      dayNumber = -int32(uint32(startDay - today));
    } else {
      dayNumber = int32(uint32(today - startDay + 1));
    }

    canSettle = false;
    if (m.state == State.Active) {
      uint8 n = 0;
      if (today > m.startDay) {
        uint64 elapsed = today - m.startDay;
        if (elapsed > uint64(m.numDays)) {
          n = m.numDays;
        } else {
          n = uint8(elapsed);
        }
      }

      for (uint8 k = 0; k < n; k++) {
        uint32 mask = uint32(1) << k;
        if ((m.aBits & mask) == 0 || (m.bBits & mask) == 0) {
          canSettle = true;
          break;
        }
      }
      if (!canSettle && n == m.numDays) {
        canSettle = true;
      }
    }
  }

  function byParty(
    address addr,
    uint256 offset,
    uint256 count
  )
    external
    view
    returns (uint256[] memory ids, Match[] memory matches, uint256 total)
  {
    uint256[] storage partyIds = _byParty[addr];
    total = partyIds.length;

    if (offset >= total || count == 0) {
      return (new uint256[](0), new Match[](0), total);
    }
    if (count > MAX_PAGE) {
      count = MAX_PAGE;
    }
    if (offset + count > total) {
      count = total - offset;
    }

    ids = new uint256[](count);
    matches = new Match[](count);

    // Newest first
    for (uint256 i = 0; i < count; i++) {
      uint256 id = partyIds[total - 1 - (offset + i)];
      ids[i] = id;
      matches[i] = _matches[id];
    }
  }

  function latest(
    uint256 offset,
    uint256 count
  )
    external
    view
    returns (uint256[] memory ids, Match[] memory matches, uint256 total)
  {
    total = matchCount;
    if (offset >= total || count == 0) {
      return (new uint256[](0), new Match[](0), total);
    }
    if (count > MAX_PAGE) {
      count = MAX_PAGE;
    }
    if (offset + count > total) {
      count = total - offset;
    }

    ids = new uint256[](count);
    matches = new Match[](count);

    for (uint256 i = 0; i < count; i++) {
      uint256 id = total - (offset + i);
      ids[i] = id;
      matches[i] = _matches[id];
    }
  }
}
