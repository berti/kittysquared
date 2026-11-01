# Debug Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a `/debug/<mode>/<level>` route that runs levels in an isolated debug mode without touching local storage, displays a "Debug Mode" badge, and auto-places crosses in Classic mode on valid cat placement.

**Architecture:**
- Native path parsing helper in `src/utils/route.ts` that matches `/debug/(classic|chill)/<levelId>`.
- State flag `isDebug` on `LevelSessionState` and in `App.tsx` preventing persistence to `localStorage`.
- Auto-cross logic in `src/state/gameState.ts` using `getDirectEliminations` when `isDebug` is true and a cat is placed correctly in Classic mode.
- Header badge in `GameScreen` indicating debug mode.
- Clean exit to `/` on "← Menú".

**Tech Stack:** TypeScript, Preact, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-debug-mode-design.md`

## Global Constraints
- Clamped level range: 1 to 100.
- Supported modes: `classic` and `chill`.
- Local storage must remain untouched when `isDebug` is true.
- Zero new runtime package dependencies.

## Review Focus
1. Route with invalid mode or non-numeric level (e.g. `/debug/unknown/10` or `/debug/classic/abc`): should be treated as non-debug and fallback to normal home screen.
2. Route with out-of-range level (e.g. `/debug/classic/0` or `/debug/chill/999`): clamped to valid range [1, 100].
3. Normal game mode must NOT auto-cross cells on cat placement; auto-cross is strictly enabled when `isDebug` is true.
4. Auto-cross must not overwrite already-placed cats.
5. Returning to menu resets URL to `/` and disables debug mode.

---

### Task 1: Route Parsing and URL Helper Utilities

**Files:**
- Create: `src/utils/route.ts`
- Create: `tests/utils/route.test.ts`

**Interfaces:**
- Consumes: `GameMode` from `src/types/puzzle.ts`
- Produces:
  ```ts
  export interface DebugRouteParams {
    isDebug: true;
    mode: GameMode;
    levelId: number;
  }
  export function parseDebugRoute(pathname: string): DebugRouteParams | null;
  export function updateDebugRoute(mode: GameMode, levelId: number): void;
  export function clearDebugRoute(): void;
  ```

- [ ] **Step 1: Write the failing tests in `tests/utils/route.test.ts`**

Cover valid routes (`/debug/classic/84`, `/debug/chill/1`), clamping (`/debug/classic/150` -> 100, `/debug/chill/-5` -> 1), and invalid routes (`/debug/foobar/1`, `/other/route`, `/`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/utils/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/utils/route.ts`**

Implement `parseDebugRoute`, `updateDebugRoute`, and `clearDebugRoute`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/utils/route.test.ts`
Expected: PASS.

---

### Task 2: Debug Flag and Classic Auto-Cross in Game State

**Files:**
- Modify: `src/types/puzzle.ts`
- Modify: `src/state/gameState.ts`
- Modify: `tests/state/gameState.test.ts`

**Interfaces:**
- Consumes: `getDirectEliminations` from `src/engine/rules.ts`
- Produces:
  - `LevelSessionState.isDebug?: boolean`
  - `createLevelSession(puzzle: PuzzleDef, mode: GameMode, isDebug?: boolean): LevelSessionState`
  - `applyCellTap` auto-places crosses for all cells returned by `getDirectEliminations` when `state.mode === 'classic'`, `nextState === 'cat'`, cat is placed correctly, and `state.isDebug === true`.

- [ ] **Step 1: Write the failing tests in `tests/state/gameState.test.ts`**

Test that:
- Placing a correct cat in normal classic mode (`isDebug: false` or omitted) does NOT auto-place crosses.
- Placing a correct cat in debug classic mode (`isDebug: true`) auto-places crosses on empty row, col, region, and neighbor cells.
- Any cells that already contained cats are preserved.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: FAIL (auto-crosses not applied in debug mode).

- [ ] **Step 3: Update `src/types/puzzle.ts` and `src/state/gameState.ts`**

Add `isDebug?: boolean` to `LevelSessionState`. Update `createLevelSession` to accept `isDebug`.
In `applyCellTap`, when `state.mode === 'classic'`, `nextState === 'cat'`, and cat is correct:
If `state.isDebug` is true, call `getDirectEliminations(state.puzzle.size, state.puzzle.regions, row, col)` and fill empty cells in `newBoard` with `'cross'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: PASS.

---

### Task 3: Debug Mode UI Indicator in GameScreen

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `tests/components/BoardAndCat.test.tsx` (or new test file `tests/components/GameScreen.test.tsx`)

**Interfaces:**
- Consumes: `session.isDebug`
- Produces: Render visual badge `🛠️ Debug Mode` in header next to level indicator when `session.isDebug` is true.

- [ ] **Step 1: Write the failing test for Debug Mode indicator**

Render `GameScreen` with `session.isDebug = true` and assert that the debug mode badge is present. Assert it is absent when `session.isDebug` is false or undefined.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/GameScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Debug Mode badge in `src/components/GameScreen.tsx`**

Add badge next to `Nivel {puzzle.id}` in header when `session.isDebug` is true.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/GameScreen.test.tsx`
Expected: PASS.

---

### Task 4: App Integration and Navigation Handling

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: `parseDebugRoute`, `updateDebugRoute`, `clearDebugRoute` from `src/utils/route.ts`
- Consumes: `createLevelSession` with `isDebug`
- Produces:
  - `AppProps.initialPath?: string` (optional prop for easy testing, defaults to `window.location.pathname`).
  - App enters debug mode directly when URL matches `/debug/<mode>/<level>`.
  - State persistence skipped in debug mode (no `localStorage` writes).
  - Advancing level updates session in-memory and updates URL via `updateDebugRoute`.
  - Back to menu clears debug route via `clearDebugRoute` and resets to normal home screen.

- [ ] **Step 1: Write the failing tests in `tests/App.test.tsx`**

Test scenarios:
- Mounting with `initialPath="/debug/classic/84"` launches directly to Game screen on level 84 with Classic mode and debug indicator.
- In debug mode, completing a move or level does not write to `localStorage`.
- Advancing level updates level to 85 and keeps debug mode active.
- Clicking "← Menú" returns to Home screen and clears debug route.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/App.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement debug route handling and isolation in `src/App.tsx`**

Implement route detection, ephemeral debug session initialization, suppression of `savePersistedState`, level advance URL updating, and menu reset.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/App.test.tsx`
Expected: PASS.

---

### Task 5: Full Suite Verification & Build Check

**Files:**
- Run all unit and integration tests across the codebase.
- Check production build compilation (`npm run build`).

- [ ] **Step 1: Run full test suite**
Run: `npm test`
Expected: ALL PASS.

- [ ] **Step 2: Run build check**
Run: `npm run build`
Expected: SUCCESS (TypeScript type check and Vite bundle output clean).
