"use client";

import { use, useState } from "react";
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
import { DuelState, dayIndex, outcome, isCheckedIn, formatAddress } from "@/lib/duel";
import SplitLanes from "@/components/lanes/SplitLanes";
import { useToast } from "@/components/ui/Toast";
import { formatError } from "@/lib/errors";

export default function DuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = BigInt(resolvedParams.id);

  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: activeBotChain.id });
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [txBusy, setTxBusy] = useState(false);

  // Read match data
  const { data: matchData, refetch: refetchMatch } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "matchOf",
    args: [id],
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  // Read status data
  const { data: statusData, refetch: refetchStatus } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "status",
    args: [id],
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const refetchAll = async () => {
    await Promise.all([refetchMatch(), refetchStatus()]);
  };

  const m = matchData as any;
  const status = statusData as [bigint, bigint, number, boolean] | undefined;

  if (!m || !m.a || m.a === "0x0000000000000000000000000000000000000000") {
    return (
      <PageShell title="Duel Not Found">
        <Panel className="text-center py-12">
          <p className="font-heading text-xl uppercase mb-3">Duel #{id.toString()} does not exist</p>
          <Link href="/">
            <Button size="sm">Back to Duels</Button>
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const state = Number(m.state) as DuelState;
  const isOffered = state === DuelState.Offered;
  const isActive = state === DuelState.Active;
  const isSettled = state === DuelState.Settled;
  const isCancelled = state === DuelState.Cancelled;

  const playerA = m.a as `0x${string}`;
  const playerB = m.b as `0x${string}`;
  const isPlayerA = address?.toLowerCase() === playerA.toLowerCase();
  const isPlayerB = address?.toLowerCase() === playerB.toLowerCase();
  const isParticipant = isPlayerA || isPlayerB;

  const nowDay = status ? status[0] : dayIndex(Math.floor(Date.now() / 1000));
  const startDay = BigInt(m.startDay);
  const elapsedDays = nowDay >= startDay ? Number(nowDay - startDay) : -1;
  const dayNumber = status ? status[2] : (elapsedDays >= 0 ? elapsedDays + 1 : 0);
  const canSettleContract = status ? status[3] : false;

  const oc = outcome(m.aBits, m.bBits, m.numDays, startDay, nowDay, playerA, playerB);

  // Check in status for current user today
  const myCheckedInToday = isParticipant && elapsedDays >= 0 && elapsedDays < m.numDays
    ? isCheckedIn(isPlayerA ? m.aBits : m.bBits, elapsedDays)
    : false;

  const opponentMissed = isParticipant && oc && oc.firstMissDay >= 0 && (
    (isPlayerA && oc.winner?.toLowerCase() === playerA.toLowerCase()) ||
    (isPlayerB && oc.winner?.toLowerCase() === playerB.toLowerCase())
  );

  const userMissed = isParticipant && oc && oc.firstMissDay >= 0 && (
    (isPlayerA && oc.winner?.toLowerCase() === playerB.toLowerCase()) ||
    (isPlayerB && oc.winner?.toLowerCase() === playerA.toLowerCase())
  );

  // Actions
  const handleAccept = async () => {
    setTxBusy(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "accept",
        args: [id],
        value: m.stake,
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Accepted!", "Duel is now active!");
      await refetchAll();
    } catch (err: any) {
      toast("error", "Accept Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  const handleCancel = async () => {
    setTxBusy(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "cancel",
        args: [id],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Cancelled", "Stake refunded!");
      await refetchAll();
    } catch (err: any) {
      toast("error", "Cancel Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  const handleCheckIn = async () => {
    setTxBusy(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "checkIn",
        args: [id],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Checked In!", `Recorded for day ${dayNumber}!`);
      await refetchAll();
    } catch (err: any) {
      toast("error", "Check-in Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  const handleSettle = async () => {
    setTxBusy(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "settle",
        args: [id],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Duel Settled", "Prizes moved to pending balance!");
      await refetchAll();
    } catch (err: any) {
      toast("error", "Settle Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--accent)] pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-4xl font-extrabold uppercase">
                DUEL #{id.toString()}
              </h1>
              <span className="font-heading text-sm px-3 py-1 rounded font-bold uppercase" style={{
                background: isOffered ? "var(--warning)" : isActive ? "var(--accent)" : isSettled ? "var(--success)" : "var(--danger)",
                color: isOffered ? "#FFFFFF" : isActive ? "var(--accent-ink)" : "#FFFFFF",
              }}>
                {isOffered ? "Offered (Awaiting Acceptance)" : isActive ? "Active In Progress" : isSettled ? "Settled" : "Cancelled"}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Chain UTC Day: {nowDay.toString()} {isActive && `· Day ${dayNumber} of ${m.numDays}`}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase text-[var(--text-secondary)] font-bold">Total Stake</span>
              <span className="font-heading text-2xl font-bold">
                {formatEther(isActive || isSettled ? m.stake * 2n : m.stake)} BOT
              </span>
            </div>
          </div>
        </div>

        {/* Lanes View */}
        <Panel laneStyle className="flex flex-col gap-6">
          <SplitLanes
            numDays={m.numDays}
            aBits={m.aBits}
            bBits={m.bBits}
            startDay={startDay}
            currentDay={nowDay}
            playerA={playerA}
            playerB={playerB}
            connectedAddress={address}
            winner={m.winner}
            firstMissDay={oc ? oc.firstMissDay : -1}
            isSettled={isSettled}
          />

          {/* Player status banners */}
          {isActive && (
            <div className="flex flex-col gap-2">
              {opponentMissed && (
                <div className="p-3 bg-[#E8F8EE] border-2 border-[var(--success)] text-xs font-bold text-[var(--success)]">
                  ★ OPPONENT MISSED A DAY! You have won the duel. You or anyone can settle to claim both stakes.
                </div>
              )}
              {userMissed && (
                <div className="p-3 bg-[#FDE8E8] border-2 border-[var(--danger)] text-xs font-bold text-[var(--danger)]">
                  ⚠ YOU MISSED A DAY: The flag marks your miss. You can still check in but you cannot win this duel.
                </div>
              )}
              {oc && oc.isDraw && oc.canSettle && (
                <div className="p-3 bg-[#FFF3CD] border-2 border-[var(--warning)] text-xs font-bold text-[#8A5A00]">
                  🤝 DUEL ENDED IN A DRAW. Both players completed or missed identically. Both stakes can be refunded.
                </div>
              )}
            </div>
          )}

          {isSettled && (
            <div className="p-4 bg-[var(--bg-elevated)] border-2 border-[var(--accent)] flex flex-col gap-1 text-center">
              <span className="font-heading text-xl font-bold uppercase">Duel Concluded</span>
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {m.winner === "0x0000000000000000000000000000000000000000"
                  ? "Result was a DRAW. Both players received their stakes back in pending balance."
                  : `Winner is ${formatAddress(m.winner)}! Both stakes awarded.`}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
            {/* Left side info */}
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              {isOffered && (
                <span>Accept window closes in ~{Math.max(0, Math.floor(Number(m.acceptBy - BigInt(Math.floor(Date.now() / 1000))) / 3600))} hours</span>
              )}
              {isActive && (
                <span>Next UTC midnight rolls in {Math.floor((86400 - (Math.floor(Date.now() / 1000) % 86400)) / 3600)}h {Math.floor(((86400 - (Math.floor(Date.now() / 1000) % 86400)) % 3600) / 60)}m</span>
              )}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              {/* Check in button - Primary Transaction */}
              {isActive && isParticipant && (
                <Button
                  size="lg"
                  variant="primary"
                  loading={txBusy}
                  disabled={txBusy || myCheckedInToday || elapsedDays < 0 || elapsedDays >= m.numDays}
                  onClick={handleCheckIn}
                >
                  {myCheckedInToday
                    ? `Checked In For Day ${dayNumber} ✓`
                    : elapsedDays < 0
                    ? "Duel Starts Tomorrow"
                    : elapsedDays >= m.numDays
                    ? "Duel Finished"
                    : `Check in for day ${dayNumber} of ${m.numDays}`}
                </Button>
              )}

              {/* Settle button */}
              {isActive && (canSettleContract || oc.canSettle) && (
                <Button
                  size="lg"
                  variant="lane"
                  loading={txBusy}
                  disabled={txBusy}
                  onClick={handleSettle}
                >
                  Settle Duel Now
                </Button>
              )}

              {/* Accept button for opponent */}
              {isOffered && isPlayerB && (
                <Button
                  size="lg"
                  variant="primary"
                  loading={txBusy}
                  disabled={txBusy}
                  onClick={handleAccept}
                >
                  Accept Duel ({formatEther(m.stake)} BOT)
                </Button>
              )}

              {/* Cancel button for challenger */}
              {isOffered && isPlayerA && (
                <Button
                  size="md"
                  variant="danger"
                  loading={txBusy}
                  disabled={txBusy}
                  onClick={handleCancel}
                >
                  Cancel Challenge
                </Button>
              )}
            </div>
          </div>
        </Panel>

        {/* Details & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel>
            <h3 className="font-heading text-lg font-bold uppercase mb-2">Duel Terms</h3>
            <ul className="text-xs space-y-1 font-medium" style={{ color: "var(--text-secondary)" }}>
              <li><strong>Challenger (Player A):</strong> {formatAddress(playerA)} {isPlayerA && "(You)"}</li>
              <li><strong>Opponent (Player B):</strong> {formatAddress(playerB)} {isPlayerB && "(You)"}</li>
              <li><strong>Duration:</strong> {m.numDays} Consecutive UTC Days</li>
              <li><strong>Each Stake:</strong> {formatEther(m.stake)} BOT</li>
              <li><strong>Total Pot:</strong> {formatEther(m.stake * 2n)} BOT</li>
            </ul>
          </Panel>

          <Panel>
            <h3 className="font-heading text-lg font-bold uppercase mb-2">Rules of Engagement</h3>
            <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Both players must make at least one check-in transaction during each UTC day (00:00 to 23:59 UTC).
              As soon as a day elapses where one player checked in and the other failed, the duel is won by the survivor.
              If both miss the same day or neither misses, the pot is divided equally.
            </p>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
