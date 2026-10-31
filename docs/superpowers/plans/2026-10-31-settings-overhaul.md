# Settings Menu Overhaul & Game Screen Streamlining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the settings modal into a responsive 4-tab interface (Controls, Graphics, Sound, Reset) with customizable double-tap speed and tap tester, live mini-board preview, and in-app confirmation dialogs, while streamlining the game screen with a dedicated top-bar level restart button and removing bottom recovery buttons.

**Architecture:** Extend `storage.ts` with `doubleTapTimeoutMs` and pass it to `Board.tsx`. Implement a reusable `ConfirmDialog` component. Decompose `SettingsModal.tsx` into modular tab components with responsive navigation. Streamline `GameScreen.tsx` top bar with restart `↺` backed by `ConfirmDialog`, update the status bar (removing mode text), and remove bottom undo and clear buttons.

**Tech Stack:** Preact 10.x, TypeScript, Vite, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-10-31-settings-overhaul-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-10-31-settings-overhaul-design.md)

## Global Constraints

- Preact 10.x hooks (`useState`, `useMemo`, `useCallback`, `useRef`).
- Responsive design: tabs display icon-only on compact mobile viewports (< 420px) and icon + text on wider displays.
- Visual theme colors: background `#FFFBF2`, tray `#EFE6D5`, border `#E2D6C1`, text `#3D3135`, subtext `#7A686E`, primary orange `#F3722C`, danger `#EF4444`.
- Backward compatibility: existing persisted states in localStorage without `doubleTapTimeoutMs` must auto-migrate to 500ms without data loss.
- Zero browser popups (`window.alert`, `window.confirm`).

## Review Focus

1. **Persisted state migration with missing `doubleTapTimeoutMs`**: returns default 500ms and does not crash or overwrite existing progress.
2. **Double-tap timeout propagation**: `Board.tsx` respects custom `doubleTapTimeoutMs` (e.g. 300ms vs 800ms) correctly detecting taps within threshold and rejecting taps past threshold.
3. **Contextual Reset display**: In game mode `chill`, only Chill reset appears; in `classic`, only Classic reset appears; in Home, both appear.
4. **Custom ConfirmDialog**: Focus is trapped or clean, Escape/backdrop cancels, Confirm invokes callback and closes.
5. **Level restart in GameScreen**: Top bar `↺` asks for confirmation via `ConfirmDialog`, and on confirm calls `onRetryLevel()` without modifying persistent score or mode progress.

---

### Task 1: Double-Tap Speed Setting in Storage & Board Integration

**Files:**
- Modify: `src/state/storage.ts`
- Modify: `src/components/Board.tsx`
- Test: `tests/state/storage.test.ts`
- Test: `tests/components/BoardDoubleClick.test.tsx`

**Interfaces:**
- Consumes: `AppSettings` from `src/state/storage.ts`
- Produces: `AppSettings.doubleTapTimeoutMs: number` (default: 500), `BoardProps.doubleTapTimeoutMs?: number`

- [ ] **Step 1: Write failing test for storage migration with `doubleTapTimeoutMs`**

Add tests to `tests/state/storage.test.ts`:
```ts
it('migrates older state by adding default doubleTapTimeoutMs (500)', () => {
  const legacyState = {
    chill: { currentLevelId: 2, totalScore: 0, activeSnapshot: null },
    classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
    settings: {
      controlScheme: 'double-tap',
      catVariant: 'black',
      regionAssist: 'off',
      musicMuted: false,
      sfxMuted: false,
      tutorialSeen: true,
    },
  };
  localStorage.setItem('kittysquared_state_v1', JSON.stringify(legacyState));
  const loaded = loadPersistedState();
  expect(loaded.settings.doubleTapTimeoutMs).toBe(500);
});
```

- [ ] **Step 2: Run storage tests to verify failure**

Run: `npx vitest run tests/state/storage.test.ts`  
Expected: FAIL with undefined `doubleTapTimeoutMs`.

- [ ] **Step 3: Update `src/state/storage.ts`**

