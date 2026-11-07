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
1. **Zero-Emoji Audit:** Every `.ts`, `.tsx`, and `.css` file in `src/` must strictly pass the zero-emoji audit in `tests/components/Icons.test.tsx`. Never place literal emojis or forbidden Unicode symbols (such as `☆` or `✓`) in UI or share code; use `'★'.repeat(stars)` for star strings.
2. **Backward Compatibility:** Existing `localStorage` state without `daily` must sanitize cleanly to `DEFAULT_DAILY_PROGRESS`. If `activeSnapshotDate !== getTodayDateString()`, stale snapshots are cleanly discarded.
3. **Score & Star Isolation:** Daily challenge stars and score must NOT mutate campaign stars or score, and must not unlock cat breeds. Campaign progress resets must preserve daily progress.
4. **Clickable Links:** All references to files and symbols in responses must use markdown links with `file://` scheme.

---

## Tasks

### Task 1: Daily Types, State Storage & Streak Engine
**Files to create/modify:**
- `src/types/puzzle.ts`
- `src/engine/daily.ts` (create)
- `tests/engine/daily.test.ts` (create)
- `tests/state/storage.test.ts`
- `src/state/storage.ts`

- [ ] **Step 1.1:** Define `DailyPuzzleResult` and `DailyProgress` in `src/types/puzzle.ts`.
- [ ] **Step 1.2:** Write failing tests in `tests/engine/daily.test.ts` testing:
  - `getTodayDateString()` returns `YYYY-MM-DD`.
  - `getPreviousDateString()` uses UTC date math without DST skips.
  - `getDayOfYearIndex()` uses UTC math (March DST spring-forward does not duplicate indices).
  - `getDailyPuzzleIndex()` uses year-offset hashing for continuous leap year Dec 31 to Jan 1 transitions.
  - `getEffectiveStreak()` returns active streak if played today/yesterday, and returns 0 if gap >= 2 days.
  - `computeDailyWinOutcome()` increments streak on consecutive days, preserves streak on same-day replay, resets streak to 1 after gap, and updates `maxStreak`.
  - `formatDailyDateSpanish()` returns formatted Spanish date strings deterministically.
- [ ] **Step 1.3:** Implement `src/engine/daily.ts` to satisfy all tests in `tests/engine/daily.test.ts`.
- [ ] **Step 1.4:** Write failing tests in `tests/state/storage.test.ts` verifying:
  - `loadPersistedState()` on legacy state without `daily` populates `DEFAULT_DAILY_PROGRESS`.
  - `loadPersistedState()` discards `activeSnapshot` if `activeSnapshotDate !== getTodayDateString()`.
  - `resetProgress()` preserves `state.daily` intact while resetting campaign progress.
- [ ] **Step 1.5:** Update `src/state/storage.ts` with `DEFAULT_DAILY_PROGRESS`, update `PersistedAppState`, update `loadPersistedState()` sanitization, and update `resetProgress()` to preserve daily progress.
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

- [ ] **Step 2.1:** Write script `scripts/generate-daily-puzzles.ts` that generates 365 10×10 hard puzzles (Rules 4–6, verified unique and logically solvable) using seeded PRNG with progress logs every 25 puzzles, and writes them to `src/data/dailyPuzzles.json`.
- [ ] **Step 2.2:** Add `"generate-daily-puzzles": "tsx scripts/generate-daily-puzzles.ts"` to `package.json`.
- [ ] **Step 2.3:** Run `npm run generate-daily-puzzles` to produce `src/data/dailyPuzzles.json`.
- [ ] **Step 2.4:** Update `src/engine/daily.ts` to import `dailyPuzzles.json` and implement `getDailyPuzzleForDate(dateStr: string): PuzzleDef`.
- [ ] **Step 2.5:** Write tests in `tests/engine/dailyPuzzlesValidation.test.ts` (with explicit 180s timeout `180000`) asserting:
  - `getDailyPuzzleForDate()` returns a deterministic puzzle for a given date string.
  - All 365 daily puzzles have `size === 10`, single unique solution, and `solveLogically === true`.
- [ ] **Step 2.6:** Run `npx vitest run tests/engine/dailyPuzzlesValidation.test.ts` and verify.
- [ ] **Step 2.7:** Commit with message `feat: generate 365-day 10x10 daily puzzle bank and validation suite`.

---

### Task 3: Soft-Clay Vector Icons & Share Engine
**Files to create/modify:**
- `tests/components/Icons.test.tsx`
- `src/components/Icons.tsx`
- `tests/engine/share.test.ts` (create)
- `src/engine/share.ts` (create)

- [ ] **Step 3.1:** Write failing tests in `tests/components/Icons.test.tsx` asserting that `<FlameIcon />`, `<CalendarIcon />`, and `<CheckIcon />` render SVG elements with their respective `data-testid` (`icon-flame`, `icon-calendar`, `icon-check`).
- [ ] **Step 3.2:** Implement `FlameIcon`, `CalendarIcon`, and `CheckIcon` in `src/components/Icons.tsx` styled to match Soft-Clay vectors.
- [ ] **Step 3.3:** Write failing tests in `tests/engine/share.test.ts` testing:
  - `formatDailyShareText({ dateStr, stars, mistakes, timeSeconds, streak })` generates expected text using `'★'.repeat(stars)` with zero forbidden emojis.
  - `shareDailyResult` invokes `navigator.share` if present, falls back to `navigator.clipboard.writeText`, and handles abort errors gracefully.
