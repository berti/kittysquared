# Auto-Cross Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an auto-cross assist setting with wave animation, replace the settings modal reset tab with an "Ayudas" tab, and move the progress reset button to the main menu.

**Architecture:** 
- Add `autoCross` assist mode (`'off' | 'row_col_surround' | 'all'`) to the persisted app settings with `'off'` as default.
- Upon correct cat placement in `applyCellTap`, synchronously calculate and assign crosses to qualifying empty cells and record the auto-cross event in the session state.
- In `Board.tsx`, animate the newly placed crosses with a radial CSS pop-in whose `animation-delay` scales with distance from the placed cat to complete under 500 ms.
- Reorganize UI: replace the `reset` tab in `SettingsModal` with an `ayudas` tab, and relocate the reset progress button to the bottom of `HomeScreen` with subdued text and a confirmation dialog.

**Tech Stack:** Preact, TypeScript, Vitest, Testing Library Preact, CSS animations.

**Spec:** `docs/superpowers/specs/2026-11-02-auto-cross-assist-design.md`

## Global Constraints
- Persisted settings key: `kittysquared_state_v1`.
- `autoCross` setting default value: `'off'`.
- Valid `autoCross` modes: `'off'`, `'row_col_surround'`, `'all'`.
- "Ayudas" tab options copy:
  - *No* (maps to `'off'`)
  - *Fila, columna y alrededor* (maps to `'row_col_surround'`)
  - *Fila, columna, alrededor y color* (maps to `'all'`)
- Settings modal retains exactly 4 tabs: `Controles`, `Gráficos`, `Sonido`, `Ayudas`.
- Wave animation must finish within 500 ms across the entire board (maximum board size 10x10).
- Progress reset button on home screen must match the width of other menu buttons and retain the destructive `ConfirmDialog`.

## Review Focus
- Auto-crossing must never overwrite existing player crosses, error crosses, or locked cats.
- Auto-crossing must only trigger on correct cat placement, never when making a mistake.
- When an auto-cross fills the final remaining cells and completes the puzzle, `isBoardSolved` and victory logic must resolve correctly on the same turn.
- Rapid subsequent taps during the wave animation must not corrupt board state or drop inputs.
- Home screen reset confirmation must cleanly reset current level to 1, total score to 0, and clear any active snapshot.

---

### Task 1: Add AutoCrossMode to types and persisted storage

**Files:**
- Modify: `src/types/puzzle.ts`
- Modify: `src/state/storage.ts`
- Modify: `tests/state/storage.test.ts`

**Interfaces:**
- Produces:
  - `export type AutoCrossMode = 'off' | 'row_col_surround' | 'all';` in `src/types/puzzle.ts`
  - `export const VALID_AUTO_CROSS_MODES: AutoCrossMode[] = ['off', 'row_col_surround', 'all'];` in `src/state/storage.ts`
  - `AppSettings.autoCross: AutoCrossMode` in `src/state/storage.ts` (default: `'off'`)

- [ ] **Step 1: Write failing unit test in storage.test.ts**

Add tests checking that:
1. `getDefaultAppState()` returns `settings.autoCross === 'off'`.
2. `loadPersistedState()` preserves valid `autoCross` values and falls back to `'off'` when invalid or missing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL due to missing property or type mismatch.

- [ ] **Step 3: Implement AutoCrossMode in puzzle.ts and storage.ts**

Update `src/types/puzzle.ts`:
Add `export type AutoCrossMode = 'off' | 'row_col_surround' | 'all';`

Update `src/state/storage.ts`:
- Import `AutoCrossMode`.
- Add `VALID_AUTO_CROSS_MODES: AutoCrossMode[] = ['off', 'row_col_surround', 'all']`.
- Add `autoCross: AutoCrossMode` to `AppSettings`.
- In `getDefaultAppState()`, add `autoCross: 'off'`.
- In `loadPersistedState()`, read `cleanRawSettings.autoCross` and validate against `VALID_AUTO_CROSS_MODES`, falling back to `'off'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/puzzle.ts src/state/storage.ts tests/state/storage.test.ts
git commit -m "feat(settings): add autoCross assist setting and persistence"
```

---

### Task 2: Implement Auto-Cross Logic in Game State

**Files:**
- Modify: `src/state/gameState.ts`
- Modify: `src/components/GameScreen.tsx`
- Modify: `tests/state/gameState.test.ts`

**Interfaces:**
- Consumes:
  - `AutoCrossMode` from `src/types/puzzle.ts`
- Produces:
  - `applyCellTap(state, row, col, options?: { isDoubleTap?: boolean; autoCross?: AutoCrossMode })`
  - `LevelSessionState.lastAutoCrossCells?: { row: number; col: number }[]`

