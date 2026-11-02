# Tutorial Rework (Rules & Controls First) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign KittySquared's interactive tutorial to teach core game rules, mistake penalties, and controls before deduction strategies, using the genuine game Board component and state mechanics.

**Architecture:** Refactor `src/data/tutorialSteps.ts` with valid mini `PuzzleDef` setups, initial boards, and goal predicates `isComplete(session)`. Update `src/components/TutorialModal.tsx` to embed `<Board />` and process moves via `applyCellTap` / `applyDragCross` with hearts status bar and multi-action validation. Add comprehensive integration tests in `tests/TutorialModal.test.tsx`.

**Tech Stack:** Preact, TypeScript, Vitest, Testing Library Preact.

**Spec:** `docs/superpowers/specs/2026-11-02-tutorial-rework-design.md`

## Global Constraints
- Tutorial steps must preserve authentic board controls: double-tap to place/toggle cats, single-tap to toggle crosses, tap-drag for continuous crosses.
- Incorrect cat placement must trigger mistake increments, display the red error cross, and lose one of three lives.
- Multi-cross steps must require marking all target cells with crosses before enabling "Siguiente ▶".
- Board must respect user `catVariant` and `regionAssist` options.
- Maintain existing visual styles and fly-in modal animations.

## Review Focus
1. Double-tap detection timeout: rapid taps on the same cell place a cat, while slow separate taps toggle crosses.
2. Accidental taps outside the target: clicking irrelevant cells or single-tapping in Step 1 must not crash or prematurely advance the tutorial.
3. Multi-cross steps: placing only a subset of required crosses leaves the "Siguiente ▶" button disabled.
4. Error cross locking: in Step 4, after the player double-clicks an invalid cell, the resulting red error cross is locked and cannot be tapped away.
5. Cross removal: in Step 5, single-tapping an existing non-error cross reverts it to 'empty'.

---

### Task 1: Update Tutorial Step Types and Define All 9 Tutorial Steps

**Files:**
- Modify: `src/data/tutorialSteps.ts`
- Test: `tests/TutorialModal.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export interface TutorialStep {
    id: string;
    part: 'basic' | 'advanced';
    title: string;
    explanation: string;
    size: number;
    puzzle: PuzzleDef;
    initialBoard: CellState[][];
    initialLockedCats?: boolean[][];
    initialErrorCrosses?: boolean[][];
    initialMistakes?: number;
    targetHighlightCells?: { row: number; col: number }[];
    hintText: string;
    isComplete: (session: LevelSessionState, initialSession: LevelSessionState) => boolean;
  }
  export const TUTORIAL_STEPS: TutorialStep[];
  ```

- [ ] **Step 1: Write the failing test for tutorial steps structure in `tests/TutorialModal.test.tsx`**
```typescript
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS } from '../src/data/tutorialSteps';

describe('TUTORIAL_STEPS configuration', () => {
  it('has 9 total steps partitioned into basic (rules) and advanced (strategies)', () => {
    expect(TUTORIAL_STEPS.length).toBe(9);
    const basicSteps = TUTORIAL_STEPS.filter((s) => s.part === 'basic');
    const advancedSteps = TUTORIAL_STEPS.filter((s) => s.part === 'advanced');
    expect(basicSteps.length).toBe(5);
    expect(advancedSteps.length).toBe(4);
  });

  it('step 1 (Regla fundamental) requires double-tap cat placement', () => {
    const s1 = TUTORIAL_STEPS[0];
    expect(s1.id).toBe('step-1');
    expect(s1.puzzle).toBeDefined();
    expect(s1.puzzle.size).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/TutorialModal.test.tsx`
Expected: FAIL because TUTORIAL_STEPS currently has 5 steps and lacks `puzzle`.

