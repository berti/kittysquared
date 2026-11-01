# Design Document: 10x10 Boards and Hard Level Expansion (Levels 101–300)

**Date**: 2026-10-31  
**Status**: Approved  
**Target Release**: KittySquared 1.1.0  

---

## 1. Intent & Context

KittySquared is a feline-themed logic puzzle game (inspired by Star Battle / Queens) where players place exactly one cat in each row, column, and contiguous color region, ensuring cats never touch even diagonally.

Currently, the game features 100 levels spanning board sizes from 5x5 up to 9x9. During gameplay analysis:
- Levels 88 through 93 are solved easily due to immediate forced singletons or simple Rule 3/4 eliminations.
- **Level 94** (Rule 4) requires 12 line/neighborhood deductions before placing the first cat, delivering the first sustained mental challenge.
- **Level 98** (Rule 5) introduces naked region pairs.
- **Level 100** (Rule 6) is the only level in the game that requires 1-step lookahead / asphyxiation logic.

Players reaching the endgame need more challenging puzzles, including boards harder than levels 94, 98, and 100, while maintaining breathing room ("relief") and periodic satisfying "trivial gifts" interspersed within difficulty peaks to avoid long exhausting streaks of peak-difficulty puzzles.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Expand puzzle catalogue to 300 levels**: Generate 200 new 10x10 puzzles (IDs 101–300).
- **Incorporate 10th region theme**:
  - **Color**: Cinnamon Caramel (`#B07D62`).
  - **Pattern**: Chevron / zig-zag (`pat-9`).
  - **Glyph**: Milk bowl (`🥛`).
- **Curate ~33% Rule 6 puzzles**: Ensure approximately 1 in 3 levels strictly require Rule 6 (1-step lookahead asphyxiation) — totaling ~66–70 levels requiring Rule 6 across the 200 new levels.
- **Interleaved Wave Pacing (Approach A with mid-peak breathers)**:
  - Structure the 200 new levels into **10 progressive waves of 20 levels** (101–120, 121–140, ..., 281–300).
  - Include ~3 "trivial gift" levels per wave (e.g., puzzles featuring a 1-cell starting region or instant freebie cat).
  - **Break up consecutive high-difficulty streaks**: Rather than running 6–7 Rule 6 puzzles back-to-back, interleave a mid-peak breather / gift level so players never face more than 3–4 intense puzzles in a row without relief.
- **UI & Scalability**: Ensure 10x10 boards fit neatly on mobile screens with responsive cell sizes, clear touch targets, and updated level caps (1–300).

### Non-Goals
- Multi-cat boards (e.g. 2 cats per row/col/region) — keeping the clean 1-cat rule.
- Deep arbitrary backtracking (3+ moves into the future) that forces guess-and-check without in-game note tools.
- Modifying the existing 1–100 puzzle definitions.

### Anti-Goals
- **Difficulty through tedium**: We avoid 10x10 boards that are exclusively trivial busywork, as well as unending consecutive Rule 6 burnout without relief.
- **Breaking accessibility**: The new 10th color, pattern, and glyph must maintain full WCAG contrast and compatibility with the assist modes (textures, glyphs, numbers).

---

## 3. Approaches Considered

### Approach A: Rhythmic Waves with Interleaved Mid-Peak Breathers (SELECTED)
Divide levels 101–300 into 10 cyclical waves of 20 levels each. Within each wave of 20:
- Early ramp & breathers (levels 1–10) introduce the wave's region geometries with 2 trivial gifts and moderate deductions.
- The 6–7 Rule 6 puzzles are split into two clusters of 3–4 puzzles, separated by a mid-peak breather/gift (e.g. at level 14 or 15), preventing fatigue.
- **Decision**: Chosen because it provides breathing room both between waves and *inside* the hardest difficulty clusters.

### Approach B: Monotonic Difficulty Ramp (Rejected)
Sort all 200 levels strictly by difficulty score.
- **Trade-off**: The final 70 levels would be relentless back-to-back Rule 6 puzzles with no breaks or gifts.

### Approach C: Uniform Staggering (Rejected)
Every 3rd level is strictly a Rule 6 puzzle.
- **Trade-off**: Mechanical and predictable cadence without natural wave rhythms.

---

## 4. Detailed Specification