- [ ] **Step 1: Write failing unit tests in gameState.test.ts**

Add tests in `tests/state/gameState.test.ts`:
1. When `autoCross === 'off'`, placing a correct cat does not place auto-crosses.
2. When `autoCross === 'row_col_surround'`, placing a correct cat places crosses in all empty cells in the same row, same column, and surrounding 8 neighbors, leaving other cells alone and not overwriting existing cats.
3. When `autoCross === 'all'`, placing a correct cat places crosses in row, column, neighbors, AND cells in the same region.
4. Incorrect cat placement does NOT trigger auto-crosses (only marks the mistake error cross).
5. Existing crosses and locked cats are preserved untouched.
6. Auto-cross records `lastAutoCrossCells` containing the list of newly placed coordinates.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: FAIL because `autoCross` option is not yet handled.

- [ ] **Step 3: Implement auto-cross logic in `applyCellTap` and pass `settings.autoCross` in `GameScreen.tsx`**

In `src/state/gameState.ts`:
- Update `applyCellTap` signature options to accept `autoCross?: AutoCrossMode`.
- In `applyCellTap`, when cat placement is correct:
  - Determine qualifying coordinates to eliminate:
    - Same row: `r === row && c !== col`
    - Same column: `c === col && r !== row`
    - Surround: `Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1 && !(r === row && c === col)`
    - If `options?.autoCross === 'all'`: also `state.puzzle.regions[r][c] === state.puzzle.regions[row][col] && !(r === row && c === col)`
  - For each qualifying coordinate where `newBoard[r][c] === 'empty'`:
    - Set `newBoard[r][c] = 'cross'`
    - Add `{ row: r, col: c }` to `lastAutoCrossCells`
  - Re-evaluate `isBoardSolved(newBoard, state.puzzle.regions)` to ensure victory triggers if this placement and its crosses complete the puzzle.
- In `src/components/GameScreen.tsx`:
  - Pass `autoCross: settings.autoCross` in the options of `applyCellTap`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/gameState.ts src/components/GameScreen.tsx tests/state/gameState.test.ts
git commit -m "feat(game): implement auto-cross logic on cat placement"
```

---

### Task 3: Replace Reset Tab with "Ayudas" Tab in SettingsModal

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes:
  - `AppSettings.autoCross`
  - `AutoCrossMode`
- Produces:
  - `SettingsTab = 'controls' | 'graphics' | 'sound' | 'ayudas'`
  - Tab button `data-testid="tab-btn-ayudas"` with icon `💡` and label `Ayudas`
  - Pane `data-testid="pane-ayudas"` with option selectors:
    - `data-testid="select-autocross-off"` (*No*)
    - `data-testid="select-autocross-row-col-surround"` (*Fila, columna y alrededor*)
    - `data-testid="select-autocross-all"` (*Fila, columna, alrededor y color*)
  - Removes `reset` tab and `ConfirmDialog` from `SettingsModal`.

- [ ] **Step 1: Write failing tests in SettingsModal.test.tsx**

Update `tests/components/SettingsModal.test.tsx`:
- Verify tab buttons are: `controls`, `graphics`, `sound`, `ayudas`.
- Verify `tab-btn-reset` no longer exists.
- Verify clicking `tab-btn-ayudas` shows `pane-ayudas`.
- Verify selecting each of the 3 auto-cross options calls `onUpdateSettings` with the corresponding `autoCross` value (`'off'`, `'row_col_surround'`, `'all'`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL due to missing `tab-btn-ayudas` and presence of `reset`.

- [ ] **Step 3: Update SettingsModal.tsx**

In `src/components/SettingsModal.tsx`:
- Change `SettingsTab` to `'controls' | 'graphics' | 'sound' | 'ayudas'`.
- Replace the reset tab navigation item with `{ id: 'ayudas', icon: '💡', label: 'Ayudas' }`.
- Remove the `reset` tab panel and `ConfirmDialog` import / markup.
- Remove `onResetProgress` from `SettingsModalProps` (it is now handled on the home screen).
- Add `pane-ayudas` rendering:
  - Heading: "COLOCAR CRUCES AUTOMÁTICAMENTE"
  - 3 option buttons with clear active indicator (border/shadow):
    1. *No* (`autoCross === 'off'`)
    2. *Fila, columna y alrededor* (`autoCross === 'row_col_surround'`)
    3. *Fila, columna, alrededor y color* (`autoCross === 'all'`)
- Update `src/App.tsx` where `SettingsModal` is rendered to remove `onResetProgress` prop from it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx src/App.tsx tests/components/SettingsModal.test.tsx
git commit -m "feat(ui): add Ayudas tab to settings modal and remove reset tab"
```

---

