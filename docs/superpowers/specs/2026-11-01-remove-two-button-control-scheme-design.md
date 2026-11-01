# Design Doc: Remove Two-Button Control Scheme

## Intent & Why
Simplify game controls and UI by standardizing exclusively on the single-click / double-click control scheme (single tap = ✕ Cruz, double tap = 🐱 Gato). This eliminates the redundant two-button tool toggle (`✕ Cruz | 🐱 Gato`) and removes unnecessary configuration complexity.

## Goals, Non-Goals, and Anti-Goals
- **Goals**:
  - Remove `ControlScheme` domain type and any references to `'toggle'`.
  - Remove `activeTool` state and the toggle switch button from [GameScreen.tsx](file:///home/berti/code/kittysquared/src/components/GameScreen.tsx).
  - Simplify `applyCellTap` in [gameState.ts](file:///home/berti/code/kittysquared/src/state/gameState.ts) to accept only `(state, row, col, options?: { isDoubleTap?: boolean })`.
  - Remove `controlScheme` from `AppSettings` and default settings in [storage.ts](file:///home/berti/code/kittysquared/src/state/storage.ts).
  - Update [SettingsModal.tsx](file:///home/berti/code/kittysquared/src/components/SettingsModal.tsx) Controles tab to remove the scheme switcher and directly display the double-tap speed slider and interactive tester.
  - Keep the gesture helper label (`1 toque: ✕ Cruz • 2 toques: 🐱 Gato`) visible under the board in [GameScreen.tsx](file:///home/berti/code/kittysquared/src/components/GameScreen.tsx).
  - Update all test suites to reflect the unified control model.
- **Non-Goals**:
  - Modifying the double-tap timing logic in `Board.tsx` or drag-cross handling.
- **Anti-Goals**:
  - Retaining dead `controlScheme` code, types, or unused state variables.

## Constraints
- All existing tests and gameplay behaviors must pass.
- Saved settings in `localStorage` without `controlScheme` must parse cleanly without schema errors.

## Approaches Considered
- **Approach 1 (Selected)**: Clean refactor removing `ControlScheme` and `activeTool` completely across domain types, session state, settings storage, and modals, retaining the subtle gesture hint label under the board.
  - *Pros*: Clear, consistent, no dead code, guides players on interactions.
- **Approach 2**: Same code refactoring, but completely removing the controls bar container and helper text below the board.
  - *Pros*: Saves a few pixels of vertical space.
  - *Cons*: Leaves players without an in-game reminder of how to place cats if they skip the tutorial.

## Proposed Changes
1. **[src/types/puzzle.ts](file:///home/berti/code/kittysquared/src/types/puzzle.ts)**:
   - Remove `export type ControlScheme = 'toggle' | 'double-tap';`.
2. **[src/state/storage.ts](file:///home/berti/code/kittysquared/src/state/storage.ts)**:
   - Remove `controlScheme: ControlScheme;` from `AppSettings` interface and `DEFAULT_SETTINGS`.
   - Ensure `loadSettings()` strips or ignores any legacy stored `controlScheme`.
3. **[src/state/gameState.ts](file:///home/berti/code/kittysquared/src/state/gameState.ts)**:
   - Update `applyCellTap` signature:
     ```ts
     export function applyCellTap(
       state: LevelSessionState,
       row: number,
       col: number,
       options?: { isDoubleTap?: boolean }
     ): LevelSessionState
     ```
   - Logic: if `options?.isDoubleTap` is true, toggle cat (`cat -> empty`, else `cat`); otherwise toggle cross (`cross -> empty`, else `cross`).
4. **[src/components/GameScreen.tsx](file:///home/berti/code/kittysquared/src/components/GameScreen.tsx)**:
   - Remove `activeTool` state.
   - Remove the `settings.controlScheme === 'toggle'` conditional and the toggle switch button.
   - Render the subtle hint label (`1 toque: ✕ Cruz • 2 toques: 🐱 Gato`).
5. **[src/components/SettingsModal.tsx](file:///home/berti/code/kittysquared/src/components/SettingsModal.tsx)**:
   - Remove the "ESQUEMA DE CONTROL" selector buttons.
   - Directly render the "VELOCIDAD DE DOBLE TOQUE" section (slider and tester) without conditional wrapper.
6. **Tests**:
   - Update `tests/state/gameState.test.ts`, `tests/components/GameScreen.test.tsx`, `tests/components/SettingsModal.test.tsx`, `tests/components/ModalTransitions.test.tsx`, `tests/App.test.tsx`, and `tests/state/storage.test.ts`.
