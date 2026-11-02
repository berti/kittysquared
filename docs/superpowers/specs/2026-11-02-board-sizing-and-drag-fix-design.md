# Milestone 4: 10×10 Board Sizing & Drag-to-Cross Fix — Design Spec

**Date:** 2026-11-02  
**Status:** Reviewed & Ready for Sign-Off  
**Roadmap Reference:** [`docs/superpowers/specs/2026-11-02-aaa-mobile-roadmap.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-02-aaa-mobile-roadmap.md) (Milestone 4)

---

## 1. Goal & Scope

1. **Preserve the Signature 3D Raised Soft-Clay Tile Aesthetic + Adaptive Board Scaling (Option A):**
   - Keep every board cell's individual rounded corners and 3D bottom bevel (`box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.14)`) sitting on the `--tray-beige` (`#EFE6D5`) tray without adding artificial region borders.
   - Dynamically scale `.board-grid`'s `gap`, `padding`, and cell `border-radius` based on `size` (`4×4` through `10×10`), and increase `.board-grid` `max-width` from `380px` to `410px` so `8×8`, `9×9`, and `10×10` boards give each cell ~25% more tap area on mobile screens.
2. **Fix the Drag-Start Origin Cell Bug (`Board.tsx`, `GameScreen.tsx`, `TutorialModal.tsx`):**
   - When a user presses down on cell `A` (`pointerdown`) and drags into cell `B` (`pointerenter` or `pointermove`), **both** cell `A` (the origin cell) and cell `B` must immediately receive `onDragCross(..., dragTargetState)` without triggering a duplicate `click` on release.
   - Maintain a synchronous `latestSessionRef` inside `GameScreen.tsx` and `TutorialModal.tsx` so back-to-back `onDragCross` calls within the same event tick (for the origin cell and the entered cell) accumulate both cell changes cleanly instead of reading a stale `session` closure.
3. **Mobile Touch-Drag Reliability (`onPointerMove` + `document.elementFromPoint`):**
   - Add `touch-action: none` to `.board-grid` and handle `onPointerMove` (and lowercase `onpointermove` for Preact/JSDOM compatibility) on `.board-grid` using `document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell-row][data-cell-col]')` so finger-dragging across cells on mobile touchscreens works reliably even when browsers do not synthesize `pointerenter` across sibling elements during a touch gesture.

---

## 2. Adaptive Board Sizing & 3D Soft-Clay Tile Polish

### 2.1 `.board-grid` & `.board-cell` Responsive Sizing by `size`
In `src/components/Board.tsx`:
- Add `data-board-size={size}` to `.board-grid` and set size-tier CSS variables directly in `.board-grid`'s inline `style` object:
  - **Small/Medium Boards (`size <= 6`):**
    - `'--board-gap': '6px'`
    - `'--board-padding': '8px'`
    - `'--cell-radius': '10px'`
  - **Large Boards (`size === 7 || size === 8`):**
    - `'--board-gap': '4px'`
    - `'--board-padding': '7px'`
    - `'--cell-radius': '8px'`
  - **Extra-Large Boards (`size >= 9`, i.e., `9×9` and `10×10`):**
    - `'--board-gap': '3px'`
    - `'--board-padding': '6px'`
    - `'--cell-radius': '6px'`
- In `src/components/Board.tsx`, pass `size={size >= 9 ? 10 : 12}` to `<RegionGlyphIcon regionId={regId} size={size >= 9 ? 10 : 12} />`.
- In `src/styles/theme.css`:
  - Update `.board-grid` to use `gap: var(--board-gap, 6px); padding: var(--board-padding, 8px); max-width: 410px; touch-action: none;`.
  - Update `.board-cell` to use `border-radius: var(--cell-radius, 10px); box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.14);`.
  - Update `.board-cell.has-conflict` to preserve the top highlight and bottom bevel alongside the conflict ring: `box-shadow: 0 0 0 3px var(--danger-red), inset 0 1.5px 0 rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.14);`.
  - Add explicit selectors `.board-grid[data-board-size="9"] .region-glyph-badge, .board-grid[data-board-size="10"] .region-glyph-badge { top: 1px; left: 1px; }` and `.board-grid[data-board-size="9"] .region-number-badge, .board-grid[data-board-size="10"] .region-number-badge { font-size: 9.5px; top: 1px; left: 2px; }` so corner assist markers never crowd cats or crosses on `9×9` and `10×10` cells.

---

## 3. Drag-Start Origin Cell & Touch-Drag Implementation

### 3.1 `src/components/Board.tsx`
- Add `data-cell-row={r}` and `data-cell-col={c}` attributes to each `.board-cell` element.
- Track drag state via refs:
  - `isDraggingRef = useRef(false)`
  - `hasDraggedRef = useRef(false)`
  - `dragTargetStateRef = useRef<'cross' | 'empty'>('cross')`
  - `dragOriginRef = useRef<{ row: number; col: number; applied: boolean } | null>(null)`
  - `lastDraggedCellRef = useRef<{ row: number; col: number } | null>(null)`