Update `AppSettings` interface:
```ts
export interface AppSettings {
  controlScheme: ControlScheme;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
}
```
Update `getDefaultAppState()`:
```ts
doubleTapTimeoutMs: 500,
```
Update `loadPersistedState()`:
```ts
if (typeof parsed.settings.doubleTapTimeoutMs !== 'number' || isNaN(parsed.settings.doubleTapTimeoutMs)) {
  parsed.settings.doubleTapTimeoutMs = 500;
}
```

- [ ] **Step 4: Update `src/components/Board.tsx` to accept `doubleTapTimeoutMs`**

Add `doubleTapTimeoutMs?: number` to `BoardProps` (defaulting to 500):
Replace `const DOUBLE_TAP_TIMEOUT_MS = 1000;` with `doubleTapTimeoutMs = 500` prop usage.

- [ ] **Step 5: Write test for configurable timeout in `tests/components/BoardDoubleClick.test.tsx`**

Verify that when `doubleTapTimeoutMs={300}`, a second tap at 350ms does NOT trigger double tap, whereas at 200ms it DOES.

- [ ] **Step 6: Run tests to verify pass**

Run: `npx vitest run tests/state/storage.test.ts tests/components/BoardDoubleClick.test.tsx`  
Expected: PASS.

---

### Task 2: Reusable `ConfirmDialog` Component

**Files:**
- Create: `src/components/ConfirmDialog.tsx`
- Test: `tests/components/ConfirmDialog.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```

- [ ] **Step 1: Write tests for `ConfirmDialog`**

Create `tests/components/ConfirmDialog.test.tsx`:
- Render when `isOpen=false` -> renders nothing.
- Render when `isOpen=true` -> displays `title`, `description`, `icon`, confirm button, cancel button.
- Clicking confirm button calls `onConfirm`.
- Clicking cancel button calls `onCancel`.
- Pressing Escape calls `onCancel`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/ConfirmDialog.test.tsx`  
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/components/ConfirmDialog.tsx`**

Implement `ConfirmDialog` using clay palette styling:
- Fixed overlay backdrop (`rgba(61, 49, 53, 0.65)`).
- Card container with `border: 4px solid #E2D6C1`, `borderRadius: 20px`, `background: #FFFBF2`.
- Confirm button styling: `#EF4444` if `isDestructive`, else `#F3722C`.
- Cancel button styling: white background, `#E2D6C1` border.
- `role="dialog"`, `aria-modal="true"`.
- Keyboard handler for `Escape`.

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/components/ConfirmDialog.test.tsx`  
Expected: PASS.

---

### Task 3: Tabbed `SettingsModal` with Controls Tester, Graphics Preview & Contextual Reset

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `ConfirmDialog` from `src/components/ConfirmDialog.tsx`
- Produces: Updated `SettingsModalProps`:
  ```ts
  export interface SettingsModalProps {
    settings: AppSettings;
    activeMode?: GameMode | null;
    onUpdateSettings: (settings: AppSettings) => void;
    onResetMode: (mode: GameMode) => void;
    onClose: () => void;
  }
  ```

- [ ] **Step 1: Write failing tests for tabbed `SettingsModal`**

Create or update `tests/components/SettingsModal.test.tsx`:
- Renders tab buttons: `controls`, `graphics`, `sound`, `reset`.
- Switching tabs displays the matching tab pane.
- **Controls tab**:
  - Selecting "double-tap" reveals speed slider and tap tester.
  - Changing slider calls `onUpdateSettings` with new `doubleTapTimeoutMs`.
  - Tapping tester twice within speed triggers double-tap feedback.
- **Graphics tab**:
  - Displays cat variant selector and region assist modes.
  - Displays mini-board preview.
- **Sound tab**:
  - Toggles music and SFX.
- **Reset tab**:
  - If `activeMode="chill"`, only Chill reset is shown.
  - If `activeMode="classic"`, only Classic reset is shown.
  - If `activeMode=null` or `undefined`, both are shown.
  - Clicking reset button does NOT call `window.confirm`; instead opens `ConfirmDialog`.
  - Confirming in `ConfirmDialog` calls `onResetMode`.

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement tabbed `SettingsModal.tsx`**

Refactor `src/components/SettingsModal.tsx`:
- Internal state: `activeTab: 'controls' | 'graphics' | 'sound' | 'reset'` (default: `'controls'`).
- `confirmResetMode: GameMode | null` state for `ConfirmDialog`.
- Top navigation bar: buttons for each tab with icon + label (using CSS class or media query for responsive label hiding on narrow screens).
- Pane 1 (Controls): scheme buttons, speed slider (250–900ms), tap tester box with click handler measuring interval and updating state.
- Pane 2 (Graphics): cat variant cards, visual assist mode buttons, 3×3 live mini-board displaying selected cat & pattern.
- Pane 3 (Sound): music and SFX buttons.
- Pane 4 (Reset): contextual mode reset buttons based on `activeMode`, opening `ConfirmDialog`.

- [ ] **Step 4: Run test to verify pass**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`  
Expected: PASS.

