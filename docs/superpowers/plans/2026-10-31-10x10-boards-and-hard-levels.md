# 10x10 Boards and Hard Level Expansion (Levels 101–300) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand KittySquared to 300 puzzles by introducing 200 new 10x10 levels (101–300) with a 10th region theme (Cinnamon Caramel, chevron pattern, milk bowl glyph) and an interleaved wave pacing where ~33% of levels require Rule 6 with periodic gifts and breathers.

**Architecture:** 
1. Expand the theme and board rendering system to support 10 regions dynamically by defining CSS variables for Region 9 (`--reg-9: #B07D62`, `.pat-9` chevron, `🥛` glyph) and removing hardcoded modulo 9 references.
2. Enhance `src/engine/generator.ts` with targeted puzzle generation (supporting specific minimum rule constraints and trivial-gift generation) and a 10-wave scheduler that interleaves warm-up levels, Rule 6 clusters, and mid-peak breathers.
3. Update `scripts/generate-puzzles.ts` to output all 300 validated puzzles into `src/data/puzzles.json`, and scale UI caps and URL routing from 100 to 300 across `HomeScreen`, `App`, and `route.ts`.

**Tech Stack:** TypeScript, Preact, Vite, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-31-10x10-boards-and-hard-levels-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-10-31-10x10-boards-and-hard-levels-design.md)

---

## Global Constraints

- Region 9 color must be `#B07D62` (Cinnamon Caramel).
- Region 9 glyph must be `🥛` (Milk Bowl) appended to `REGION_GLYPHS` at index 9.
- Region 9 pattern must be `.pat-9` chevron / zig-zag with 0.22 opacity matching existing patterns.
- Exactly 200 new 10x10 puzzles (IDs 101–300); IDs 1–100 remain unchanged.
- Total puzzles in `puzzles.json` must be exactly 300.
- ~33% of levels 101–300 (~66–70 levels) must strictly require Rule 6 (`maxRuleUsed === 6`).
- Max consecutive Rule 6 levels within any wave must not exceed 4 (interleaved with breathers/gifts).
- Every puzzle in `puzzles.json` must be uniquely solvable (`countSolutions === 1`) and logically solvable (`solveLogically.solved === true`).
- Max level limit across `HomeScreen.tsx`, `App.tsx`, and `route.ts` must be 300.

## Review Focus

1. **Board Modulo Artifacts**: If any component still has `% 9`, Region 9 would mistakenly render as Region 0 (Sunflower Yellow / Paw).
2. **Mobile 10x10 Board Overflow**: 10x10 grid cells must scale gracefully without breaking out of the 380px tray or causing touch misclicks.
3. **Puzzles Validation**: Every generated puzzle must pass `countSolutions === 1` and `solveLogically.solved === true` to prevent unplayable or non-unique levels.
4. **Streak Fatigue**: Ensure no wave has more than 4 consecutive Rule 6 levels.
5. **Route Clamping**: URLs requesting `/level/300` must resolve, and `/level/301` must clamp to 300 rather than 100.

---

### Task 1: Theme, Glyphs & Board Dynamic Region Scaling

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/components/Board.tsx`
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/TutorialModal.tsx`
- Test: `tests/components/BoardTheme.test.tsx`

- [ ] **Step 1.1**: Write a failing test in `tests/components/BoardTheme.test.tsx` verifying that a 10x10 board with cells in Region 9 renders class `reg-9`, pattern class `pat-9`, and glyph `🥛`.
- [ ] **Step 1.2**: Run `npx vitest run tests/components/BoardTheme.test.tsx` to confirm failure.
- [ ] **Step 1.3**: Add `--reg-9: #B07D62;`, `.reg-9 { background: var(--reg-9); }`, and `.pat-9` chevron zig-zag CSS in `src/styles/theme.css`.
- [ ] **Step 1.4**: In `src/components/Board.tsx`, append `'🥛'` to `REGION_GLYPHS` and update cell class generation to use `reg-${regId}`, `pat-${regId}`, and `REGION_GLYPHS[regId]` without `% 9`.
- [ ] **Step 1.5**: In `src/components/SettingsModal.tsx` and `src/components/TutorialModal.tsx`, remove `% 9` from region class and glyph index lookups.
- [ ] **Step 1.6**: Run `npx vitest run tests/components/BoardTheme.test.tsx` and confirm tests pass.
- [ ] **Step 1.7**: Commit changes: `git commit -am "feat: add 10th region theme, chevron pattern, and milk glyph"`.

---

### Task 2: Targeted Generator Rules & 10x10 Wave Pipeline

**Files:**
- Modify: `src/engine/generator.ts`
- Test: `tests/engine/generator10x10.test.ts`

