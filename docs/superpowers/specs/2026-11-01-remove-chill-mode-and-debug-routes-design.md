# Design Doc: Remove Chill Out Mode and Debug Routes

## Intent and Why
Streamline KittySquared into a unified single game mode following classic puzzle rules (hearts/mistakes limit, locked cats, and scoring) and remove temporary debug testing routes and scaffolding before production.

## Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Remove Chill Out mode across the entire codebase (engine, state, storage, UI, and tests).
  - Unify player progress in storage under a single `progress` record (`ModeProgress`).
  - Migrate legacy stored progress from `classic` or `chill` seamlessly on first load.
  - Replace the dual-mode cards in `HomeScreen.tsx` with a single, clear "Jugar ▶" card displaying current level and score.
  - Replace mode-specific resets in `SettingsModal.tsx` with a single "Reiniciar progreso" button and confirmation dialog.
  - Completely remove debug routes: delete `src/utils/route.ts` and `tests/utils/route.test.ts`, remove route synchronization from `App.tsx`, remove debug mode badge from `GameScreen.tsx`, remove debug auto-cross elimination from `gameState.ts`, and clean up debug redirect scripts from `index.html` and `public/404.html`.
  - Maintain 100% test pass rate across all unit and component tests.
- **Non-Goals:**
  - Adjusting phone font sizes or UI layouts beyond the single play button (deferred by user).
  - Modifying the core puzzle engine, generation, solver, or audio.
- **Anti-Goals:**
  - Do not lose existing player progress stored in `localStorage` under `classic` or `chill`.

## Approaches Considered
- **Approach 1: Full Architectural Cleanup & Unified Game Flow (Selected)**
  - Fully eliminate `GameMode` branching, dead conflict logic in `gameState`, dormant storage fields, and debug routing artifacts.
  - Trades off touching component and state signatures for clean, zero-tech-debt architecture.
- **Approach 2: Minimal UI Drop (Rejected)**
  - Hide Chill Out in UI while keeping legacy types and dormant branches in `storage` and `gameState`.
  - Rejected because it leaves technical debt and confusing zombie code.

## Detailed Architecture & Decisions
1. **Types (`src/types/puzzle.ts`)**:
   - Remove `GameMode` type (`'chill' | 'classic'`).
2. **State & Engine (`src/state/gameState.ts`)**:
   - Remove `mode` and `isDebug` from `LevelSessionState` and `createLevelSession(puzzle: PuzzleDef): LevelSessionState`.
   - Remove chill conflict calculation (`findConflictingCats` call in `applyCellTap`). Always validate placed cats against `puzzle.solution[row] === col`.
   - Remove debug auto-cross placement logic on correct cat placement.
3. **Storage (`src/state/storage.ts`)**:
   - `PersistedAppState` replaces `{ chill, classic }` with `{ progress: ModeProgress }`.
   - `loadPersistedState()`: checks `parsed.progress || parsed.classic || parsed.chill || defaults.progress`.
   - Replace `resetModeProgress(state, mode)` with `resetProgress(state): PersistedAppState`.
4. **Home Screen (`src/components/HomeScreen.tsx`)**:
   - Props update: replace `{ chill, classic, onSelectMode }` with `{ progress: ModeProgress, onPlay: () => void }`.
   - Replace the two cards with a single primary card showing:
     - Title: "Jugar"
     - Subtitle: "Nivel {progress.currentLevelId} / 300 • ⭐ {progress.totalScore} pts"
     - Button: "Jugar ▶"
5. **Settings Modal (`src/components/SettingsModal.tsx`)**:
   - Props update: remove `activeMode`.
   - Reset action: single button "Reiniciar progreso", opening confirmation dialog "¿Reiniciar todo el progreso?".
6. **Game Screen (`src/components/GameScreen.tsx`)**:
   - Remove `session.mode === 'classic'` checks (always display hearts and score).
   - Remove `session.isDebug` and the `🛠️ Debug Mode` badge.
7. **App Root (`src/App.tsx`)**:
   - Remove `parseDebugRoute`, `updateDebugRoute`, `clearDebugRoute`, `initialPath`, `initialRoute`, `isDebug`, and browser `popstate`/`hashchange` listeners.
   - Manage single `appState.progress`.
8. **HTML & Routing cleanup**:
   - Delete `src/utils/route.ts` and `tests/utils/route.test.ts`.
   - Remove `/debug/` redirect script from `index.html`.
   - In `public/404.html`, retain only the subpath fallback without `/debug/` handling.