- [ ] **Step 3: Update `src/data/tutorialSteps.ts` with 9 well-defined steps**
Implement the 5 basic rules steps (1: Fundamental rule & Double tap, 2: Touching prohibition, 3: Multi-cross descartes, 4: Red cross & lives loss, 5: Removing crosses) and 4 strategy steps (6: 1-cell region, 7: Row containment, 8: Region pairs, 9: Suffocation lookahead). Each step carries a valid `PuzzleDef` with unambiguous solutions and an `isComplete` predicate.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/TutorialModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/data/tutorialSteps.ts tests/TutorialModal.test.tsx
git commit -m "feat(tutorial): define 9-step rules and strategies curriculum with mini-puzzle definitions"
```

---

### Task 2: Implement Real Board Integration in `TutorialModal`

**Files:**
- Modify: `src/components/TutorialModal.tsx`
- Test: `tests/TutorialModal.test.tsx`

**Interfaces:**
- Consumes:
  - `TutorialModalProps`: `{ catVariant: CatVariant; regionAssist?: RegionAssistMode; doubleTapTimeoutMs?: number; onClose: () => void; }`
  - `Board` component from `src/components/Board.tsx`
  - `applyCellTap`, `applyDragCross`, `createLevelSession` from `src/state/gameState.ts`
  - `TUTORIAL_STEPS` from `src/data/tutorialSteps.ts`
- Produces: Updated `TutorialModal` rendering `<Board />` with live session state, hearts bar, dynamic hint text, and completion checks.

- [ ] **Step 1: Write integration tests for interactive tutorial behaviors in `tests/TutorialModal.test.tsx`**
Cover:
1. Step 1: single click places a cross (does not complete step), double click places cat (completes step).
2. Step 2: non-touching cat placement completes step.
3. Step 3: placing crosses on all target row cells completes step; partial placement does not.
4. Step 4: double clicking invalid cell marks red error cross, drops 1 heart to 🤍 ❤️ ❤️, and completes step.
5. Step 5: single clicking existing cross clears it to empty and completes step.
6. Tab switching between "1. Reglas y Controles" and "2. Estrategias".

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test tests/TutorialModal.test.tsx`
Expected: FAIL due to lack of `<Board />` wiring and old modal structure.

- [ ] **Step 3: Refactor `src/components/TutorialModal.tsx`**
- Replace the custom grid with `<Board />`.
- Initialize `LevelSessionState` from `currentStep.puzzle`, setting initial board, lockedCats, errorCrosses, and mistakes.
- Handle `onCellTap` via `applyCellTap(session, r, c, options)` and `onDragCross` via `applyDragCross(session, r, c, target)`.
- If `currentStep.id === 'step-4'`, allow the mistake to transition `status: 'playing'` rather than ending the game, and mark step complete once `nextSession.mistakes > initialMistakes`.
- Render the hearts bar (`❤️ ❤️ ❤️` / `🤍 ❤️ ❤️`) in the tutorial card for basic steps or when mistakes > 0.
- Check `currentStep.isComplete(session, initialSessionRef.current)` on each update to toggle `isStepCompleted`.
- Highlight target cells if defined using subtle border styling or target indicator.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test tests/TutorialModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Run existing integration tests to ensure no regressions in App or Home**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**
```bash
git add src/components/TutorialModal.tsx tests/TutorialModal.test.tsx
git commit -m "feat(tutorial): wire real Board component, session handling, and hearts display in TutorialModal"
```

---

### Task 3: Verification and App Integration Polish

**Files:**
- Modify: `src/App.tsx` (ensure `doubleTapTimeoutMs` is passed to `TutorialModal`)
- Test: `tests/App.test.tsx`

- [ ] **Step 1: Write App test verifying TutorialModal receives doubleTapTimeoutMs and behaves correctly**
Verify tutorial opens from Home screen, navigates through steps, and closes cleanly.

- [ ] **Step 2: Run test and verify**
Run: `npm test tests/App.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full test suite and build check**
Run: `npm test` and `npm run build`
Expected: All tests PASS, build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**
```bash
git add src/App.tsx tests/App.test.tsx
git commit -m "chore(tutorial): verify tutorial integration and build integrity"
```
