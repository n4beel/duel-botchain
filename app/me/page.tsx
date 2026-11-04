"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useWriteContract } from "@/lib/useChainWrite";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { useToast } from "@/components/ui/Toast";
import { formatError } from "@/lib/errors";

export default function MyDuelRecordPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [withdrawing, setWithdrawing] = useState(false);

  // Read pending balance
  const { data: pendingBalance, refetch: refetchPending } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "pending",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address && contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  // Read matches for current user
  const { data: userMatches, isLoading: matchesLoading } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "byParty",
    args: [address || "0x0000000000000000000000000000000000000000", 0n, 50n],
    query: { enabled: !!address && contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const pendingAmount = pendingBalance ? (pendingBalance as bigint) : 0n;
  const matchIds = (userMatches ? (userMatches as any)[0] : []) as bigint[];

  const handleWithdraw = async () => {
    if (!address || pendingAmount === 0n) return;
    setWithdrawing(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "withdraw",
        args: [],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Funds Withdrawn", `${formatEther(pendingAmount)} BOT transferred to wallet!`);
      await refetchPending();
    } catch (err: any) {
      toast("error", "Withdraw Failed", formatError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <PageShell
      title="My Record & Balances"
      description="Track all your duels, check outcomes, and withdraw your winnings and returned stakes."
    >
      <div className="flex flex-col gap-8">
        {/* Pending Escrow / Winnings Panel */}
        <Panel laneStyle className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-heading text-lg font-bold uppercase text-[var(--text-secondary)]">
              Pending Claimable Balance
            </span>
            <span className="font-heading text-4xl md:text-5xl font-extrabold text-[var(--accent)]">
              {formatEther(pendingAmount)} BOT
            </span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Winnings from victorious duels and stakes from cancelled or tied duels.
            </span>
          </div>

          <Button
            size="lg"
            variant="primary"
            loading={withdrawing}
            disabled={withdrawing || pendingAmount === 0n}
            onClick={handleWithdraw}
            className="w-full sm:w-auto"
          >
            {pendingAmount === 0n ? "No Balance to Withdraw" : `Withdraw ${formatEther(pendingAmount)} BOT`}
          </Button>
        </Panel>

        {/* Duels List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold uppercase">
              Your Duel History ({matchIds.length})
            </h2>
            <Link href="/challenge">
              <Button size="sm">+ New Challenge</Button>
            </Link>
          </div>

          {!address && (
            <Panel className="text-center py-10">
              <p className="font-heading uppercase text-lg">Connect wallet to view your duels</p>
            </Panel>
          )}

          {address && matchesLoading && (
            <Panel className="text-center py-10">
              <p className="font-heading uppercase text-lg">Loading duels...</p>
            </Panel>
          )}

          {address && !matchesLoading && matchIds.length === 0 && (
            <Panel className="text-center py-12 flex flex-col items-center gap-3">
              <p className="font-heading uppercase text-xl">No duels found for this wallet</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Challenge someone or wait for a challenge to be sent to your address.
              </p>
              <Link href="/challenge">
                <Button size="sm">Create a Challenge</Button>
              </Link>
            </Panel>
          )}

          {address && !matchesLoading && matchIds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {matchIds.map((mId) => (
                <Panel key={mId.toString()} className="flex flex-col justify-between gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xl font-bold uppercase">
                      DUEL #{mId.toString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[var(--text-secondary)] font-semibold">
                      Duel record details and arena actions:
                    </span>
                  </div>
                  <Link href={`/duel/${mId.toString()}`}>
                    <Button size="sm" className="w-full">
                      Open Arena →
                    </Button>
                  </Link>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
