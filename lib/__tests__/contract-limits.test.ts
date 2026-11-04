import { describe, it, expect } from "vitest";
import {
  MIN_DAYS,
  MAX_DAYS,
  MIN_STAKE,
  MAX_STAKE,
  MAX_MEMO_BYTES,
} from "../duel";
import { BOTCHAIN_ABI } from "../botchain/abi";

describe("Duel contract limits parity", () => {
  it("matches constant limits in ABI", () => {
    const minDaysAbi = BOTCHAIN_ABI.find((x: any) => x.name === "MIN_DAYS");
    expect(minDaysAbi).toBeDefined();

    const maxDaysAbi = BOTCHAIN_ABI.find((x: any) => x.name === "MAX_DAYS");
    expect(maxDaysAbi).toBeDefined();

    const minStakeAbi = BOTCHAIN_ABI.find((x: any) => x.name === "MIN_STAKE");
    expect(minStakeAbi).toBeDefined();

    const maxStakeAbi = BOTCHAIN_ABI.find((x: any) => x.name === "MAX_STAKE");
    expect(maxStakeAbi).toBeDefined();

    expect(MIN_DAYS).toBe(3);
    expect(MAX_DAYS).toBe(30);
    expect(MIN_STAKE).toBe(10_000_000_000_000_000n);
    expect(MAX_STAKE).toBe(100_000_000_000_000_000_000_000n);
    expect(MAX_MEMO_BYTES).toBe(80);
  });
});
