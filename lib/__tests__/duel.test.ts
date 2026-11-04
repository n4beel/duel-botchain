import { describe, it, expect } from "vitest";
import {
  dayIndex,
  dayNumber,
  msToMidnightUtc,
  firstMiss,
  outcome,
  DuelState,
} from "../duel";

describe("Duel lib utilities", () => {
  it("computes dayIndex correctly", () => {
    expect(dayIndex(0)).toBe(0n);
    expect(dayIndex(86399)).toBe(0n);
    expect(dayIndex(86400)).toBe(1n);
    expect(dayIndex(172800)).toBe(2n);
  });

  it("computes dayNumber relative to startDay and state", () => {
    const startDay = 100n;
    expect(dayNumber(startDay, 99n, DuelState.Offered)).toBe(0);
    expect(dayNumber(startDay, 99n, DuelState.Active)).toBe(-1);
    expect(dayNumber(startDay, 100n, DuelState.Active)).toBe(1);
    expect(dayNumber(startDay, 105n, DuelState.Active)).toBe(6);
  });

  it("calculates msToMidnightUtc correctly", () => {
    // 3600 seconds into day (1:00 UTC) -> 82800 seconds left
    const ms = msToMidnightUtc(3600);
    expect(ms).toBe(82800 * 1000);
  });

  it("detects firstMiss correctly", () => {
    // Both checked in on day 0, day 1: aBits = 3, bBits = 3
    expect(firstMiss(3, 3, 2)).toBe(-1);

    // Day 0: Alice checks in (bit 0 = 1), Bob misses (bit 0 = 0)
    expect(firstMiss(1, 0, 1)).toBe(0);

    // Day 0 both made it (1), Day 1 Alice misses, Bob made it:
    // aBits = 1 (1 << 0), bBits = 3 (1 | 2)
    expect(firstMiss(1, 3, 2)).toBe(1);
  });

  it("evaluates outcome for winner A, winner B, and draw", () => {
    const startDay = 100n;
    const nowDay = 103n; // Days 0, 1, 2 completed
    const aAddr = "0xAAAA" as `0x${string}`;
    const bAddr = "0xBBBB" as `0x${string}`;

    // Alice made day 0, 1, 2; Bob missed day 1
    const resA = outcome(7, 5, 3, startDay, nowDay, aAddr, bAddr);
    expect(resA.canSettle).toBe(true);
    expect(resA.winner).toBe(aAddr);
    expect(resA.firstMissDay).toBe(1);

    // Bob made day 0, 1, 2; Alice missed day 0
    const resB = outcome(6, 7, 3, startDay, nowDay, aAddr, bAddr);
    expect(resB.canSettle).toBe(true);
    expect(resB.winner).toBe(bAddr);
    expect(resB.firstMissDay).toBe(0);

    // Both made all 3 days -> Draw at end of duel
    const resDraw = outcome(7, 7, 3, startDay, nowDay, aAddr, bAddr);
    expect(resDraw.canSettle).toBe(true);
    expect(resDraw.isDraw).toBe(true);
    expect(resDraw.winner).toBeNull();
  });
});