- [ ] **Step 2.1**: Write failing tests in `tests/engine/generator10x10.test.ts` verifying that `generatePuzzle` can enforce a minimum rule requirement (e.g. `minRuleRequired = 6`) and generate a valid 10x10 puzzle that solves logically with Rule 6.
- [ ] **Step 2.2**: Run `npx vitest run tests/engine/generator10x10.test.ts` to confirm failure.
- [ ] **Step 2.3**: Update `generatePuzzle` in `src/engine/generator.ts` to accept an optional `minRuleRequired?: number` and retry candidates until `logic.maxRuleUsed >= minRuleRequired`.
- [ ] **Step 2.4**: Implement `generate10x10Waves(startId: number = 101, waveCount: number = 10, rng: () => number): PuzzleDef[]` in `src/engine/generator.ts` following the wave structure from the spec (levels 1–5: warm-up/gift; levels 6–10: ramp-up/gift; levels 11–13: Rule 6 cluster 1; level 14: breather/gift; levels 15–18: Rule 6 cluster 2; levels 19–20: cooldown).
- [ ] **Step 2.5**: Run `npx vitest run tests/engine/generator10x10.test.ts` and confirm all tests pass.
- [ ] **Step 2.6**: Commit changes: `git commit -am "feat: implement targeted rule generation and 10x10 wave scheduler"`.

---

### Task 3: Generate 300 Puzzles & Comprehensive Puzzle Validation

**Files:**
- Modify: `scripts/generate-puzzles.ts`
- Modify: `src/data/puzzles.json`
- Create: `tests/engine/puzzlesValidation.test.ts`

- [ ] **Step 3.1**: Write a test in `tests/engine/puzzlesValidation.test.ts` checking:
  - Exactly 300 puzzles exist.
  - IDs 1 to 100 match the original puzzles and sizes.
  - IDs 101 to 300 are all size 10.
  - Every puzzle has `countSolutions === 1` and `solveLogically.solved === true`.
  - Exactly 66–70 of levels 101–300 have `maxRuleUsed === 6`.
  - No wave in 101–300 has more than 4 consecutive Rule 6 puzzles.
- [ ] **Step 3.2**: Run `npx vitest run tests/engine/puzzlesValidation.test.ts` to verify it fails (as only 100 puzzles currently exist).
- [ ] **Step 3.3**: Update `scripts/generate-puzzles.ts` to call `generateAll300Puzzles(seed)` (preserving 1–100 with seed 20261025 and generating 101–300 deterministically).
- [ ] **Step 3.4**: Run `npm run generate-puzzles` to generate and write the 300 puzzles to `src/data/puzzles.json`.
- [ ] **Step 3.5**: Run `npx vitest run tests/engine/puzzlesValidation.test.ts` and verify all checks pass.
- [ ] **Step 3.6**: Commit changes: `git commit -am "feat: generate and validate 300 levels in puzzles.json"`.

---

### Task 4: UI, Routing & Game State Scaling to 300 Levels

**Files:**
- Modify: `src/components/HomeScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/utils/route.ts`
- Modify: `src/state/gameState.ts`
- Modify: `tests/utils/route.test.ts`
- Modify: `tests/App.test.tsx`

- [ ] **Step 4.1**: Write failing tests in `tests/utils/route.test.ts` and `tests/App.test.tsx` checking that navigating to `/level/300` works, next level advances up to 300, and level 301 clamps to 300.
- [ ] **Step 4.2**: Run `npx vitest run tests/utils/route.test.ts tests/App.test.tsx` to confirm failure.
- [ ] **Step 4.3**: In `src/components/HomeScreen.tsx`, update subtitle to `"300 puzzles de lógica felina"` and level counter to display progress out of 300.
- [ ] **Step 4.4**: In `src/App.tsx`, update `nextLvlId` clamp to `Math.min(puzzles.length, session.puzzle.id + 1)`.
- [ ] **Step 4.5**: In `src/utils/route.ts`, clamp level ID to `Math.min(300, Math.max(1, parsedLevel))`.
- [ ] **Step 4.6**: In `src/state/gameState.ts`, verify that `isLevelUnlocked` and completion logic handle up to 300 levels cleanly.
- [ ] **Step 4.7**: Run `npx vitest run tests/utils/route.test.ts tests/App.test.tsx tests/state/gameState.test.ts` and verify tests pass.
- [ ] **Step 4.8**: Commit changes: `git commit -am "feat: scale UI, routing, and game state caps to 300 levels"`.

---

### Task 5: Full Regression, Build & End-to-End Verification

**Files:**
- None (verification phase)

- [ ] **Step 5.1**: Run full test suite `npm test` across all unit and component tests.
- [ ] **Step 5.2**: Run production typecheck and build `npm run build` to verify clean compilation with zero warnings or errors.
- [ ] **Step 5.3**: Start dev server `npm run dev` and test playing Level 101 (10x10 warm-up), Level 114 (mid-peak breather), and a Rule 6 peak level.
- [ ] **Step 5.4**: Commit final polish if needed and verify `git status` is clean.
