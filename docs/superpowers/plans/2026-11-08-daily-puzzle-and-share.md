# Milestone 6 — Daily 10×10 Hard Puzzle ("Reto Diario") & Shareable Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Milestone 6 ("Reto Diario"): a deterministic, offline-ready daily 10×10 hard puzzle mode with streak tracking, home screen card, live game timer, daily victory modal, and one-tap social share text.

**Architecture:**
- Pre-generated 365-puzzle offline bank (`src/data/dailyPuzzles.json`) indexed deterministically by UTC date arithmetic.
- Independent daily state in `src/state/storage.ts` (`DailyProgress`) tracking active streaks, history, and snapshots separately from campaign progression.
- Bespoke Soft-Clay SVG iconography (`FlameIcon`, `CalendarIcon`, `CheckIcon`) and zero-emoji compliance.
- Shared text generator with native `navigator.share` and clipboard fallback with toast banner.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-08-daily-puzzle-and-share-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-08-daily-puzzle-and-share-design.md)

---

## Global Constraints & Commitments
1. **Zero-Emoji Audit:** Every `.ts`, `.tsx`, and `.css` file in `src/` must strictly pass the zero-emoji audit in `tests/components/Icons.test.tsx`. Never place literal emojis in UI code.
2. **Backward Compatibility:** Existing `localStorage` state without `daily` must sanitize cleanly to `DEFAULT_DAILY_PROGRESS`.
3. **Score & Star Isolation:** Daily challenge stars and score must NOT mutate campaign stars or score, and must not unlock cat breeds. Campaign progress resets must preserve daily progress.
4. **Clickable Links:** All references to files and symbols in responses must use markdown links with `file://` scheme.

---

## Tasks

### Task 1: Daily Types, State Storage & Streak Engine
**Files to create/modify:**
- `src/types/puzzle.ts`
- `src/state/storage.ts`
- `src/engine/daily.ts` (create)
- `tests/engine/daily.test.ts` (create)
- `tests/state/storage.test.ts`

- [ ] **Step 1.1:** Define `DailyPuzzleResult` and `DailyProgress` in `src/types/puzzle.ts`.
- [ ] **Step 1.2:** Write failing tests in `tests/engine/daily.test.ts` for UTC date parsing, `getDayOfYearIndex`, `getDailyPuzzleIndex`, `getPreviousDateString`, `getEffectiveStreak`, and `computeDailyWinOutcome`.
- [ ] **Step 1.3:** Implement `src/engine/daily.ts` with DST-safe UTC date arithmetic, leap year hashing, effective streak evaluation, and win outcome computation.
- [ ] **Step 1.4:** Update `src/state/storage.ts` to add `DEFAULT_DAILY_PROGRESS`, update `PersistedAppState`, sanitize `daily` in `loadPersistedState()`, and preserve `daily` in `resetProgress()`.
- [ ] **Step 1.5:** Write tests in `tests/state/storage.test.ts` verifying legacy migration without `daily` and preservation during `resetProgress()`.
- [ ] **Step 1.6:** Run `npx vitest run tests/engine/daily.test.ts tests/state/storage.test.ts` and verify all tests pass.
- [ ] **Step 1.7:** Commit changes with message `feat: add daily puzzle types, storage sanitization, and streak engine`.

---

### Task 2: 365-Puzzle Daily Bank Generation & Validation
**Files to create/modify:**
- `scripts/generate-daily-puzzles.ts` (create)
- `src/data/dailyPuzzles.json` (create)
- `src/engine/daily.ts`
- `tests/engine/dailyPuzzlesValidation.test.ts` (create)
- `package.json`

- [ ] **Step 2.1:** Write script `scripts/generate-daily-puzzles.ts` that generates 365 10×10 hard puzzles (Rules 4–6, verified unique and logically solvable) using seeded PRNG and writes them to `src/data/dailyPuzzles.json`.
- [ ] **Step 2.2:** Add `"generate-daily-puzzles": "tsx scripts/generate-daily-puzzles.ts"` to `package.json`.
- [ ] **Step 2.3:** Run `npm run generate-daily-puzzles` to produce `src/data/dailyPuzzles.json`.
- [ ] **Step 2.4:** Update `src/engine/daily.ts` to import `dailyPuzzles.json` and implement `getDailyPuzzleForDate(dateStr: string): PuzzleDef`.
- [ ] **Step 2.5:** Write tests in `tests/engine/dailyPuzzlesValidation.test.ts` validating all 365 puzzles have `size === 10`, single unique solution, and `solveLogically === true`.
- [ ] **Step 2.6:** Run `npx vitest run tests/engine/dailyPuzzlesValidation.test.ts` and verify.
- [ ] **Step 2.7:** Commit with message `feat: generate 365-day 10x10 daily puzzle bank and validation suite`.

