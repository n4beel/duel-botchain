import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import { createPublicClient, createWalletClient, defineChain, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BOTCHAIN_ABI } from "../../lib/botchain/abi";
import { outcome, DuelState } from "../../lib/duel";

const ANVIL_PORT = 8661;
const RPC_URL = `http://127.0.0.1:${ANVIL_PORT}`;

const localChain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

describe("Duel Integration Test", () => {
  let anvil: ChildProcess;

  const playerA = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const playerB = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const outsider = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(RPC_URL),
  });

  const clientA = createWalletClient({
    account: playerA,
    chain: localChain,
    transport: http(RPC_URL),
  });

  const clientB = createWalletClient({
    account: playerB,
    chain: localChain,
    transport: http(RPC_URL),
  });

  const clientOutsider = createWalletClient({
    account: outsider,
    chain: localChain,
    transport: http(RPC_URL),
  });

  let duelAddress: `0x${string}`;

  beforeAll(async () => {
    anvil = spawn("anvil", ["-p", String(ANVIL_PORT)], {
      stdio: "ignore",
    });

    for (let i = 0; i < 30; i++) {
      try {
        await publicClient.getBlockNumber();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const deployer = spawn(
      "forge",
      [
        "create",
        "contracts/src/Duel.sol:Duel",
        "--rpc-url",
        RPC_URL,
        "--private-key",
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "--broadcast",
      ],
      { cwd: process.cwd() }
    );

    let output = "";
    deployer.stdout.on("data", (d) => (output += d.toString()));
    deployer.stderr.on("data", (d) => (output += d.toString()));

    await new Promise<void>((resolve, reject) => {
      deployer.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Deploy failed: ${output}`));
      });
    });

    const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
    if (!match) throw new Error(`Could not find deployed address: ${output}`);
    duelAddress = match[1] as `0x${string}`;
  }, 30000);

  afterAll(() => {
    if (anvil) {
      anvil.kill();
    }
  });

  it("handles the complete duel lifecycle: challenge -> accept -> check-ins -> settle -> withdraw", async () => {
    const stake = parseEther("1.0");
    const numDays = 3;

    // 1. Challenge
    const challengeTx = await clientA.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "challenge",
      args: [playerB.address, numDays, "Morning run 5k"],
      value: stake,
    });
    await publicClient.waitForTransactionReceipt({ hash: challengeTx });

    const id = 1n;
    const match1 = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "matchOf",
      args: [id],
    })) as any;

    expect(match1.state).toBe(DuelState.Offered);
    expect(match1.a.toLowerCase()).toBe(playerA.address.toLowerCase());
    expect(match1.b.toLowerCase()).toBe(playerB.address.toLowerCase());
    expect(match1.stake).toBe(stake);
    expect(match1.numDays).toBe(numDays);

    // 2. Accept
    const acceptTx = await clientB.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "accept",
      args: [id],
      value: stake,
    });
    await publicClient.waitForTransactionReceipt({ hash: acceptTx });

    const matchAccepted = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "matchOf",
      args: [id],
    })) as any;

    expect(matchAccepted.state).toBe(DuelState.Active);
    const startDay = BigInt(matchAccepted.startDay);

    // Advance to day 0 (startDay) at noon UTC
    const day0Time = Number(startDay * 86400n + 43200n);
    await (publicClient.request as any)({
      method: "evm_setNextBlockTimestamp",
      params: [day0Time],
    });
    await (publicClient.request as any)({ method: "evm_mine", params: [] });

    // Day 0: both A and B check in
    const checkATx0 = await clientA.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "checkIn",
      args: [id],
    });
    await publicClient.waitForTransactionReceipt({ hash: checkATx0 });

    const checkBTx0 = await clientB.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "checkIn",
      args: [id],
    });
    await publicClient.waitForTransactionReceipt({ hash: checkBTx0 });

    // Advance to Day 1 at noon UTC
    const day1Time = Number((startDay + 1n) * 86400n + 43200n);
    await (publicClient.request as any)({
      method: "evm_setNextBlockTimestamp",
      params: [day1Time],
    });
    await (publicClient.request as any)({ method: "evm_mine", params: [] });

    // Day 1: A checks in, B misses!
    const checkATx1 = await clientA.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "checkIn",
      args: [id],
    });
    await publicClient.waitForTransactionReceipt({ hash: checkATx1 });

    // Advance to Day 2 at noon UTC (so Day 1 is fully elapsed)
    const day2Time = Number((startDay + 2n) * 86400n + 43200n);
    await (publicClient.request as any)({
      method: "evm_setNextBlockTimestamp",
      params: [day2Time],
    });
    await (publicClient.request as any)({ method: "evm_mine", params: [] });

    // Check status view
    const status = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "status",
      args: [id],
    })) as [bigint, bigint, number, boolean];

    const [today, sDay, dayNum, canSettle] = status;
    expect(canSettle).toBe(true);

    const mCurrent = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "matchOf",
      args: [id],
    })) as any;

    // Test library parity
    const outcomeResult = outcome(
      mCurrent.aBits,
      mCurrent.bBits,
      mCurrent.numDays,
      sDay,
      today,
      mCurrent.a,
      mCurrent.b
    );
    expect(outcomeResult.canSettle).toBe(true);
    expect(outcomeResult.winner).not.toBeNull();
    expect(outcomeResult.winner!.toLowerCase()).toBe(playerA.address.toLowerCase());
    expect(outcomeResult.firstMissDay).toBe(1);

    // Settle by outsider
    const settleTx = await clientOutsider.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "settle",
      args: [id],
    });
    await publicClient.waitForTransactionReceipt({ hash: settleTx });

    const mAfter = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "matchOf",
      args: [id],
    })) as any;

    expect(mAfter.state).toBe(DuelState.Settled);
    expect(mAfter.winner.toLowerCase()).toBe(playerA.address.toLowerCase());

    // Pending checks: Player A gets 2 * stake = 2 ether
    const pendingA = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "pending",
      args: [playerA.address],
    })) as bigint;
    expect(pendingA).toBe(stake * 2n);

    // Withdraw by player A
    const withdrawTx = await clientA.writeContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "withdraw",
      args: [],
    });
    await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

    const pendingAAfter = (await publicClient.readContract({
      address: duelAddress,
      abi: BOTCHAIN_ABI,
      functionName: "pending",
      args: [playerA.address],
    })) as bigint;
    expect(pendingAAfter).toBe(0n);
  });
});
