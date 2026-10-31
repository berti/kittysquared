# Animations and Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add flashy, dynamic directional screen transitions (edge-to-edge coral horizontal wipe) and snappy fly-in modal dialog animations with input blocking to KittySquared.

**Architecture:** A centralized `ScreenTransitionOverlay` managed at `App.tsx` coordinates screen transitions (Home ↔ Game and Level ➔ Next Level) via two-phase wipes (cover in 150ms, swap state at midpoint, uncover in 150ms). Modals use shared CSS classes in `theme.css` for progressive backdrop darkening and top fly-in with input protection during entrance.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, CSS3 Transitions & Keyframes.

**Spec:** [`docs/superpowers/specs/2026-10-31-animations-and-transitions-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-10-31-animations-and-transitions-design.md)

## Global Constraints
* Edge-to-edge horizontal wipe (100vw, `position: fixed`, `inset: 0`, `z-index: 2000`) in Energetic Coral (`#FF9770`).
* Total transition duration: 300ms (150ms cover, 150ms reveal).
* Directional awareness: Forward (Right ➔ Left) for Home ➔ Game and level advance/retry; Backward (Left ➔ Right) for Game ➔ Home.
* Dialog entrance: Snappy fly-in from top (`translateY(-100%) -> translateY(0)`) using `cubic-bezier(0.16, 1, 0.3, 1)` over 300ms with backdrop darkening to `rgba(61, 49, 53, 0.65)`.
* Direct level advance: Victory dialog stays in place and the wipe curtain sweeps directly over it, dismissing it at midpoint behind the curtain.
* Full input blocking (`pointer-events: none` on interactive content or overlay shield) while transitions are active.
* All existing 61 tests across 14 test suites must continue to pass without regressions.

## Review Focus
1. Rapid double-clicks on level advance or mode buttons must not trigger concurrent or overlapping transitions.
2. Backdrop clicks on modals during the 300ms fly-in animation must not trigger premature dismissals.
3. Test runners with mock timers or synchronous DOM expectations must not hang on transition intervals.
4. Returning to the menu (`GameScreen` ➔ `HomeScreen`) must always sweep backward (Left to Right), reversing the entry direction.
5. Advancing a level directly from the victory modal must cleanly reset board state and error crosses behind the curtain without visual flicker.

---

### Task 1: CSS Animation Styles in `theme.css`

**Files:**
* Modify: `src/styles/theme.css`
* Test: `tests/styles/theme.test.ts`

**Interfaces:**
* Produces CSS classes:
  * `.screen-wipe-curtain`: Coral background (`#FF9770`), fixed `inset: 0`, `z-index: 2000`, pointer-events none.
  * `.screen-transition-shield`: Fixed `inset: 0`, `z-index: 1999`, pointer-events auto.
  * `.modal-backdrop-anim`: Backdrop darkening transition `rgba(61, 49, 53, 0.65)`.
  * `.modal-card-flyin`: Fly-in animation keyframes / transition from `translateY(-100%)` to `translateY(0)` with `cubic-bezier(0.16, 1, 0.3, 1)` 300ms.

- [ ] **Step 1: Write the failing test**
In `tests/styles/theme.test.ts`, add test cases asserting the presence of `.screen-wipe-curtain`, `.screen-transition-shield`, `.modal-backdrop-anim`, and `.modal-card-flyin` rules with `#FF9770` and transition curves.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/styles/theme.test.ts`
Expected: FAIL with missing CSS class assertions.

- [ ] **Step 3: Implement CSS classes in `src/styles/theme.css`**
Add `.screen-wipe-curtain`, `.screen-transition-shield`, `.modal-backdrop-anim`, and `.modal-card-flyin` with hardware-accelerated transforms (`will-change: transform`).

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/styles/theme.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/styles/theme.css tests/styles/theme.test.ts
git commit -m "feat(styles): add screen wipe curtain and modal fly-in animation classes"
```

---

### Task 2: `ScreenTransitionOverlay` Component

**Files:**
* Create: `src/components/ScreenTransitionOverlay.tsx`
* Create: `tests/components/ScreenTransitionOverlay.test.tsx`

**Interfaces:**
* Produces:
  ```ts
  export interface ScreenTransitionOverlayProps {
    isTransitioning: boolean;
    direction: 'forward' | 'backward';
    phase: 'idle' | 'covering' | 'uncovering';
  }
  export function ScreenTransitionOverlay(props: ScreenTransitionOverlayProps): preact.JSX.Element | null;
  ```

- [ ] **Step 1: Write the failing test**
Create `tests/components/ScreenTransitionOverlay.test.tsx` testing that:
1. When `isTransitioning` is false, it renders nothing or an inactive hidden element.
2. When `isTransitioning` is true and `phase === 'covering'`, the curtain is positioned with appropriate transform classes and the input shield is mounted (`data-testid="screen-transition-shield"`).
3. Correct transform values are applied for `forward` vs `backward` directions.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/components/ScreenTransitionOverlay.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `ScreenTransitionOverlay.tsx`**
Create the component rendering the shield and the animated curtain using the classes defined in Task 1.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/components/ScreenTransitionOverlay.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/ScreenTransitionOverlay.tsx tests/components/ScreenTransitionOverlay.test.tsx
git commit -m "feat(components): implement ScreenTransitionOverlay component"
```

---

### Task 3: Centralized Transition Coordinator in `App.tsx` & Screen Navigation

**Files:**
* Modify: `src/App.tsx`
* Modify: `src/components/GameScreen.tsx`
* Test: `tests/App.test.tsx`

**Interfaces:**
* Consumes: `ScreenTransitionOverlay` from Task 2.
* Produces:
  * `navigateWithTransition(direction: 'forward' | 'backward', callback: () => void)` coordinator in `App.tsx`.
  * Level advance and menu navigation triggers wrapped in transitions.

- [ ] **Step 1: Write the failing test in `tests/App.test.tsx`**
Add tests asserting that:
1. Navigating from Home to Game triggers a forward transition and renders the `ScreenTransitionOverlay`.
2. Navigating back to Home triggers a backward transition.
3. Advancing a level triggers a forward transition.
4. Input shield prevents click handling while transition is active.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/App.test.tsx`
Expected: FAIL on transition element or direction assertion.

- [ ] **Step 3: Implement transition coordination in `src/App.tsx` and `src/components/GameScreen.tsx`**
1. Add state in `App.tsx`: `transitionState: { isTransitioning: boolean, direction: 'forward' | 'backward', phase: 'idle' | 'covering' | 'uncovering' }`.
2. Add `navigateWithTransition(direction, updateFn)`:
   - Sets `isTransitioning: true, phase: 'covering'`.
   - At 150ms midpoint, executes `updateFn()`, then sets `phase: 'uncovering'`.
   - At 300ms completion, resets to `isTransitioning: false, phase: 'idle'`.
3. Wrap `handleStartMode` ('forward'), `handleAdvanceLevel` ('forward'), `handleRetryLevel` ('forward'), and `onBackToMenu` ('backward').
4. In `GameScreen.tsx`, ensure the victory modal does not trigger an exit animation before `onAdvanceLevel` runs; the curtain directly sweeps over it.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/App.tsx src/components/GameScreen.tsx tests/App.test.tsx
git commit -m "feat(app): wire centralized screen transitions for navigation and level advance"
```

---

### Task 4: Modal Dialog Fly-in Transitions & Input Locking

**Files:**
* Modify: `src/components/ConfirmDialog.tsx`
* Modify: `src/components/SettingsModal.tsx`
* Modify: `src/components/TutorialModal.tsx`
* Modify: `src/components/GameScreen.tsx` (victory and defeat overlays)
* Test: `tests/components/ConfirmDialog.test.tsx`
* Test: `tests/components/SettingsModal.test.tsx`
* Create: `tests/components/ModalTransitions.test.tsx`

**Interfaces:**
* Consumes: `.modal-backdrop-anim` and `.modal-card-flyin` from Task 1.
* Produces: Consistent fly-in from top on open, progressive darkening backdrop, and temporary pointer locking on entrance.

- [ ] **Step 1: Write the failing test in `tests/components/ModalTransitions.test.tsx`**
Assert that modals (`ConfirmDialog`, `SettingsModal`, `TutorialModal`, and GameScreen status overlays) apply the `.modal-card-flyin` and `.modal-backdrop-anim` classes and ignore backdrop dismiss clicks during the entrance animation window.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/components/ModalTransitions.test.tsx`
Expected: FAIL on animation class / input locking assertions.

- [ ] **Step 3: Implement modal transitions in modal components**
1. In `ConfirmDialog.tsx`, add `.modal-backdrop-anim` to backdrop and `.modal-card-flyin` to card container. Guard backdrop clicks with an entrance timer or pointer-events lock until 300ms elapses.
2. In `SettingsModal.tsx`, apply `.modal-backdrop-anim` and `.modal-card-flyin`.
3. In `TutorialModal.tsx`, apply `.modal-backdrop-anim` and `.modal-card-flyin`.
4. In `GameScreen.tsx`, apply `.modal-backdrop-anim` and `.modal-card-flyin` to the won and lost overlay cards.

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test tests/components/ConfirmDialog.test.tsx tests/components/SettingsModal.test.tsx tests/components/ModalTransitions.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/ConfirmDialog.tsx src/components/SettingsModal.tsx src/components/TutorialModal.tsx src/components/GameScreen.tsx tests/
git commit -m "feat(modals): apply top fly-in animation and backdrop darkening to all dialogs"
```

---

### Task 5: Full Regression Testing & Build Verification

**Files:**
* Test: All tests in `tests/`
* Verify: `npm run build`

- [ ] **Step 1: Run complete test suite**
Run: `npm test`
Expected: All 14 test suites and all 61+ tests PASS with 0 failures.

- [ ] **Step 2: Run TypeScript check and Vite build**
Run: `npm run build`
Expected: PASS with 0 type errors and successful build bundle.

- [ ] **Step 3: Final commit**
```bash
git commit --allow-empty -m "chore: complete screen transitions and dialog animations implementation"
```
