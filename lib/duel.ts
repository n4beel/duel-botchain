export const MIN_DAYS = 3;
export const MAX_DAYS = 30;
export const MIN_STAKE = 10_000_000_000_000_000n; // 0.01 ether
export const MAX_STAKE = 100_000_000_000_000_000_000_000n; // 100,000 ether
export const ACCEPT_WINDOW_SECS = 259200n; // 3 days
export const MAX_MEMO_BYTES = 80;
export const MAX_PAGE = 50;

export enum DuelState {
  Offered = 0,
  Active = 1,
  Settled = 2,
  Cancelled = 3,
}

export interface Match {
  a: `0x${string}`;
  b: `0x${string}`;
  state: DuelState;
  numDays: number;
  aBits: number;
  bBits: number;
  acceptBy: bigint;
  startDay: bigint;
  stake: bigint;
  winner: `0x${string}`;
  memoBlock: number;
}

export interface MatchData extends Match {
  id: bigint;
}

/**
 * Returns UTC day index for a given unix timestamp in seconds
 */
export function dayIndex(timestampSec: number | bigint): bigint {
  return BigInt(timestampSec) / 86400n;
}

/**
 * Returns relative day number during or before a duel:
 * 0 if offered/unaccepted, negative if before startDay (-1, -2...), positive if running (1, 2, ...)
 */
export function dayNumber(startDay: bigint, nowDay: bigint, state: DuelState): number {
  if (state === DuelState.Offered) return 0;
  if (nowDay < startDay) {
    return -Number(startDay - nowDay);
  }
  return Number(nowDay - startDay + 1n);
}

/**
 * Computes milliseconds remaining until the next UTC midnight
 */
export function msToMidnightUtc(nowSec: number | bigint): number {
  const sec = Number(nowSec);
  const nextMidnightSec = (Math.floor(sec / 86400) + 1) * 86400;
  return Math.max(0, (nextMidnightSec - sec) * 1000);
}

/**
 * Finds the first day index (0..n-1) where at least one player missed.
 * Returns -1 if neither player missed any of the first n days.
 */
export function firstMiss(aBits: number, bBits: number, n: number): number {
  for (let k = 0; k < n; k++) {
    const mask = 1 << k;
    const aDone = (aBits & mask) !== 0;
    const bDone = (bBits & mask) !== 0;
    if (!aDone || !bDone) {
      return k;
    }
  }
  return -1;
}

/**
 * Evaluates outcome mirroring contract settle logic:
 * returns { state, canSettle, winner, firstMissDay }
 */
export function outcome(
  aBits: number,
  bBits: number,
  numDays: number,
  startDay: bigint,
  nowDay: bigint,
  aAddr: `0x${string}`,
  bAddr: `0x${string}`
): {
  canSettle: boolean;
  winner: `0x${string}` | null; // null = draw / undecided
  firstMissDay: number;
  isDraw: boolean;
} {
  let n = 0;
  if (nowDay > startDay) {
    const elapsed = Number(nowDay - startDay);
    n = elapsed > numDays ? numDays : elapsed;
  }

  const missIdx = firstMiss(aBits, bBits, n);

  if (missIdx >= 0) {
    const mask = 1 << missIdx;
    const aDone = (aBits & mask) !== 0;
    const bDone = (bBits & mask) !== 0;

    if (!aDone && !bDone) {
      return {
        canSettle: true,
        winner: null,
        firstMissDay: missIdx,
        isDraw: true,
      };
    } else if (!aDone) {
      return {
        canSettle: true,
        winner: bAddr,
        firstMissDay: missIdx,
        isDraw: false,
      };
    } else {
      return {
        canSettle: true,
        winner: aAddr,
        firstMissDay: missIdx,
        isDraw: false,
      };
    }
  }

  if (n === numDays) {
    return {
      canSettle: true,
      winner: null,
      firstMissDay: 0,
      isDraw: true,
    };
  }

  return {
    canSettle: false,
    winner: null,
    firstMissDay: -1,
    isDraw: false,
  };
}

export function isCheckedIn(bits: number, dayIdx: number): boolean {
  if (dayIdx < 0 || dayIdx >= 32) return false;
  return ((bits >> dayIdx) & 1) === 1;
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