### 4.1 Theme & Styling (10th Region / Region 9)
- **CSS Variables** in `src/styles/theme.css`:
  - `--reg-9: #B07D62;` (Cinnamon Caramel)
  - `.reg-9 { background: var(--reg-9); }`
  - `.pat-9 { ... chevron/zig-zag repeating gradient ... }`
- **Glyphs** in `src/components/Board.tsx`:
  - `export const REGION_GLYPHS = ['🐾', '🐟', '🧶', '🔔', '⭐', '🌙', '🐭', '👑', '💖', '🥛'];`
- **Remove Hardcoded Modulo 9**:
  - Replace `reg-${regId % 9}` with `reg-${regId}` (and glyphs `REGION_GLYPHS[regId]`) across:
    - `src/components/Board.tsx`
    - `src/components/SettingsModal.tsx`
    - `src/components/TutorialModal.tsx`
- **Board Grid Sizing**:
  - Ensure `.board-grid` and `.board-cell` adapt cleanly for 10x10. At 380px max board width, 10 cells with 4px gap yield ~32px cells, which is comfortable for touch.

### 4.2 Interleaved Wave Pacing & Generation (Levels 101–300)
- **Wave Architecture** (10 waves × 20 levels):
  - In each 20-level wave (offset indices 1 to 20):
    - **Levels 1–5 (Warm-up & Gift 1)**: Moderate difficulty (Rule 3/4) with 1 trivial gift (Rule 1/single-cell region).
    - **Levels 6–10 (Ramp-up & Gift 2)**: Moderate-to-hard (Rule 4/5) with 1 trivial gift or lighter breather.
    - **Levels 11–13 (Peak Cluster 1)**: 3 high-difficulty Rule 6 puzzles.
    - **Level 14 (Mid-Peak Breather / Gift 3)**: 1 lighter relief / trivial gift level.
    - **Levels 15–18 (Peak Cluster 2)**: 3–4 high-difficulty Rule 6 puzzles.
    - **Levels 19–20 (Wave Cooldown)**: Moderate Rule 5 puzzles transitioning into the next wave.
  - Overall per wave: ~6–7 Rule 6 puzzles, ~3 trivial gift/light levels, max 3–4 consecutive Rule 6 puzzles.
  - Total across all 10 waves: ~66–70 Rule 6 puzzles (~33% of the 200 new levels).
- **Generator Updates (`src/engine/generator.ts`)**:
  - Update `generatePuzzle` to support targeted rule constraints (e.g. requiring `minRuleUsed === 6`, or enforcing a 1-cell gift region).
  - Implement deterministic wave generation for levels 101–300.
  - Update `scripts/generate-puzzles.ts` to output all 300 puzzles into `src/data/puzzles.json`.

### 4.3 UI & Navigation Updates
- **Level Limit Update**:
  - `src/components/HomeScreen.tsx`: Update text "100 puzzles de lógica felina" to "300 puzzles de lógica felina" and level progress `/ 100` to `/ 300`.
  - `src/App.tsx`: `Math.min(300, session.puzzle.id + 1)` (or dynamic `puzzles.length`).
  - `src/utils/route.ts`: Clamp route level parameter to `[1, 300]`.
  - `src/state/gameState.ts` & `src/state/storage.ts`: Ensure level completion tracking supports up to 300 puzzles without migration breaks.

---

## 5. Left to the Builder
- Precise CSS formula for `.pat-9` chevron gradient to ensure it matches the 0.22 opacity and 8px scale of existing patterns.
- Seed selection for deterministic regeneration in `scripts/generate-puzzles.ts`.
- Minor cell font-size adjustments in `.cell-10` to balance glyph badges and cat SVGs on small screens.

---

## 6. Verification Plan
- Unit tests: Run existing tests (`npm test`) and add verification for 300 puzzles in `puzzles.json`.
- Solver validation: Verify all 300 puzzles have unique solutions (`countSolutions === 1`) and can be solved logically (`solveLogically.solved === true`).
- Rule distribution test: Verify ~33% of levels 101–300 have `maxRuleUsed === 6` (66–70 levels).
- Streak verification: Verify no wave has more than 4 consecutive Rule 6 puzzles.
- Visual inspection: Open dev server and play level 101, a Rule 5 level, and a Rule 6 level on 10x10.