---

### Task 4: Streamline `GameScreen` & Connect `App.tsx`

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/App.tsx`
- Test: `tests/App.test.tsx`

**Interfaces:**
- Consumes: `ConfirmDialog` from `src/components/ConfirmDialog.tsx`, `SettingsModal` with `activeMode`
- Produces: Cleaned `GameScreen` with top-bar `↺` and status bar without mode text.

- [ ] **Step 1: Write test for top-bar restart and removed bottom buttons**

Update `tests/App.test.tsx` or create `tests/components/GameScreenRestart.test.tsx`:
- In game screen, bottom `↩ Deshacer` and `🧹 Limpiar cruces` are no longer present in DOM.
- Top bar contains restart button `↺` (`data-testid="restart-level-btn"`).
- Clicking restart button opens `ConfirmDialog`.
- Confirming restart calls `onRetryLevel` (resets session board).
- Canceling restart dismisses dialog without resetting board.
- Status bar does not contain the string "(Chill Out)" or "(Classic)".

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run tests/App.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Update `src/components/GameScreen.tsx`**

- Add state: `showRestartConfirm: boolean`.
- In Top Bar: add button `↺` next to `⚙️`.
- Clicking `↺` sets `setShowRestartConfirm(true)`.
- Render `ConfirmDialog` for restart level:
  - `isOpen={showRestartConfirm}`
  - `title="¿Reiniciar este nivel?"`
  - `description="Se reiniciará el tablero actual, borrando todos los gatos y cruces colocados."`
  - `confirmText="Reiniciar nivel"`
  - `onConfirm={() => { setShowRestartConfirm(false); onRetryLevel(); }}`
  - `onCancel={() => setShowRestartConfirm(false)}`
- In Status Bar:
  - Remove mode text `({session.mode === 'chill' ? 'Chill Out' : 'Classic'})`.
  - In Classic mode: display cats, hearts, score.
  - In Chill mode: display cats.
- In Board: pass `doubleTapTimeoutMs={settings.doubleTapTimeoutMs}`.
- Remove `handleUndo` and `handleClear` button row from the bottom.

- [ ] **Step 4: Update `src/App.tsx`**

Pass `activeMode={activeScreen === 'game' ? activeMode : null}` to `SettingsModal`:
```tsx
<SettingsModal
  settings={appState.settings}
  activeMode={activeScreen === 'game' ? activeMode : null}
  onUpdateSettings={handleUpdateSettings}
  onResetMode={handleResetMode}
  onClose={() => setShowSettings(false)}
/>
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run tests/App.test.tsx`  
Expected: PASS.

---

### Task 5: Full Verification & Build Validation

**Files:**
- Entire codebase

- [ ] **Step 1: Run complete test suite**

Run: `npm test`  
Expected: All tests pass across the entire project.

- [ ] **Step 2: Run production build check**

Run: `npm run build`  
Expected: Clean build without TypeScript or bundling errors.
