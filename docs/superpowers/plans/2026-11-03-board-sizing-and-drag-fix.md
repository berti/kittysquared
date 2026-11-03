# Milestone 4: 10×10 Board Sizing & Drag-to-Cross Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement adaptive board sizing for 4×4–10×10 boards while preserving the tactile 3D raised Soft-Clay aesthetic, fix the drag-start origin cell bug across `Board.tsx`, `GameScreen.tsx`, and `TutorialModal.tsx`, and ensure reliable touch dragging via `document.elementFromPoint`.

**Architecture:**
- Adaptive board sizing: `Board.tsx` sets inline CSS variables (`--board-gap`, `--board-padding`, `--cell-radius`) and `data-board-size={size}` on `.board-grid`. `src/styles/theme.css` consumes these variables, updates `.board-grid` max-width to `410px`, adds top highlight to cells, and scales assist badges for sizes 9–10.
- Drag-start origin fix: `Board.tsx` records `dragOriginRef` on pointerdown. When the pointer crosses into a different cell (`handlePointerEnter` or `onPointerMove`), `onDragCross` is triggered for the origin cell first, then for the new cell, without firing a duplicate `click` on pointerup.
- Synchronous drag state: `GameScreen.tsx` and `TutorialModal.tsx` track `latestSessionRef` to ensure back-to-back `onDragCross` invocations in the same event loop tick update the board state atomically rather than referencing a stale closure.
- Mobile touch-drag: `.board-grid` handles `onPointerMove` / `onpointermove` with `document.elementFromPoint` lookup and has `touch-action: none`.

**Tech Stack:** Preact, TypeScript, CSS3, Vitest, `@testing-library/preact`.

---

### Task 1: Adaptive Board Sizing & 3D Soft-Clay Tile Polish

**Files:**
- Modify: `src/components/Board.tsx`
- Modify: `src/styles/theme.css`
- Modify: `tests/components/Board.test.tsx`
- Modify: `tests/styles/theme.test.ts`

- [ ] **Step 1: Write failing tests in `tests/components/Board.test.tsx` and `tests/styles/theme.test.ts`**
  - Verify that `Board` with `size={4}` renders `.board-grid` with `data-board-size="4"` and inline styles `--board-gap: 6px`, `--board-padding: 8px`, `--cell-radius: 10px`.
  - Verify that `Board` with `size={8}` renders `--board-gap: 4px`, `--board-padding: 7px`, `--cell-radius: 8px`.
  - Verify that `Board` with `size={10}` renders `--board-gap: 3px`, `--board-padding: 6px`, `--cell-radius: 6px`, and passes `size={10}` to `<RegionGlyphIcon />`.
  - Verify in `theme.test.ts` that `.board-grid` has `max-width: 410px` and `.board-cell` has top highlight in box-shadow.

- [ ] **Step 2: Run `npx vitest run tests/components/Board.test.tsx tests/styles/theme.test.ts` to verify failure**

- [ ] **Step 3: Implement adaptive sizing in `Board.tsx` and `theme.css`**
  - In `Board.tsx`, compute size-tier variables and pass them as inline styles to `.board-grid`, set `data-board-size={size}`, and pass `size={size >= 9 ? 10 : 12}` to `<RegionGlyphIcon />`.
  - In `theme.css`, update `.board-grid` (max-width 410px, variables), `.board-cell` (border-radius variable, top highlight `inset 0 1.5px 0 rgba(255, 255, 255, 0.35)`), and add rules for `[data-board-size="9"]` / `[data-board-size="10"]` badges.

- [ ] **Step 4: Run `npx vitest run tests/components/Board.test.tsx tests/styles/theme.test.ts` to verify pass**

---

### Task 2: Drag-Start Origin Cell & Touch-Drag in `Board.tsx`

**Files:**
- Modify: `src/components/Board.tsx`
- Modify: `tests/components/BoardAndCat.test.tsx`
- Modify: `tests/components/BoardTouch.test.tsx`

- [ ] **Step 1: Update/add failing tests in `tests/components/BoardAndCat.test.tsx` and `tests/components/BoardTouch.test.tsx`**
  - In `BoardAndCat.test.tsx`: test that pointerDown on `cell-0-0` followed by pointerEnter on `cell-0-1` calls `onDragCross(0, 0, 'cross')` AND `onDragCross(0, 1, 'cross')` in that order.
  - Test that clicking `cell-0-0` (pointerDown then pointerUp without crossing into another cell) does NOT call `onDragCross`, only `onCellTap`.
  - In `BoardTouch.test.tsx`: test that `pointerMove` over `.board-grid` using `document.elementFromPoint` triggers `onDragCross` on the origin cell and moved cell.

- [ ] **Step 2: Run `npx vitest run tests/components/BoardAndCat.test.tsx tests/components/BoardTouch.test.tsx` to verify failure**

- [ ] **Step 3: Implement drag origin tracking & pointer move in `Board.tsx`**
  - Add `data-cell-row={r}` and `data-cell-col={c}` to `.board-cell`.
  - Implement `applyDragToCell(r, c)` that applies `dragOriginRef` on the first cell change.
  - Implement `handleGridPointerMove` with `document.elementFromPoint` lookup on `.board-grid`.
  - Bind both camelCase and lowercase props on `.board-grid` and `.board-container`.

- [ ] **Step 4: Run `npx vitest run tests/components/BoardAndCat.test.tsx tests/components/BoardTouch.test.tsx` to verify pass**

---

### Task 3: Synchronous Session Updates in `GameScreen.tsx` & `TutorialModal.tsx`

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/components/TutorialModal.tsx`
- Modify: `tests/components/GameScreen.test.tsx`
- Modify: `tests/components/TutorialModal.test.tsx`

- [ ] **Step 1: Add failing test in `tests/components/GameScreen.test.tsx`**
  - Test that dragging from `(0, 0)` to `(0, 1)` results in `session.board[0][0] === 'cross'` and `session.board[0][1] === 'cross'`.

- [ ] **Step 2: Run `npx vitest run tests/components/GameScreen.test.tsx` to verify failure**

- [ ] **Step 3: Implement `latestSessionRef` in `GameScreen.tsx` and `TutorialModal.tsx`**
  - Store and maintain `latestSessionRef` across renders and handlers.
  - In `handleDragCross`, apply changes to `latestSessionRef.current`, update ref, and notify listeners. Avoid duplicate sound when target state already matches.

- [ ] **Step 4: Run `npx vitest run tests/components/GameScreen.test.tsx tests/components/TutorialModal.test.tsx` to verify pass**

---

### Task 4: Full Verification & Integration

**Files:**
- All modified files
- Full test suite

- [ ] **Step 1: Run `npx tsc --noEmit` and full Vitest suite**
  - Ensure all tests pass across `tests/components`, `tests/state`, `tests/audio`, `tests/styles`, and `tests/App.test.tsx`.
