# Endgame State and Post-Game Flow Design

**Date:** 2026-11-01  
**Status:** In Review  
**Topic:** Endgame state on final level completion and post-game home screen dialog  

---

## 1. Intent and Why
Currently, when a player completes the final level (level 300), the victory dialog still displays *"Siguiente Nivel ▶"* and calls `onAdvanceLevel()`. Because the level ID is clamped to `puzzles.length`, the game simply reloads level 300 as a fresh session, repeatedly awarding points and giving no clear indication that all levels have been beaten.

We need a proper endgame completion state when beating the final level, returning to the menu, and presenting sensible post-game options when pressing "Play" thereafter (replaying the last level or resetting all progress with confirmation), while ensuring forward compatibility when more levels are added in future updates.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Display a celebratory completion state on the final level victory modal (*"¡Juego completado!"*) instead of the standard "Siguiente Nivel ▶" button.
- Provide a button on the final level victory modal (*"Volver al Menú"*) that saves the earned score and navigates the player back to the main home screen.
- On the Home Screen post-game, reflect completion on the Play button (e.g. *"¡Juego completado! • 300 / 300"*).
- When clicking "Jugar" in post-game state, display a dialog offering two options:
  1. Replay the last level (e.g., Level 300).
  2. Reset all progress and start from scratch.
- Require an explicit destructive confirmation dialog before resetting progress (reusing `ConfirmDialog` with the same safety as the settings reset).
- Ensure forward compatibility: if new levels are added in a future update (e.g. 400 levels), any player who completed level 300 automatically resumes at level 301 without being trapped in an endgame state or needing data migrations.

### Non-Goals
- Free level selector (levels remain sequential).
- Leaderboards or cloud save synchronization.

### Anti-Goals
- Hardcoding level count limits (e.g. hardcoding 300 in logic), which would break when new puzzles are added.
- Allowing accidental progress wipes with a single click.

---

## 3. Constraints
- Stack: Preact, TypeScript, Vite, CSS embedded/theme classes.
- Mobile-first responsive touch layout.
- State persistence in `localStorage` via `storage.ts`.
- All text in Spanish consistent with existing UI.

---

## 4. Approaches Considered

### Approach A: Boolean `completed` flag in `ModeProgress`
- Add `completed: boolean` to stored progress.
- **Trade-off:** If 100 new levels are deployed later, a player whose state has `completed: true` would require migration or extra logic to un-flag them so they can continue to level 301.

### Approach B: Progress Level Pointer `currentLevelId > puzzles.length` (Chosen)
- When completing the final level, advance `currentLevelId` to `lastPuzzleId + 1` (e.g., `301`).
- The endgame state is determined dynamically: `isGameCompleted = progress.currentLevelId > puzzles.length`.
- **Trade-off:**
  - When `puzzles.length === 300` and `currentLevelId === 301`: `isGameCompleted === true`.
  - When 100 new puzzles are added (`puzzles.length === 400`): `301 <= 400`, so `isGameCompleted` is immediately `false`, and the next level to play is naturally `301`!
  - Seamless, zero-migration, future-proof.

---

## 5. Detailed Behavior and UI Flow

### 5.1 Final Level Victory Modal (`GameScreen.tsx`)
- Detect `isLastLevel`: `puzzle.id === totalLevels` (passed as prop or computed from `puzzle.id === totalLevels`).
- If `isLastLevel`:
  - Title: *"¡Juego completado!"*
  - Message: *"¡Has superado todos los {totalLevels} niveles! Puntos totales acumulados: {totalScore} pts"*
  - Button text: *"Volver al Menú Principal"*
  - Clicking this button advances the level (setting `currentLevelId` to `totalLevels + 1`), commits the level points to `totalScore`, and returns to the Home Screen.

### 5.2 Home Screen Post-Game (`HomeScreen.tsx`)
- Dynamic total levels display: replace hardcoded `300` with `totalLevels` (prop).
- When `progress.currentLevelId > totalLevels`:
  - Play button subtext: *"¡Juego completado! • {totalLevels} / {totalLevels} • {progress.totalScore} pts"*
  - Clicking Play opens `PostGameDialog`.

### 5.3 Post-Game Modal (`PostGameDialog.tsx` or integrated component)
- Appears when clicking Play after having completed all levels.
- Modal card with cat icon and options:
  1. **"Jugar último nivel (Nivel {totalLevels})"**: Starts a fresh session on the last level.
  2. **"Reiniciar progreso desde cero"**: Destructive-styled button. Clicking it opens the existing `ConfirmDialog` asking *"¿Reiniciar progreso? Perderás el nivel alcanzado y todos los puntos acumulados volverán a 0."*
  3. **"Cerrar"** / Backdrop dismiss: Closes the modal.

### 5.4 Safety and Confirmation
- Resetting from the Post-Game Modal triggers the same `ConfirmDialog` used in `SettingsModal`, ensuring user cannot accidentally erase progress.

---

## 6. What's Left to the Builder
- Component composition (creating `PostGameModal.tsx` or rendering it cleanly in `HomeScreen.tsx`).
- Integration tests in `tests/components/HomeScreen.test.tsx`, `tests/components/GameScreen.test.tsx`, and `tests/App.test.tsx`.