- **`handlePointerDown(row, col, e)`:**
  - Ignore non-primary mouse buttons (`if (e.button !== undefined && e.button !== 0) return;`).
  - Set `isDraggingRef.current = true`, `hasDraggedRef.current = false`.
  - Set `dragOriginRef.current = { row, col, applied: false }` and `lastDraggedCellRef.current = { row, col }`.
  - Set `dragTargetStateRef.current = board[row][col] === 'cross' ? 'empty' : 'cross'`.
  - Keep existing `releasePointerCapture(e.pointerId)` call for mobile touch compatibility.
- **Shared helper `applyDragToCell(row: number, col: number)`:**
  - If `!isDraggingRef.current`, return.
  - Check if `(row, col)` is the same as `lastDraggedCellRef.current`; if so, return (avoids redundant calls while moving inside the same cell).
  - If `dragOriginRef.current && !dragOriginRef.current.applied`:
    - If `row === dragOriginRef.current.row && col === dragOriginRef.current.col`, return (still inside origin cell; haven't crossed into a second cell yet).
    - Otherwise (pointer has entered a different cell!):
      - Mark `dragOriginRef.current.applied = true`.
      - Call `onDragCross(dragOriginRef.current.row, dragOriginRef.current.col, dragTargetStateRef.current)`.
  - Set `hasDraggedRef.current = true`.
  - Set `lastDraggedCellRef.current = { row, col }`.
  - Call `onDragCross(row, col, dragTargetStateRef.current)`.
- **`handlePointerEnter(row, col)`:**
  - Calls `applyDragToCell(row, col)`.
- **`handleGridPointerMove(e: PointerEvent)`:**
  - Bound to `.board-grid` via both `onPointerMove` and lowercase `onpointermove`.
  - If `!isDraggingRef.current`, return.
  - If `typeof document.elementFromPoint !== 'function'`, return.
  - Guard `e.clientX` / `e.clientY` (`if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;`).
  - Lookup `const el = document.elementFromPoint(e.clientX, e.clientY);`
  - Find `const cellEl = el?.closest?.('[data-cell-row][data-cell-col]') as HTMLElement | null;`
  - If `cellEl`, parse `r = Number(cellEl.getAttribute('data-cell-row'))` and `c = Number(cellEl.getAttribute('data-cell-col'))`, and if valid numbers, call `applyDragToCell(r, c)`.
- **`handlePointerUp()` (bound to `.board-container` via `onPointerUp`, `onPointerCancel`, `onpointerup`, `onpointercancel`, and window `pointerup`):**
  - Reset `isDraggingRef.current = false`, `dragOriginRef.current = null`, `lastDraggedCellRef.current = null`.

### 3.2 `src/components/GameScreen.tsx` & `src/components/TutorialModal.tsx`
- Maintain `const latestSessionRef = useRef(session); latestSessionRef.current = session;` in both `GameScreen` and `TutorialModal`.
- In `handleCellTap`, also update `latestSessionRef.current = next;`.
- In `handleDragCross(r, c, target)`:
  - Compute `const prevCell = latestSessionRef.current.board[r][c];`
  - Compute `const next = applyDragCross(latestSessionRef.current, r, c, target);`
  - Update `latestSessionRef.current = next;`
  - Call `onUpdateSession(next)` (or `setSession(next)` in `TutorialModal`).
  - Only call `soundEngine.playCross()` if `next.board[r][c] !== prevCell` so dragging over already-crossed or locked cells does not play duplicate sound effects.

---

## 4. Verification & Testing Plan

1. **`tests/components/BoardAndCat.test.tsx` & `tests/components/BoardTouch.test.tsx`:**
   - Verify that dragging from `cell-0-0` to `cell-0-1` (`pointerDown` on `cell-0-0`, `pointerEnter` on `cell-0-1`, `pointerUp`) invokes `onDragCross(0, 0, 'cross')` AND `onDragCross(0, 1, 'cross')` in order.
   - Verify that a simple click (`pointerDown` + `pointerUp` + `click` on `cell-0-0` without entering another cell) does NOT trigger `onDragCross`, and only triggers `onCellTap(0, 0, ...)`.
   - Verify that `pointerMove` over `.board-grid` using `document.elementFromPoint` resolves `[data-cell-row][data-cell-col]` and marks both the origin cell and moved-into cells.
2. **`tests/components/Board.test.tsx`:**
   - Verify adaptive sizing variables (`--board-gap`, `--board-padding`, `--cell-radius`) and `data-board-size` on `.board-grid` for `4×4`, `8×8`, and `10×10` boards.
3. **`tests/components/GameScreen.test.tsx`:**
   - Verify that dragging from `(0, 0)` to `(0, 1)` in `GameScreen` updates **both** `(0, 0)` and `(0, 1)` to `'cross'` in the resulting session state (`onUpdateSession`).
