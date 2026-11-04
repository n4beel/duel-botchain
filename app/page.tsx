"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { DuelState, dayIndex, outcome, formatAddress } from "@/lib/duel";
import SplitLanes from "@/components/lanes/SplitLanes";

export default function HomePage() {
  const { address } = useAccount();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  // Read latest matchCount
  const { data: matchCountData } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "matchCount",
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const count = matchCountData ? Number(matchCountData) : 0;

  // Read latest matches
  const { data: latestMatchesData, isLoading } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "latest",
    args: [0n, BigInt(Math.min(count, 10))],
    query: { enabled: count > 0 && contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const matches = (latestMatchesData ? (latestMatchesData as any)[1] : []) as any[];
  const nowDay = dayIndex(Math.floor(Date.now() / 1000));

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        {/* Hero section */}
        <Panel laneStyle className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold uppercase tracking-tight leading-none">
              Two People. Seven Days. <br />
              <span className="text-[var(--danger)]">Miss One And You Pay.</span>
            </h1>
            <p className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>
              A staked head-to-head race. Check in once every UTC day. The first day with a missed habit decides the winner who takes both stakes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link href="/challenge" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Challenge Opponent
              </Button>
            </Link>
            <Link href="/me" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full">
                My Duels
              </Button>
            </Link>
          </div>
        </Panel>

        {/* What Counts & Limitations Panel */}
        <Panel className="border-2 border-[var(--accent)] bg-white">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wider mb-3">
            What counts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1">
              <span className="font-heading text-sm uppercase text-[var(--accent)]">Habit Honesty</span>
              <p style={{ color: "var(--text-secondary)" }}>
                A check-in proves your wallet showed up. It doesn&apos;t prove the habit happened. Keep each other honest off-chain.
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1">
              <span className="font-heading text-sm uppercase text-[var(--accent)]">UTC Midnight</span>
              <p style={{ color: "var(--text-secondary)" }}>
                A day is a UTC day, the same moment for both of you. A check-in at 23:59 UTC counts; at 00:01 UTC it is the next day.
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1">
              <span className="font-heading text-sm uppercase text-[var(--accent)]">First Miss Decides</span>
              <p style={{ color: "var(--text-secondary)" }}>
                The first missed day decides it. Catching up later doesn&apos;t help. Nobody can reschedule, pause, or forgive a missed day.
              </p>
            </div>
          </div>
        </Panel>

        {/* Live Duels List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-3xl font-extrabold uppercase tracking-wide">
              Recent Duels ({count})
            </h2>
            <Link href="/challenge">
              <Button size="sm">+ New Challenge</Button>
            </Link>
          </div>

          {isLoading && (
            <Panel className="text-center py-10">
              <p className="font-heading uppercase text-lg">Loading duels...</p>
            </Panel>
          )}

          {!isLoading && matches.length === 0 && (
            <Panel className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <p className="font-heading uppercase text-2xl">No duels found</p>
              <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
                Challenge a friend to a 3 to 30 day habit duel with staked BOT tokens.
              </p>
              <Link href="/challenge">
                <Button size="md">Create First Duel</Button>
              </Link>
            </Panel>
          )}

          {!isLoading && matches.length > 0 && (
            <div className="flex flex-col gap-6">
              {matches.map((m: any, idx: number) => {
                const id = BigInt(count - idx);
                const s = Number(m.state);
                const isOffered = s === DuelState.Offered;
                const isActive = s === DuelState.Active;
                const isSettled = s === DuelState.Settled;

                const oc = isActive
                  ? outcome(m.aBits, m.bBits, m.numDays, BigInt(m.startDay), nowDay, m.a, m.b)
                  : null;

                return (
                  <Panel key={id.toString()} laneStyle className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-2xl font-bold uppercase">
                          DUEL #{id.toString()}
                        </span>
                        <span className="font-heading text-sm px-2.5 py-0.5 rounded font-bold uppercase" style={{
                          background: isOffered ? "var(--warning)" : isActive ? "var(--accent)" : isSettled ? "var(--success)" : "var(--danger)",
                          color: isOffered ? "#FFFFFF" : isActive ? "var(--accent-ink)" : "#FFFFFF",
                        }}>
                          {isOffered ? "Offered" : isActive ? "Active" : isSettled ? "Settled" : "Cancelled"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span>Stake: <strong>{formatEther(m.stake)} BOT</strong></span>
                        <span>Length: <strong>{m.numDays} Days</strong></span>
                        <Link href={`/duel/${id.toString()}`}>
                          <Button size="sm">View Arena →</Button>
                        </Link>
                      </div>
                    </div>

                    {/* Split Lanes Preview */}
                    <SplitLanes
                      numDays={m.numDays}
                      aBits={m.aBits}
                      bBits={m.bBits}
                      startDay={BigInt(m.startDay)}
                      currentDay={nowDay}
                      playerA={m.a}
                      playerB={m.b}
                      connectedAddress={address}
                      winner={m.winner}
                      firstMissDay={oc ? oc.firstMissDay : -1}
                      isSettled={isSettled}
                    />
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
