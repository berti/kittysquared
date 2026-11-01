# Remove Chill Out Mode and Debug Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Chill Out mode and temporary debug routes to unify KittySquared into a single classic game mode with backward-compatible save migration and clean UI.

**Architecture:** Remove `GameMode` branching and `isDebug` flags across the engine, state, storage, and UI. Migrate storage from dual-mode (`chill`/`classic`) to a single `progress: ModeProgress` structure preserving existing player progress. Simplify `HomeScreen` to a single play card and `SettingsModal` to a single progress reset. Delete `src/utils/route.ts` and clean HTML redirect scripts.

**Tech Stack:** Preact, TypeScript, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-remove-chill-mode-and-debug-routes-design.md`

## Global Constraints

- No remaining references to `chill` mode or `isDebug` in runtime code.
- Backward compatibility: `loadPersistedState()` must load legacy `classic` or `chill` saves if present.
- All 300 puzzles remain uniquely solvable and playable.
- 100% test pass rate with zero type errors.

## Review Focus

- Legacy save files with only `classic` progress load correctly into `progress`.
- Legacy save files with only `chill` progress fallback correctly into `progress`.
- Direct navigation or refreshing does not cause route errors or trigger debug redirects.
- In-game status bar always renders hearts and score.
- Settings reset confirmation properly resets `progress` to level 1 and 0 score.

---

### Task 1: Clean up Debug Routing and Debug State Scaffolding

**Files:**
- Delete: `src/utils/route.ts`
- Delete: `tests/utils/route.test.ts`
- Modify: `index.html:14-24`
- Modify: `public/404.html:13-22`
- Modify: `src/App.tsx`
- Modify: `src/state/gameState.ts:7,24-32,106-114`
- Modify: `src/components/GameScreen.tsx:114-129`
- Modify: `tests/components/GameScreen.test.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: none
- Produces: `LevelSessionState` without `isDebug`, `GameScreen` without debug badge, clean `index.html` and `public/404.html` without `/debug/` redirect scripts.

- [ ] **Step 1: Write test updates removing debug route checks**
Update `tests/components/GameScreen.test.tsx` and `tests/App.test.tsx` to remove tests checking `debug-mode-badge` and debug route navigation. Delete `tests/utils/route.test.ts`.

- [ ] **Step 2: Run tests to verify the test suite status**
Run: `npx vitest run tests/components/GameScreen.test.tsx`

- [ ] **Step 3: Remove debug code from `route.ts`, `App.tsx`, `gameState.ts`, `GameScreen.tsx`, `index.html`, and `public/404.html`**
Delete `src/utils/route.ts`. Remove `initialPath`, `initialRoute`, `isDebug`, `parseDebugRoute`, `updateDebugRoute`, `clearDebugRoute`, and route event listeners in `src/App.tsx`. Remove `isDebug` and auto-cross in `src/state/gameState.ts`. Remove badge in `src/components/GameScreen.tsx`. Remove script tags in `index.html` and `public/404.html`.

- [ ] **Step 4: Verify test passes**
Run: `npx vitest run tests/components/GameScreen.test.tsx tests/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify build succeeds**
Run: `npm run build`
Expected: PASS

---

### Task 2: Remove Chill Out Mode from Engine, State, and Types

**Files:**
- Modify: `src/types/puzzle.ts:1`
- Modify: `src/state/gameState.ts`
- Modify: `tests/state/gameState.test.ts`

**Interfaces:**
- Consumes: `PuzzleDef`, `CellState` from `src/types/puzzle.ts`
- Produces: `createLevelSession(puzzle: PuzzleDef): LevelSessionState` (no `mode` argument), unified Classic rule enforcement (hearts, locking, scoring).

- [ ] **Step 1: Write updated tests for game state without modes**
Update `tests/state/gameState.test.ts`:
- Replace `createLevelSession(samplePuzzle, 'classic')` and `createLevelSession(samplePuzzle, 'chill')` with `createLevelSession(samplePuzzle)`.
- Remove tests specifically asserting Chill Out conflict highlighting without mistake penalties.
- Assert that placing an incorrect cat increases mistakes and places an error cross.
- Assert that placing a correct cat locks the cat and updates partial score.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/state/gameState.test.ts`
Expected: FAIL due to interface mismatch or deprecated mode arguments.