- [ ] **Step 3.4:** Implement `src/engine/share.ts`.
- [ ] **Step 3.5:** Run `npx vitest run tests/engine/share.test.ts tests/components/Icons.test.tsx` and confirm all tests pass, including the Zero-Emoji audit.
- [ ] **Step 3.6:** Commit with message `feat: add flame, calendar, check icons and daily share engine`.

---

### Task 4: Home Screen Reto Diario Card
**Files to create/modify:**
- `tests/components/HomeScreen.test.tsx`
- `src/components/HomeScreen.tsx`

- [ ] **Step 4.1:** Write failing tests in `tests/components/HomeScreen.test.tsx` asserting:
  - Renders Reto Diario card with formatted date.
  - Unplayed state renders `"10×10 Difícil"` pill and effective streak badge.
  - Completed state renders `"Completado"` pill with star rating and streak badge.
  - Tapping fires `onOpenDaily`.
- [ ] **Step 4.2:** Update `HomeScreenProps` in `src/components/HomeScreen.tsx` with non-breaking optional props `daily?: DailyProgress` (defaulting to `DEFAULT_DAILY_PROGRESS`) and `onOpenDaily?: () => void`.
- [ ] **Step 4.3:** Render the Reto Diario card between `Jugar` and `Niveles` using `CalendarIcon`, `FlameIcon`, `CheckIcon`, and responsive layout.
- [ ] **Step 4.4:** Run `npx vitest run tests/components/HomeScreen.test.tsx` and verify passing.
- [ ] **Step 4.5:** Commit with message `feat: add Reto Diario card to HomeScreen`.

---

### Task 5: GameScreen Daily Mode UI & Timer
**Files to create/modify:**
- `tests/components/GameScreen.test.tsx`
- `src/components/GameScreen.tsx`

- [ ] **Step 5.1:** Write failing tests in `tests/components/GameScreen.test.tsx` asserting:
  - When `gameMode === 'daily'`, top bar displays `"Reto Diario"` and formatted date instead of `"Nivel X"`, and displays an active live timer (`MM:SS`) instead of paw coin score.
  - When daily puzzle is won, Victory Modal displays `"¡Reto Diario Completado!"`, stars, mistakes, elapsed time, current streak, and `"Compartir"` button.
  - In daily mode, primary modal button is `"Volver al inicio"` (instead of `"Siguiente nivel"`).
  - Tapping `"Compartir"` invokes `shareDailyResult` and displays temporary toast `"¡Resultado copiado al portapapeles!"` when copied.
  - Campaign score and unlock banner calculations are bypassed when `gameMode === 'daily'`.
- [ ] **Step 5.2:** Update `GameScreenProps` in `src/components/GameScreen.tsx` to accept:
  - `gameMode?: 'campaign' | 'daily'` (defaults to `'campaign'`).
  - `dailyDate?: string`.
  - `dailyStreak?: number`.
  - `onDailyWin?: (result: { stars: 1 | 2 | 3; mistakes: number; timeSeconds: number }) => void`.
- [ ] **Step 5.3:** Implement live timer tracking, daily top bar header, daily Victory Modal layout, share trigger, and clipboard toast banner in `src/components/GameScreen.tsx`.
- [ ] **Step 5.4:** Run `npx vitest run tests/components/GameScreen.test.tsx` and verify passing.
- [ ] **Step 5.5:** Commit with message `feat: add daily mode timer, victory modal, and share toast to GameScreen`.

---

### Task 6: App State Integration, Session Locking & Daily Win Lifecycle
**Files to create/modify:**
- `tests/App.test.tsx`
- `src/App.tsx`

- [ ] **Step 6.1:** Write failing tests in `tests/App.test.tsx` asserting:
  - Tapping Reto Diario card navigates to GameScreen with `gameMode = 'daily'` and loads today's daily puzzle.
  - In daily mode, cell updates auto-save into `daily.activeSnapshot` (and do not overwrite `progress.activeSnapshot`).
  - Winning a daily puzzle invokes `computeDailyWinOutcome`, updating `daily.history` and `daily.currentStreak`, while `progress.totalScore` and `progress.levelStars` remain completely unchanged.
  - If a daily session was started before midnight, winning commits to the locked `session.puzzleDate`.
  - Returning to home screen updates the Reto Diario card to completed state.
- [ ] **Step 6.2:** Update `src/App.tsx` to implement daily mode routing, session date locking, snapshot saving in `daily.activeSnapshot`, and `onDailyWin` handling.
- [ ] **Step 6.3:** Run `npx vitest run tests/App.test.tsx` and verify passing.
- [ ] **Step 6.4:** Commit with message `feat: integrate daily mode state persistence and win lifecycle in App`.

---

### Task 7: Full Verification, Bundle Build & Visual Inspection
- [ ] **Step 7.1:** Run `npx tsc --noEmit && npx vitest run` across the entire test suite.
- [ ] **Step 7.2:** Build production bundle via `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npm run build`.
- [ ] **Step 7.3:** Verify live rendering at `http://localhost:5173/` (HomeScreen Reto Diario card, Daily game board with timer, and Victory Modal).