### Task 4: Move Reset Progress to Main Menu (HomeScreen)

**Files:**
- Modify: `src/components/HomeScreen.tsx`
- Modify: `tests/components/HomeScreen.test.tsx`
- Modify: `tests/App.test.tsx` (if needed for updated settings/reset flows)

**Interfaces:**
- Consumes:
  - `HomeScreenProps.onResetProgress?: () => void`
- Produces:
  - Subdued reset progress button: `data-testid="home-reset-progress-btn"` at the bottom of `HomeScreen`.
  - Reuses or renders `ConfirmDialog` to confirm before triggering `onResetProgress`.

- [ ] **Step 1: Write failing unit test in HomeScreen.test.tsx**

In `tests/components/HomeScreen.test.tsx`:
- Verify `home-reset-progress-btn` renders at the bottom of the screen.
- Verify clicking it opens a confirmation dialog.
- Verify confirming in the dialog calls `onResetProgress`.
- Verify cancelling in the dialog closes it without calling `onResetProgress`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/HomeScreen.test.tsx`
Expected: FAIL because `home-reset-progress-btn` is not implemented.

- [ ] **Step 3: Implement bottom reset button and confirm dialog in HomeScreen.tsx**

In `src/components/HomeScreen.tsx`:
- Import `ConfirmDialog`.
- Add local state `showConfirmReset` (boolean).
- At the bottom of the screen container, place:
  ```tsx
  <div style={{ width: '100%', marginTop: 'auto', paddingTop: '16px' }}>
    <button
      type="button"
      data-testid="home-reset-progress-btn"
      onClick={() => setShowConfirmReset(true)}
      style={{
        width: '100%',
        background: 'transparent',
        border: '1.5px solid #D8CBB6',
        borderRadius: '14px',
        padding: '12px',
        fontSize: '13.5px',
        fontWeight: 700,
        color: '#9E8D93',
        cursor: 'pointer',
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
      }}
    >
      Reiniciar progreso de partida
    </button>
  </div>
  ```
- Render `ConfirmDialog` with title "¿Reiniciar progreso?", description, and calls to `onResetProgress`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/HomeScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeScreen.tsx tests/components/HomeScreen.test.tsx
git commit -m "feat(ui): add subdued progress reset button to home screen"
```

---

### Task 5: Wave Animation for Auto-Crosses in Board

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/components/Board.tsx`
- Modify: `tests/components/Board.test.tsx`

**Interfaces:**
- Consumes:
  - `session.lastAutoCrossCells` and `session.lastPlacedCat`
- Produces:
  - CSS keyframes `@keyframes crossWavePop`
  - `.cross-mark.cross-wave` class with computed `animationDelay: ${dist * 35}ms` where $\text{dist} = \max(|r - r_{cat}|, |c - c_{cat}|)$.
  - Total animation completed under 500 ms.

- [ ] **Step 1: Write failing test in Board.test.tsx**

In `tests/components/Board.test.tsx`:
- When `lastPlacedCat` is provided along with `autoCrossCells` (or auto-crossed cell coordinates):
  - Verify that newly placed auto-cross cells have the `.cross-wave` class or inline `animationDelay` proportional to distance $\max(|r - r_{cat}|, |c - c_{cat}|)$.
  - Verify that distance 0 has 0ms delay, distance 1 has ~35ms delay, distance 2 has ~70ms delay, etc.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Board.test.tsx`
Expected: FAIL because `autoCrossCells` / wave animation is not on `Board.tsx`.

- [ ] **Step 3: Implement CSS keyframes and staggered delays in theme.css and Board.tsx**

In `src/styles/theme.css`:
```css
@keyframes crossWavePop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.18);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.cross-mark.cross-wave {
  animation: crossWavePop 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  will-change: transform, opacity;
}
```

In `src/components/Board.tsx`:
- Accept `autoCrossCells?: { row: number; col: number }[]` in `BoardProps`.
- When rendering each cell `(r, c)`:
  - Check if `autoCrossCells` includes `(r, c)`.
  - If so, and `lastPlacedCat` is defined:
    - Compute `dist = Math.max(Math.abs(r - lastPlacedCat.row), Math.abs(c - lastPlacedCat.col))`
    - Add `className="cross-mark cross-wave"` and `style={{ animationDelay: `${dist * 35}ms` }}`.
- In `src/components/GameScreen.tsx`:
  - Pass `autoCrossCells={session.lastAutoCrossCells}` to `<Board />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Board.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All test suites PASS.

- [ ] **Step 6: Commit**

```bash
git add src/styles/theme.css src/components/Board.tsx src/components/GameScreen.tsx tests/components/Board.test.tsx
git commit -m "feat(anim): add wave animation for auto-placed crosses"
```
