import { spawn } from "node:child_process";
import { createPublicClient, createWalletClient, defineChain, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BOTCHAIN_ABI } from "../lib/botchain/abi.js";

const PORT = 8761;
const RPC_URL = `http://127.0.0.1:${PORT}`;

const localChain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

async function main() {
  console.log(`Starting local Anvil on port ${PORT}...`);
  const anvil = spawn("anvil", ["-p", String(PORT)], { stdio: "ignore" });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(RPC_URL),
  });

  // Wait for anvil
  for (let i = 0; i < 30; i++) {
    try {
      await publicClient.getBlockNumber();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("Deploying Duel contract...");
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

  await new Promise((resolve, reject) => {
    deployer.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Deploy failed: ${output}`));
    });
  });

  const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
  if (!match) throw new Error("Could not find address");
  const contractAddress = match[1];
  console.log(`Duel deployed to: ${contractAddress}`);

  // Seeding roles
  const alice = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const bob = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const charlie = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

  const clientAlice = createWalletClient({ account: alice, chain: localChain, transport: http(RPC_URL) });
  const clientBob = createWalletClient({ account: bob, chain: localChain, transport: http(RPC_URL) });
  const clientCharlie = createWalletClient({ account: charlie, chain: localChain, transport: http(RPC_URL) });

  // Seed duels per §5:
  // duel 1 offered
  const t1 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 7, "5km Morning Run"],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t1 });

  // duel 2 active, day 3 of 7, both checked in
  const t2 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 7, "Daily Cold Plunge"],
    value: parseEther("1.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t2 });
  const a2 = await clientBob.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "accept",
    args: [2n],
    value: parseEther("1.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: a2 });

  // duel 3 where opponent missed day 2 (settleable)
  const t3 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 5, "No Sugar"],
    value: parseEther("2.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t3 });
  const a3 = await clientBob.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "accept",
    args: [3n],
    value: parseEther("2.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: a3 });

  // duel 4 where both missed the same day (draw)
  const t4 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 4, "100 Pushups"],
    value: parseEther("0.25"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t4 });
  const a4 = await clientBob.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "accept",
    args: [4n],
    value: parseEther("0.25"),
  });
  await publicClient.waitForTransactionReceipt({ hash: a4 });

  // duel 5 completed perfectly (draw)
  const t5 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 3, "Meditate 10m"],
    value: parseEther("0.1"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t5 });
  const a5 = await clientBob.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "accept",
    args: [5n],
    value: parseEther("0.1"),
  });
  await publicClient.waitForTransactionReceipt({ hash: a5 });

  // duel 6 settled with a winner
  const t6 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [bob.address, 3, "Read 20 pages"],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t6 });
  const a6 = await clientBob.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "accept",
    args: [6n],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: a6 });

  // duel 7 cancelled
  const t7 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "challenge",
    args: [charlie.address, 5, "Duolingo Daily"],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t7 });
  const c7 = await clientAlice.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "cancel",
    args: [7n],
  });
  await publicClient.waitForTransactionReceipt({ hash: c7 });

  console.log("Local stack ready with 7 duels! Press Ctrl+C to terminate.");
  process.on("SIGINT", () => {
    anvil.kill();
    process.exit();
  });
}

main().catch(console.error);