---

### Task 3: Soft-Clay Vector Icons & Share Engine
**Files to create/modify:**
- `src/components/Icons.tsx`
- `src/engine/share.ts` (create)
- `tests/engine/share.test.ts` (create)
- `tests/components/Icons.test.tsx`

- [ ] **Step 3.1:** Add `FlameIcon`, `CalendarIcon`, and `CheckIcon` in `src/components/Icons.tsx` styled to match Soft-Clay vectors.
- [ ] **Step 3.2:** Write failing tests in `tests/engine/share.test.ts` for `formatDailyShareText` and `shareDailyResult` (mocking `navigator.share` and `navigator.clipboard`).
- [ ] **Step 3.3:** Implement `src/engine/share.ts` with clean text formatting (using `★` or dynamic codepoints) and fallback clipboard copying.
- [ ] **Step 3.4:** Run `npx vitest run tests/engine/share.test.ts tests/components/Icons.test.tsx` and confirm all tests pass, including the Zero-Emoji audit.
- [ ] **Step 3.5:** Commit with message `feat: add flame, calendar, check icons and daily share engine`.

---

### Task 4: Home Screen Reto Diario Card
**Files to create/modify:**
- `src/components/HomeScreen.tsx`
- `tests/components/HomeScreen.test.tsx`

- [ ] **Step 4.1:** Write failing tests in `tests/components/HomeScreen.test.tsx` asserting the Reto Diario card renders with date, streak badge, status pill, and fires `onOpenDaily`.
- [ ] **Step 4.2:** Update `src/components/HomeScreen.tsx` to accept `daily: DailyProgress` and `onOpenDaily: () => void`.
- [ ] **Step 4.3:** Render the Reto Diario card between `Jugar` and `Niveles` with responsive layout, `CalendarIcon`, `FlameIcon`, `CheckIcon`, and formatted date.
- [ ] **Step 4.4:** Run `npx vitest run tests/components/HomeScreen.test.tsx` and verify passing.
- [ ] **Step 4.5:** Commit with message `feat: add Reto Diario card to HomeScreen`.

---

### Task 5: GameScreen & App Daily Mode Integration with Timer, Victory Modal & Toast
**Files to create/modify:**
- `src/components/GameScreen.tsx`
- `src/App.tsx`
- `tests/components/GameScreen.test.tsx`
- `tests/App.test.tsx`

- [ ] **Step 5.1:** Update `src/components/GameScreen.tsx`:
  - Accept `gameMode?: 'campaign' | 'daily'`, `dailyDate?: string`, `dailyStreak?: number`, `onShareDaily?: () => void`.
  - In daily mode, replace paw coin score in top bar with live elapsed timer (`MM:SS`).
  - In daily mode Victory Modal, display `"¡Reto Diario Completado!"`, stars, mistakes, time, streak, and a `"Compartir"` button.
  - Add toast banner state for clipboard copy feedback (`"¡Resultado copiado al portapapeles!"`).
- [ ] **Step 5.2:** Update `src/App.tsx`:
  - Add `activeGameMode: 'campaign' | 'daily'`.
  - Support launching Reto Diario from HomeScreen, loading daily puzzle for today's date.
  - Auto-save daily snapshots into `daily.activeSnapshot`.
  - Route daily wins to `computeDailyWinOutcome` without mutating campaign stars or unlocking cat breeds.
- [ ] **Step 5.3:** Write integration tests in `tests/components/GameScreen.test.tsx` and `tests/App.test.tsx` testing the daily game flow end-to-end.
- [ ] **Step 5.4:** Run `npx tsc --noEmit && npx vitest run` across all test files to verify full pass.
- [ ] **Step 5.5:** Commit with message `feat: integrate daily mode in GameScreen and App with timer and share flow`.

---

### Task 6: Full Verification & Visual Inspection
- [ ] **Step 6.1:** Run `npx tsc --noEmit && npx vitest run` across entire test suite.
- [ ] **Step 6.2:** Build production bundle via `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npm run build`.
- [ ] **Step 6.3:** Verify live rendering at `http://localhost:5173/` (HomeScreen Reto Diario card, Daily game board with timer, and Victory Modal).