- [ ] **Step 3: Implement engine and state updates**
- In `src/types/puzzle.ts`: remove `export type GameMode = 'chill' | 'classic';`.
- In `src/state/gameState.ts`:
  - Remove `mode` from `LevelSessionState`.
  - Remove `findConflictingCats` import.
  - Simplify `createLevelSession(puzzle: PuzzleDef): LevelSessionState`.
  - Remove `if (state.mode === 'chill')` and `if (state.mode === 'classic')` checks in `applyCellTap` and undo handling. All games follow Classic rules: cat placement is validated against `puzzle.solution[row] === col`, wrong placements increment mistakes and set error crosses, correct placements lock cats and add points.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/state/gameState.test.ts`
Expected: PASS

---

### Task 3: Unify Storage Progress and Add Migration for Saved Games

**Files:**
- Modify: `src/state/storage.ts`
- Modify: `tests/state/storage.test.ts`

**Interfaces:**
- Consumes: `ModeProgress`, `SavedBoardSnapshot`
- Produces:
  ```ts
  export interface PersistedAppState {
    progress: ModeProgress;
    settings: AppSettings;
  }
  export function getDefaultAppState(): PersistedAppState;
  export function loadPersistedState(): PersistedAppState;
  export function savePersistedState(state: PersistedAppState): void;
  export function resetProgress(state: PersistedAppState): PersistedAppState;
  ```

- [ ] **Step 1: Write tests for unified storage and backward-compatible migration**
In `tests/state/storage.test.ts`:
- Test default state provides `progress` with `currentLevelId: 1`, `totalScore: 0`, `activeSnapshot: null`.
- Test saving and reloading unified `progress`.
- Test migration: when `localStorage` has legacy format `{ classic: { currentLevelId: 42, totalScore: 1200, ... } }`, `loadPersistedState()` extracts it into `progress`.
- Test migration: when `localStorage` has only `chill` format `{ chill: { currentLevelId: 15, totalScore: 0, ... } }`, `loadPersistedState()` falls back and extracts it into `progress`.
- Test `resetProgress(state)` resets `progress` to level 1 and 0 score while preserving `settings`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL due to `resetModeProgress` and `{ chill, classic }` references.

- [ ] **Step 3: Implement storage unification and migration**
Update `src/state/storage.ts`:
- Replace `chill` and `classic` in `PersistedAppState` with `progress: ModeProgress`.
- In `loadPersistedState()`:
  ```ts
  const rawProgress = parsed.progress || parsed.classic || parsed.chill || {};
  ```
- Replace `resetModeProgress(state: PersistedAppState, mode: GameMode)` with:
  ```ts
  export function resetProgress(state: PersistedAppState): PersistedAppState
  ```

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS

---

### Task 4: Update UI Screens (`HomeScreen`, `SettingsModal`, `GameScreen`, `App`)

**Files:**
- Modify: `src/components/HomeScreen.tsx`
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `tests/components/SettingsModal.test.tsx`
- Modify: `tests/components/GameScreen.test.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: `PersistedAppState`, `ModeProgress`, `resetProgress`, `createLevelSession`
- Produces: Updated components with single play card, single reset button, unified status bar.

- [ ] **Step 1: Write failing tests for UI components**
- In `tests/App.test.tsx`: test that `HomeScreen` renders a single "Jugar" button/card with level and points, clicking it starts the game. Test that `SettingsModal` has a single "Reiniciar progreso" button.
- In `tests/components/SettingsModal.test.tsx`: test that clicking reset confirms and triggers `onResetProgress()`.
- In `tests/components/GameScreen.test.tsx`: test that status bar always displays hearts and score.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npx vitest run tests/App.test.tsx tests/components/SettingsModal.test.tsx tests/components/GameScreen.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement UI updates**
- `HomeScreen.tsx`:
  - Update `HomeScreenProps`: `{ progress: ModeProgress; catVariant: CatVariant; onPlay: () => void; onOpenTutorial: () => void; onOpenSettings: () => void; }`.
  - Replace Chill Out and Classic cards with a single card:
    - ID/data-testid: `start-game-btn`
    - Title: `🎮 Jugar`
    - Subtitle: `Nivel {progress.currentLevelId} / 300 • ⭐ {progress.totalScore} pts`
    - Action button: `Jugar ▶`
- `SettingsModal.tsx`:
  - Remove `activeMode` prop.
  - Replace mode reset buttons with single "Reiniciar progreso" button (`data-testid="reset-progress-btn"`).
  - Update confirmation dialog text to "¿Reiniciar progreso?" / "Volverás al nivel 1 y tu puntuación se reiniciará a 0.".
- `GameScreen.tsx`:
  - Remove `session.mode === 'classic'` checks. Always display hearts and score in the status bar.
- `App.tsx`:
  - Pass `appState.progress` to `HomeScreen` and `GameScreen`.
  - Handle `onPlay={() => navigateWithTransition('forward', () => setActiveScreen('game'))}`.
  - Update level session creation and completion handlers for unified `progress`.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npx vitest run tests/App.test.tsx tests/components/SettingsModal.test.tsx tests/components/GameScreen.test.tsx`
Expected: PASS

---

### Task 5: Full Regression Testing and Verification

**Files:**
- All test files across `tests/`

- [ ] **Step 1: Run full Vitest test suite**
Run: `npm test`
Expected: All tests pass (0 failures).

- [ ] **Step 2: Verify TypeScript and bundle build**
Run: `npm run build`
Expected: Vite build succeeds cleanly with no TypeScript compilation errors.
