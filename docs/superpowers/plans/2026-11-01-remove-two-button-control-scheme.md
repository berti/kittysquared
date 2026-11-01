# Remove Two-Button Control Scheme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two-button control scheme (`'toggle'`) entirely, standardizing the game on the single-tap (cross) / double-tap (cat) control scheme across domain types, session state, settings storage, gameplay UI, and modals.

**Architecture:** Purge `ControlScheme` and `activeTool` from `puzzle.ts`, `gameState.ts`, and `storage.ts`. Simplify `applyCellTap` to directly branch on `options?.isDoubleTap`. In `GameScreen.tsx`, eliminate `activeTool` state and render the subtle gesture reminder label permanently. In `SettingsModal.tsx`, remove the scheme switch buttons and show the double-tap sensitivity slider and live tester directly.

**Tech Stack:** TypeScript, Preact, Vitest, Testing Library Preact.

**Spec:** [docs/superpowers/specs/2026-11-01-remove-two-button-control-scheme-design.md](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-01-remove-two-button-control-scheme-design.md)

## Global Constraints
- Vitest test suite must pass 100% cleanly without type errors.
- Existing double-tap detection in `Board.tsx` and drag-cross mechanics in `GameScreen.tsx` must remain intact.
- Saved settings in `localStorage` from older versions containing `controlScheme` must not crash `loadSettings()`.

## Review Focus
1. Legacy stored settings: `loadSettings()` with `{ controlScheme: 'toggle' }` returns valid `AppSettings` without runtime crashes.
2. Cell single-tap toggling: single tap on empty produces cross, on cross produces empty.
3. Cell double-tap toggling: double tap on empty produces cat, on cat produces empty.
4. Settings modal controls tab: renders the double-tap speed slider and tester directly without requiring scheme selection.
5. GameScreen controls area: always displays the gesture hint text without rendering `data-testid="tool-toggle-switch"`.

---

### Task 1: Domain Types and Game State Engine

**Files:**
- Modify: `src/types/puzzle.ts:5`
- Modify: `src/state/gameState.ts:55-90`
- Test: `tests/state/gameState.test.ts`

**Interfaces:**
- Consumes: `LevelSessionState`, `CellState`
- Produces: `applyCellTap(state: LevelSessionState, row: number, col: number, options?: { isDoubleTap?: boolean }): LevelSessionState`

- [ ] **Step 1: Write the updated tests in `tests/state/gameState.test.ts`**

