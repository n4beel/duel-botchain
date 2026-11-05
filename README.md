# Duel

Two people. Seven days. Miss one and you pay.

Duel is a head-to-head habit challenge built on BOT Chain using the **BE · Split lanes** layout archetype.

## Overview

- **Head-to-head Staked Habit Race**: One challenger sets the duration (3–30 days) and locks a stake (0.01 to 100,000 BOT). The challenged opponent accepts by matching the exact stake.
- **Strict UTC Calendar Day Indexing**: Duel starts at the next UTC midnight. Each participant must check in at least once every UTC day.
- **First-Miss-Loses Mechanics**: As soon as a day elapses where one player checked in and the other failed, the opponent immediately wins both stakes (`2 * stake`).
- **Draw Conditions**: If both players miss the same first day, or if neither player ever misses across the full duration, the duel draws and both stakes are returned in full.
- **Pull Payment Pattern**: Winnings and returned stakes are credited to `pending` balances and claimable via `withdraw()` with reentrancy protection.

## Design Tokens & Archetype: BE · Split lanes

- Ground: `#FF4DC9`
- Ink: `#210016`
- Surface: `#FFFFFF`
- Accent: `#210016`
- Accent-ink: `#FFFFFF`
- Border-default: `#C13797`
- Danger: `#B3261E`
- Success: `#1F7A3D`
- Headings & Day Numbers: **Teko**
- UI & Body Text: **Rajdhani**

## Verification & Testing

- Foundry Unit & Fuzz Tests: 21 tests, fuzzing random check-in patterns against reference models (256 runs).
- Foundry Invariant Suite: Solvency check `balance == sum(stake) + sum(2*stake) + sum(pending)` (256 runs, 128,000 calls, 0 reverts).
- Mutation Check: 21 of 25 mutants killed (84% kill rate; survivors analyzed and documented in `contracts/DECISIONS.md`).
- Integration Test: Viem lifecycle test against local Anvil on port 8661 covering challenge -> accept -> check-in -> settle -> withdraw.
- Quality Gates: `check-tokens.py`, `check-ui-contract.py`, `check-distinct.py`, `check-honesty.py` all exit 0.
