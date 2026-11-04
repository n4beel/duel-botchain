"use client";

import { useId, useState } from "react";
import { formatAddress } from "@/lib/duel";

export interface SplitLanesProps {
  numDays: number;
  aBits: number;
  bBits: number;
  startDay: bigint;
  currentDay: bigint; // UTC day index
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  connectedAddress?: `0x${string}`;
  winner?: `0x${string}` | null;
  firstMissDay?: number; // 0-indexed day index or -1 if no miss
  isSettled?: boolean;
}

export default function SplitLanes({
  numDays,
  aBits,
  bBits,
  startDay,
  currentDay,
  playerA,
  playerB,
  connectedAddress,
  winner,
  firstMissDay = -1,
  isSettled = false,
}: SplitLanesProps) {
  const tableId = useId();
  const [showTable, setShowTable] = useState(false);

  // Day calculations
  // elapsed days from startDay: today - startDay
  const elapsedDays = currentDay >= startDay ? Number(currentDay - startDay) : -1;
  const isStarted = currentDay >= startDay;

  // Cells configuration
  const cellWidth = 44;
  const cellHeight = 36;
  const gap = 8;
  const laneLabelWidth = 140;
  const finishLineWidth = 30;
  const totalSvgWidth = laneLabelWidth + numDays * (cellWidth + gap) + finishLineWidth + 20;
  const svgHeight = 160;

  // Render day cells data
  const days = Array.from({ length: numDays }, (_, i) => {
    const mask = 1 << i;
    const aChecked = (aBits & mask) !== 0;
    const bChecked = (bBits & mask) !== 0;
    const isPast = elapsedDays > i;
    const isToday = elapsedDays === i;
    const isFuture = elapsedDays < i;
    const isMissPoint = firstMissDay === i;

    return {
      dayNum: i + 1,
      dayIndex: i,
      aChecked,
      bChecked,
      isPast,
      isToday,
      isFuture,
      isMissPoint,
      aMissed: isPast && !aChecked,
      bMissed: isPast && !bChecked,
    };
  });

  const isUserA = connectedAddress?.toLowerCase() === playerA.toLowerCase();
  const isUserB = connectedAddress?.toLowerCase() === playerB.toLowerCase();

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Visual Controls / Accessibility Toggle */}
      <div className="flex items-center justify-between text-xs font-semibold px-1">
        <div className="flex items-center gap-2">
          <span className="font-heading uppercase tracking-wider text-sm" style={{ color: "var(--text-primary)" }}>
            Split Track ({numDays} Days)
          </span>
          {isStarted && elapsedDays < numDays && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              DAY {elapsedDays + 1} OF {numDays}
            </span>
          )}
          {isStarted && elapsedDays >= numDays && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ background: "var(--success)", color: "#FFFFFF" }}
            >
              RACE FINISHED
            </span>
          )}
          {!isStarted && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ background: "var(--warning)", color: "#FFFFFF" }}
            >
              STARTS AT NEXT UTC MIDNIGHT
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-controls={tableId}
          className="text-xs uppercase underline tracking-wider font-semibold cursor-pointer hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          {showTable ? "Hide data table" : "Show accessible table"}
        </button>
      </div>

      {/* SVG Running Lanes Container - Scrollable horizontally on small screens */}
      <div
        className="w-full overflow-x-auto border-2 rounded-none p-3 shadow-inner"
        style={{
          borderColor: "var(--accent)",
          background: "var(--bg-surface)",
        }}
      >
        <svg
          viewBox={`0 0 ${totalSvgWidth} ${svgHeight}`}
          className="w-full min-w-[580px] h-auto block"
          style={{ maxHeight: "200px" }}
          aria-hidden="true"
        >
          {/* Definitions */}
          <defs>
            <pattern id="finishPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#210016" />
              <rect x="5" y="5" width="5" height="5" fill="#210016" />
              <rect x="5" y="0" width="5" height="5" fill="#FFFFFF" />
              <rect x="0" y="5" width="5" height="5" fill="#FFFFFF" />
            </pattern>
          </defs>

          {/* Lane Tracks Background */}
          {/* Lane A */}
          <rect
            x={laneLabelWidth - 10}
            y={24}
            width={numDays * (cellWidth + gap) + 10}
            height={cellHeight + 10}
            fill="#FFF0FA"
            stroke="#E042B0"
            strokeWidth="1"
            rx="2"
          />
          {/* Lane B */}
          <rect
            x={laneLabelWidth - 10}
            y={84}
            width={numDays * (cellWidth + gap) + 10}
            height={cellHeight + 10}
            fill="#FFF0FA"
            stroke="#E042B0"
            strokeWidth="1"
            rx="2"
          />

          {/* Lane A Label */}
          <text
            x={10}
            y={48}
            className="font-heading"
            fill="var(--text-primary)"
            fontSize="14"
            fontWeight="700"
          >
            LANE A {isUserA ? "(YOU)" : ""}
          </text>
          <text
            x={10}
            y={64}
            fill="var(--text-secondary)"
            fontSize="11"
            fontFamily="monospace"
          >
            {formatAddress(playerA)}
          </text>

          {/* Lane B Label */}
          <text
            x={10}
            y={108}
            className="font-heading"
            fill="var(--text-primary)"
            fontSize="14"
            fontWeight="700"
          >
            LANE B {isUserB ? "(YOU)" : ""}
          </text>
          <text
            x={10}
            y={124}
            fill="var(--text-secondary)"
            fontSize="11"
            fontFamily="monospace"
          >
            {formatAddress(playerB)}
          </text>

          {/* Days Header numbers */}
          {days.map((d, i) => {
            const x = laneLabelWidth + i * (cellWidth + gap);
            return (
              <text
                key={`h-${i}`}
                x={x + cellWidth / 2}
                y={15}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                fontWeight="700"
              >
                D{d.dayNum}
              </text>
            );
          })}

          {/* Finish Line */}
          <rect
            x={laneLabelWidth + numDays * (cellWidth + gap) + 5}
            y={24}
            width={16}
            height={106}
            fill="url(#finishPattern)"
            stroke="#210016"
            strokeWidth="2"
          />
          <text
            x={laneLabelWidth + numDays * (cellWidth + gap) + 13}
            y={145}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="10"
            fontWeight="bold"
          >
            GOAL
          </text>

          {/* Cells for Lane A and B */}
          {days.map((d, i) => {
            const x = laneLabelWidth + i * (cellWidth + gap);

            // Lane A cell
            const aY = 29;
            const bY = 89;

            return (
              <g key={`cell-${i}`}>
                {/* Cell A */}
                <rect
                  x={x}
                  y={aY}
                  width={cellWidth}
                  height={cellHeight}
                  fill={d.aChecked ? "var(--accent)" : d.aMissed ? "var(--danger)" : "#FFFFFF"}
                  stroke={d.isToday ? "var(--accent)" : "#C13797"}
                  strokeWidth={d.isToday ? "2" : "1"}
                  rx="2"
                />
                {d.aChecked && (
                  <text
                    x={x + cellWidth / 2}
                    y={aY + 23}
                    textAnchor="middle"
                    fill="var(--accent-ink)"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    ✓
                  </text>
                )}
                {d.aMissed && (
                  <text
                    x={x + cellWidth / 2}
                    y={aY + 23}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="16"
                    fontWeight="bold"
                  >
                    ✗
                  </text>
                )}

                {/* Cell B */}
                <rect
                  x={x}
                  y={bY}
                  width={cellWidth}
                  height={cellHeight}
                  fill={d.bChecked ? "var(--accent)" : d.bMissed ? "var(--danger)" : "#FFFFFF"}
                  stroke={d.isToday ? "var(--accent)" : "#C13797"}
                  strokeWidth={d.isToday ? "2" : "1"}
                  rx="2"
                />
                {d.bChecked && (
                  <text
                    x={x + cellWidth / 2}
                    y={bY + 23}
                    textAnchor="middle"
                    fill="var(--accent-ink)"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    ✓
                  </text>
                )}
                {d.bMissed && (
                  <text
                    x={x + cellWidth / 2}
                    y={bY + 23}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="16"
                    fontWeight="bold"
                  >
                    ✗
                  </text>
                )}

                {/* First miss indicator / Flag */}
                {d.isMissPoint && (
                  <g>
                    <line
                      x1={x + cellWidth / 2}
                      y1={18}
                      x2={x + cellWidth / 2}
                      y2={132}
                      stroke="var(--danger)"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={x - 20}
                      y={136}
                      width={cellWidth + 40}
                      height={18}
                      fill="var(--danger)"
                      rx="2"
                    />
                    <text
                      x={x + cellWidth / 2}
                      y={149}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      DECIDING MISS
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Today Indicator Line (if duel in progress) */}
          {isStarted && elapsedDays >= 0 && elapsedDays < numDays && (
            <g>
              <line
                x1={laneLabelWidth + elapsedDays * (cellWidth + gap) + cellWidth / 2}
                y1={20}
                x2={laneLabelWidth + elapsedDays * (cellWidth + gap) + cellWidth / 2}
                y2={130}
                stroke="var(--accent)"
                strokeWidth="2"
              />
              <circle
                cx={laneLabelWidth + elapsedDays * (cellWidth + gap) + cellWidth / 2}
                cy={20}
                r="4"
                fill="var(--accent)"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Accessible Table View */}
      {showTable && (
        <div id={tableId} className="w-full overflow-x-auto border-2 border-[var(--accent)] p-3 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--accent)]">
                <th className="py-2 px-3 font-heading text-sm uppercase">Day</th>
                <th className="py-2 px-3 font-heading text-sm uppercase">Player A ({formatAddress(playerA)})</th>
                <th className="py-2 px-3 font-heading text-sm uppercase">Player B ({formatAddress(playerB)})</th>
                <th className="py-2 px-3 font-heading text-sm uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.dayNum} className="border-b border-[var(--border-subtle)] hover:bg-[#FFF0FA]">
                  <td className="py-2 px-3 font-bold">Day {d.dayNum}</td>
                  <td className="py-2 px-3">
                    {d.aChecked ? (
                      <span className="text-[var(--success)] font-bold">✓ Checked In</span>
                    ) : d.aMissed ? (
                      <span className="text-[var(--danger)] font-bold">✗ Missed</span>
                    ) : d.isToday ? (
                      <span className="text-[var(--warning)] font-semibold">Pending Today</span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">Upcoming</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {d.bChecked ? (
                      <span className="text-[var(--success)] font-bold">✓ Checked In</span>
                    ) : d.bMissed ? (
                      <span className="text-[var(--danger)] font-bold">✗ Missed</span>
                    ) : d.isToday ? (
                      <span className="text-[var(--warning)] font-semibold">Pending Today</span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">Upcoming</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {d.isMissPoint ? (
                      <span className="text-[var(--danger)] font-bold uppercase">First Miss Flag</span>
                    ) : d.isToday ? (
                      <span className="font-bold text-[var(--accent)]">Active Today</span>
                    ) : d.isPast ? (
                      "Completed"
                    ) : (
                      "Pending"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