Update `applyCellTap` calls in `tests/state/gameState.test.ts` to remove the `scheme` and `activeTool` arguments:
```ts
it('applyCellTap toggles cross on single tap and cat on double tap', () => {
  let state = createInitialSession(mockPuzzle, 'chill');
  // Single tap: empty -> cross
  state = applyCellTap(state, 0, 0);
  expect(state.board[0][0]).toBe('cross');

  // Single tap: cross -> empty
  state = applyCellTap(state, 0, 0);
  expect(state.board[0][0]).toBe('empty');

  // Double tap: empty -> cat
  state = applyCellTap(state, 0, 0, { isDoubleTap: true });
  expect(state.board[0][0]).toBe('cat');

  // Double tap: cat -> empty
  state = applyCellTap(state, 0, 0, { isDoubleTap: true });
  expect(state.board[0][0]).toBe('empty');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: FAIL with compilation/argument mismatch or type errors.

- [ ] **Step 3: Update `src/types/puzzle.ts` and `src/state/gameState.ts`**

- In `src/types/puzzle.ts`, remove `export type ControlScheme = 'toggle' | 'double-tap';`.
- In `src/state/gameState.ts`, remove `ControlScheme` import and simplify `applyCellTap`:
```ts
export function applyCellTap(
  state: LevelSessionState,
  row: number,
  col: number,
  options?: { isDoubleTap?: boolean }
): LevelSessionState {
  if (state.status !== 'playing') return state;

  if (state.mode === 'classic' && (state.lockedCats[row][col] || state.errorCrosses?.[row][col])) {
    return state;
  }

  const current = state.board[row][col];
  let nextState: CellState = current;

  if (options?.isDoubleTap) {
    nextState = current === 'cat' ? 'empty' : 'cat';
  } else {
    nextState = current === 'cross' ? 'empty' : 'cross';
  }

  // Classic mode validation and placement logic continues as before...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: PASS

---

### Task 2: Settings Storage and Persistence

**Files:**
- Modify: `src/state/storage.ts:1-65`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Consumes: `AppSettings`
- Produces: `AppSettings` (without `controlScheme`), `DEFAULT_SETTINGS`, `loadSettings()`, `saveSettings()`

- [ ] **Step 1: Write failing test in `tests/state/storage.test.ts`**

Add tests confirming `AppSettings` has no `controlScheme`, and that legacy stored JSON with `controlScheme` loads cleanly:
```ts
it('loads legacy settings with controlScheme cleanly without saving it forward', () => {
  localStorage.setItem('kitty_squared_settings', JSON.stringify({
    controlScheme: 'toggle',
    catVariant: 'black',
    musicMuted: false,
    sfxMuted: false,
    tutorialSeen: true,
  }));

  const loaded = loadSettings();
  expect((loaded as any).controlScheme).toBeUndefined();
  expect(loaded.catVariant).toBe('black');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement updates in `src/state/storage.ts`**

- Remove `ControlScheme` import from `src/types/puzzle`.
- Remove `controlScheme: ControlScheme;` from `interface AppSettings`.
- In `DEFAULT_SETTINGS`, remove `controlScheme: 'toggle'`.
- In `loadSettings()`, parse and destructure out `controlScheme` if present from legacy JSON, ensuring the returned `AppSettings` adheres to the new type definition.
- Fix all remaining fixtures in `tests/state/storage.test.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS

---

### Task 3: Settings Modal UI

**Files:**
- Modify: `src/components/SettingsModal.tsx:40-270`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `AppSettings`, `SettingsModalProps`
- Produces: `SettingsModal` component

- [ ] **Step 1: Update tests in `tests/components/SettingsModal.test.tsx`**

- Remove fixtures and tests for `select-control-toggle` and `select-control-double-tap`.
- Assert that under the Controles tab, the double-tap slider and `double-tap-tester` are immediately rendered without any scheme selector.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `src/components/SettingsModal.tsx`**

- Remove `ControlScheme` from imports.
- Remove `setControl` function.
- In the tab `'controls'` content:
  - Remove the "ESQUEMA DE CONTROL" heading and buttons (`select-control-toggle` and `select-control-double-tap`).
  - Render the "VELOCIDAD DE DOBLE TOQUE" slider and `double-tap-tester` directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: PASS

---

### Task 4: GameScreen UI and Integration Test Suite Cleanup

**Files:**
- Modify: `src/components/GameScreen.tsx:35-65, 235-290`
- Modify: `tests/components/GameScreen.test.tsx`
- Modify: `tests/components/ModalTransitions.test.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: `applyCellTap(session, r, c, options)`
- Produces: `GameScreen` component

- [ ] **Step 1: Update tests for `GameScreen`, `ModalTransitions`, and `App`**

- In `tests/components/GameScreen.test.tsx`: remove references to `tool-toggle-switch` or `activeTool`, verify cell tap triggers `applyCellTap(session, r, c, options)`.
- In `tests/components/ModalTransitions.test.tsx`: remove `controlScheme: 'toggle'` from settings mock objects.
- In `tests/App.test.tsx`: remove `controlScheme: 'toggle'` from settings mocks and any tests clicking `select-control-double-tap`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run tests/components/GameScreen.test.tsx tests/App.test.tsx tests/components/ModalTransitions.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `src/components/GameScreen.tsx`**

- Remove `const [activeTool, setActiveTool] = useState<'cross' | 'cat'>('cat');`.
- In `handleCellTap`, call `applyCellTap(session, r, c, options)`.
- In Controls Bar (around line 237):
  - Replace the conditional `{settings.controlScheme === 'toggle' ? (...) : (...)}` with the single helper label:
    ```tsx
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#8C7A80', fontWeight: 600 }}>
        1 toque: ✕ Cruz • 2 toques: 🐱 Gato
      </div>
    </div>
    ```

- [ ] **Step 4: Run full test suite to verify everything passes**

Run: `npm test`
Expected: All 22 test files and 104+ tests PASS.
