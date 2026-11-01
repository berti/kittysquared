# Endgame State and Post-Game Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a proper endgame victory state when beating the final level, return to the main screen, and provide a post-game options dialog with replay and confirmed reset options, while ensuring forward compatibility when more levels are added in future updates.

**Architecture:** 
- In `GameScreen`, detect if the current puzzle is the final level (`totalLevels === puzzle.id`). If so, display *"¡Juego completado!"* and replace *"Siguiente Nivel ▶"* with *"Volver al Menú Principal"*.
- In `App.tsx`, completing the final level advances `progress.currentLevelId` to `puzzles.length + 1` (e.g. 301) and transitions to the `'home'` screen.
- On `HomeScreen`, compute `isGameCompleted = progress.currentLevelId > totalLevels`. Dynamically replace hardcoded 300 with `totalLevels`. If completed, clicking the main action button opens a `PostGameModal` allowing the player to replay the last level or reset all progress with a safety `ConfirmDialog`.
- When future levels are added (e.g. 400), `301 <= 400`, so players seamlessly resume on Level 301 with no migration required.

**Tech Stack:** Preact, TypeScript, Vitest, `@testing-library/preact`.

**Spec:** [`docs/superpowers/specs/2026-11-01-endgame-state-and-postgame-flow-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-01-endgame-state-and-postgame-flow-design.md)

## Global Constraints
- Total level count must be dynamic (`puzzles.length`), never hardcoded.
- Progress reset must require a 2-step destructive confirmation dialog using `ConfirmDialog`.
- Text copy must be in Spanish matching existing UI style.
- All existing tests must remain passing.

## Review Focus
1. Beating the final level (300) must not reload level 300 or keep the player in the game screen; it must return to `'home'`.
2. Victory modal on level 300 must say *"¡Juego completado!"* instead of *"¡Nivel 300 superado!"* and show *"Volver al Menú Principal"*.
3. Home screen button when completed must show *"¡Juego completado! • 300 / 300"* and open `PostGameModal` instead of instantly launching a level.
4. Clicking "Reiniciar progreso desde cero" in `PostGameModal` must show `ConfirmDialog` and only reset if confirmed.
5. If `progress.currentLevelId` is 301 and `totalLevels` is 400 (simulating new content added), the game must treat it as not completed and allow playing level 301 directly.

---

### Task 1: Final Level Victory Modal & Completion Transition

**Files:**
- Modify: `src/components/GameScreen.tsx:26-304`
- Modify: `src/App.tsx:144-165`
- Test: `tests/components/GameScreen.test.tsx`
- Test: `tests/App.test.tsx`

- [ ] **Step 1.1**: Write failing component test in `tests/components/GameScreen.test.tsx` verifying that when `totalLevels={300}` and `puzzle.id={300}`:
  - Victory modal renders title "¡Juego completado!".
  - Button text renders "Volver al Menú Principal" (or "Volver al Menú") instead of "Siguiente Nivel ▶".
- [ ] **Step 1.2**: Run test to verify it fails:
  `npx vitest run tests/components/GameScreen.test.tsx`
- [ ] **Step 1.3**: Update `GameScreenProps` in `src/components/GameScreen.tsx` to accept optional `totalLevels?: number`.
- [ ] **Step 1.4**: Update the victory modal in `src/components/GameScreen.tsx` to branch on `isLastLevel = totalLevels !== undefined && puzzle.id >= totalLevels`:
  - Show "¡Juego completado!" as header.
  - Show celebratory description including points.
  - Show "Volver al Menú Principal" button.
- [ ] **Step 1.5**: Update `handleAdvanceLevel` in `src/App.tsx`:
  - When `session.puzzle.id >= puzzles.length`:
    - Add level bonus and points to `newTotalScore`.
    - Update progress with `currentLevelId: session.puzzle.id + 1`, `totalScore: newTotalScore`, `activeSnapshot: null`.
    - Navigate back to `'home'` screen (`setActiveScreen('home')`).
  - Pass `totalLevels={puzzles.length}` to `GameScreen`.
- [ ] **Step 1.6**: Run tests to verify they pass:
  `npx vitest run tests/components/GameScreen.test.tsx tests/App.test.tsx`
- [ ] **Step 1.7**: Commit task 1 changes:
  `git commit -am "feat: implement final level victory modal and completion navigation"`

---

### Task 2: Post-Game Modal Component

**Files:**
- Create: `src/components/PostGameModal.tsx`
- Test: `tests/components/PostGameModal.test.tsx`

- [ ] **Step 2.1**: Write failing component tests in `tests/components/PostGameModal.test.tsx` covering:
  - Rendering modal when `isOpen=true` with title "¡Juego completado!" and total level info.
  - Clicking "Jugar último nivel" calls `onReplayLastLevel` and closes modal.
  - Clicking "Reiniciar progreso" opens the reset confirmation dialog.
  - Cancelling the confirmation dialog leaves progress intact.
  - Confirming the confirmation dialog calls `onResetProgress` and closes modal.
  - Clicking "Cerrar" or backdrop calls `onClose`.
- [ ] **Step 2.2**: Run test to verify it fails:
  `npx vitest run tests/components/PostGameModal.test.tsx`
- [ ] **Step 2.3**: Implement `src/components/PostGameModal.tsx`:
  - Uses `CatSvg` with `state="victory"`.
  - Reuses `ConfirmDialog` for the destructive reset confirmation step.
  - Follows established modal styles and animations (`modal-backdrop-anim`, `modal-card-flyin`).
- [ ] **Step 2.4**: Run tests to verify they pass:
  `npx vitest run tests/components/PostGameModal.test.tsx`
- [ ] **Step 2.5**: Commit task 2 changes:
  `git add src/components/PostGameModal.tsx tests/components/PostGameModal.test.tsx && git commit -m "feat: add PostGameModal component with replay and reset confirmation"`

---

### Task 3: Home Screen Post-Game Integration & Forward Compatibility

**Files:**
- Modify: `src/components/HomeScreen.tsx:1-80`
- Modify: `src/App.tsx:180-230`
- Test: `tests/components/HomeScreen.test.tsx`
- Test: `tests/App.test.tsx`

- [ ] **Step 3.1**: Write tests in `tests/components/HomeScreen.test.tsx`:
  - When `progress.currentLevelId <= totalLevels`: button displays "Nivel X / {totalLevels}".
  - When `progress.currentLevelId > totalLevels`:
    - Button displays "¡Juego completado! • {totalLevels} / {totalLevels}".
    - Clicking the button opens `PostGameModal`.
- [ ] **Step 3.2**: Write test in `tests/App.test.tsx`:
  - Full flow: completing final level returns to home screen in completed state.
  - Replaying last level from post-game modal loads the final level (300).
  - Forward compatibility: if `currentLevelId` is 301 and `puzzles.length` is increased to 350, home screen shows level 301 and play starts puzzle 301 directly.
- [ ] **Step 3.3**: Update `HomeScreen.tsx`:
  - Add `totalLevels?: number`, `onReplayLastLevel?: () => void`, `onResetProgress?: () => void` to `HomeScreenProps`.
  - Replace hardcoded `300` with `totalLevels ?? 300`.
  - Add state `showPostGameModal: boolean`.
  - When `progress.currentLevelId > totalLevels`, render completed text and open `PostGameModal` on click.
- [ ] **Step 3.4**: Update `App.tsx`:
  - Provide `totalLevels={puzzles.length}`, `onReplayLastLevel={handleReplayLastLevel}`, and `onResetProgress={handleResetProgress}` to `HomeScreen`.
  - Implement `handleReplayLastLevel`: creates session for `puzzles[puzzles.length - 1]`, updates session, transitions to `'game'`.
- [ ] **Step 3.5**: Run tests:
  `npx vitest run tests/components/HomeScreen.test.tsx tests/App.test.tsx`
- [ ] **Step 3.6**: Commit task 3 changes:
  `git commit -am "feat: integrate post-game options dialog on home screen"`

---

### Task 4: Full Verification and Cleanup

**Files:**
- All project files
- Tests

- [ ] **Step 4.1**: Run full test suite:
  `npm test`
- [ ] **Step 4.2**: Run production build:
  `npm run build`
- [ ] **Step 4.3**: Commit any remaining changes and verify clean git status:
  `git status`
