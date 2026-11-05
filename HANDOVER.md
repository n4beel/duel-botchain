# Handover: 61 — Duel

## Completed Milestones

1. **Scaffold**: Initialized via `./new-project.sh duel` with BE · Split lanes branding.
2. **Contract & Invariants**:
   - `Duel.sol`: Implements `challenge`, `accept`, `cancel`, `checkIn`, `settle`, `withdraw`, `status`, `daysDone`, `byParty`, `latest`.
   - Comprehensive unit and fuzz tests with reference model parity (`Duel.t.sol`).
   - Invariant testing (`DuelInvariant.t.sol`): 256 runs, 128,000 handler calls verifying solvency balance conservation without reverts.
3. **ABI & Client Library**:
   - `lib/botchain/abi.ts`: Complete ABI with 36 functions, errors, and events.
   - `lib/duel.ts`: Parity functions (`dayIndex`, `dayNumber`, `firstMiss`, `outcome`, `isCheckedIn`, `formatAddress`).
   - `lib/errors.ts`: Custom error decoding.
   - Vitest unit test suite covering vector edges and limits.
4. **Integration & Local Stack**:
   - `test/integration/duel.test.ts`: Runs on Anvil port 8661 covering complete lifecycle from challenge to pull-withdrawal.
   - `scripts/local-stack.mjs`: Seeds 7 duels on port 8761 covering all states.
5. **Design Tokens & Shell**:
   - Layout archetype **BE · Split lanes**: Ground `#FF4DC9`, Ink `#210016`, Surface `#FFFFFF`, Accent `#210016`.
   - Font pairing: Teko + Rajdhani.
   - Contrast ratios (WCAG 2.1 AA/AAA compliant):
     - Ink on ground: 6.6:1 (AA Normal, AAA Large)
     - Ink on surface: 19.5:1 (AAA)
     - Accent-ink on accent: 19.5:1 (AAA)
     - Muted on surface: 13.9:1 (AAA)
6. **Screens & Components**:
   - `components/lanes/SplitLanes.tsx`: Interactive SVG duel track with checkmarks, miss markers, first-miss decider flag, finish line, today indicator, and accessible table toggle.
   - `/`: Home view with hero, "What counts" limitations, and recent duels.
   - `/challenge`: Form with validation for opponent, 3-30 days, 0.01-100k BOT stake, memo.
   - `/duel/[id]`: Full arena view with interactive split lanes and contextual buttons (Accept, Cancel, Check in, Settle).
   - `/me`: History of duels and pending winnings claim via `withdraw()`.
7. **Verification & Gates**:
   - Mutation check: 21 of 25 mutants killed (84%); survivors documented in `contracts/DECISIONS.md`.
   - `check-tokens.py duel`: 0 errors.
   - `check-ui-contract.py duel`: ok.
   - `check-distinct.py duel`: 0 errors.
   - `check-honesty.py duel`: 0 findings.
   - Production build passes with TypeScript and Turbopack.
