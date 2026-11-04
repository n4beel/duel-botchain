"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { useWriteContract } from "@/lib/useChainWrite";
import { parseEther, isAddress } from "viem";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { useToast } from "@/components/ui/Toast";
import { formatError } from "@/lib/errors";

export default function ChallengePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [opponent, setOpponent] = useState("");
  const [numDays, setNumDays] = useState("7");
  const [stake, setStake] = useState("0.1");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast("error", "Wallet not connected", "Connect wallet to challenge");
      return;
    }

    if (!isAddress(opponent)) {
      toast("error", "Invalid Opponent", "Enter a valid hex address");
      return;
    }

    if (opponent.toLowerCase() === address.toLowerCase()) {
      toast("error", "Bad Opponent", "You cannot duel yourself");
      return;
    }

    const daysNum = parseInt(numDays, 10);
    if (isNaN(daysNum) || daysNum < 3 || daysNum > 30) {
      toast("error", "Bad Length", "Duration must be 3 to 30 days");
      return;
    }

    let parsedStake: bigint;
    try {
      parsedStake = parseEther(stake);
      if (parsedStake < parseEther("0.01") || parsedStake > parseEther("100000")) {
        toast("error", "Bad Stake", "Stake must be 0.01 to 100,000 BOT");
        return;
      }
    } catch {
      toast("error", "Invalid Stake", "Enter a valid number");
      return;
    }

    if (new TextEncoder().encode(memo).length > 80) {
      toast("error", "Memo Too Long", "Memo max 80 bytes");
      return;
    }

    setSubmitting(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "challenge",
        args: [opponent as `0x${string}`, daysNum, memo],
        value: parsedStake,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast("success", "Challenge Created", "Duel issued successfully!");
      router.push("/");
    } catch (err: any) {
      toast("error", "Challenge Failed", formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Issue a Challenge"
      description="Lock your stake and challenge a friend to a head-to-head habit race."
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <Panel laneStyle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Opponent input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="opponent" className="font-heading text-lg font-bold uppercase">
                Opponent Address
              </label>
              <input
                id="opponent"
                type="text"
                placeholder="0x..."
                value={opponent}
                onChange={(e) => setOpponent(e.target.value.trim())}
                required
                className="w-full px-3 py-2 border-2 border-[var(--accent)] bg-white text-sm font-mono focus:outline-none"
              />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                The address of the player you want to race against.
              </span>
            </div>

            {/* Duration input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="numDays" className="font-heading text-lg font-bold uppercase">
                Duration (3 to 30 Days)
              </label>
              <input
                id="numDays"
                type="number"
                min="3"
                max="30"
                step="1"
                value={numDays}
                onChange={(e) => setNumDays(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-[var(--accent)] bg-white text-sm font-bold focus:outline-none"
              />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Both players must check in every day for this full period.
              </span>
            </div>

            {/* Stake input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stake" className="font-heading text-lg font-bold uppercase">
                Your Stake (BOT)
              </label>
              <input
                id="stake"
                type="number"
                step="any"
                min="0.01"
                max="100000"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-[var(--accent)] bg-white text-sm font-bold focus:outline-none"
              />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Opponent must match this exact stake to accept. Winner takes both ({stake ? (parseFloat(stake) * 2).toFixed(2) : "0"} BOT).
              </span>
            </div>

            {/* Memo input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="memo" className="font-heading text-lg font-bold uppercase">
                Habit Description / Memo (Max 80 Bytes)
              </label>
              <input
                id="memo"
                type="text"
                maxLength={80}
                placeholder="e.g. 5km run before 8am daily"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[var(--accent)] bg-white text-sm focus:outline-none"
              />
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Describe the agreed habit so both of you know the terms.
              </span>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={submitting || !address}
              className="mt-2 w-full"
            >
              {submitting ? "Issuing Challenge..." : "Lock Stake & Challenge"}
            </Button>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}
