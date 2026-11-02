# Milestone 2: "Game Juice", Heart/Score Animations & Delayed Victory Celebration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 2-phase delayed victory celebration (`1400ms` staggered cat jump wave + per-cat confetti burst + tap-to-skip), redesigned 3-Star Victory Modal (with 3rd-star confetti burst emerging from behind the 3rd star) and Defeat Modal, custom cracking SVG hearts, and `+10` score pop animation.

**Architecture:**
1. **`src/styles/theme.css` & `src/components/Board.tsx`:** Add CSS keyframes for the staggered cat wave, golden cell glow, single-curve confetti burst (`forwards` + separate transform/opacity curves), heart cracking, and score pop. When `isVictory={true}`, `Board.tsx` applies row-staggered `--cat-wave-delay` (`r * 180ms`) and renders 6 pastel confetti pieces inside each cat cell.
2. **`src/components/GameScreen.tsx`:** Replace emoji hearts with 3 SVG hearts (`status-heart-0..2`) that animate (`heart-losing`) when `session.mistakes` increments; render floating `+10` badge (`score-float-pop`) when `session.partialScore` increases on non-replays; start `isCelebratingVictory` (`1400ms` timer + `victory-celebration-overlay` tap-to-skip) when `handleCellTap` triggers a win; render the redesigned 3-Star Victory Modal (with `victory-third-star-confetti` behind star 3 only when `earnedStars === 3`) and Defeat Modal with `Niveles` buttons.
3. **`src/App.tsx`:** Extract `commitCurrentLevelWin` (guarded by `winCommittedForSessionRef` keyed by `session.startedAt`) and call it from `handleAdvanceLevel`, `handleOpenLevelsFromGame`, and `handleBackToMenu` so winning a level always persists earned stars, score, and next-level unlock regardless of which exit button is clicked.

**Tech Stack:** Preact, TypeScript, CSS Keyframes, Vitest, `@testing-library/preact`.

---

## File Structure

- **Modify:** `src/styles/theme.css`
  - Add `.board-cell-victory-glow`, `.cat-confetti-burst`, `.cat-confetti-piece`, `.victory-star-earned-1..3`, `.victory-star-empty-1..3`, `.star3-confetti-piece`, `.heart-losing`, `.score-pill-pulse`, `.score-float-pop`, and `@media (prefers-reduced-motion: reduce)` rules.
- **Modify:** `src/components/Board.tsx`
  - When `isVictory={true}` and `state === 'cat'`, add `.board-cell-victory-glow`, pass `--cat-wave-delay: ${r * 180}ms`, and render `data-testid={`cat-confetti-${r}-${c}`}` with 6 confetti particles.
- **Modify:** `src/components/GameScreen.tsx`
  - Add `onOpenLevels?: () => void` prop.
  - Render 3 SVG hearts (`status-hearts-group`, `status-heart-0..2`) with crack animation on mistake.
  - Render floating `+10` pop (`score-float-pop`) on non-replay partial score increase.
  - Manage `isCelebratingVictory` (`1400ms` timeout on `handleCellTap` win + `victory-celebration-overlay` tap-to-skip).
  - Render redesigned 3-Star Victory Modal (`victory-stars-arch`, `victory-star-1..3`, `victory-third-star-confetti` behind Star 3 on 3★, `victory-score-card`, `victory-levels-btn`, `victory-next-btn`) and Defeat Modal (`defeat-hearts-arch`, `defeat-levels-btn`, `defeat-retry-btn`).
- **Modify:** `src/App.tsx`
  - Add `commitCurrentLevelWin` helper guarded by `winCommittedForSessionRef` (`session.startedAt`) and wire `onOpenLevels={handleOpenLevelsFromGame}` into `GameScreen`.
- **Modify:** `tests/styles/theme.test.ts`
- **Modify:** `tests/components/Board.test.tsx`
- **Modify:** `tests/components/GameScreen.test.tsx`
- **Modify:** `tests/App.test.tsx`

---

### Task 1: CSS Keyframes & Per-Cat Staggered Victory Celebration (`src/styles/theme.css` & `src/components/Board.tsx`)

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/components/Board.tsx`
- Modify: `tests/styles/theme.test.ts`
- Modify: `tests/components/Board.test.tsx`

- [ ] **Step 1: Write failing tests in `tests/styles/theme.test.ts` and `tests/components/Board.test.tsx`**

Append to `tests/styles/theme.test.ts`:
```ts
describe('theme.css Milestone 2 game juice and victory celebration styles', () => {
  it('defines per-cat confetti, 3rd-star behind-star confetti with z-index: 1 and forwards fill, heart-losing, and score-float-pop classes', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.board-cell-victory-glow');
    expect(css).toContain('.cat-confetti-piece');
    expect(css).toContain('.star3-confetti-piece');
    expect(css).toMatch(/\.star3-confetti-piece\s*\{[^}]*z-index:\s*1/);
    expect(css).toMatch(/\.star3-confetti-piece\s*\{[^}]*opacity:\s*0/);
    expect(css).toContain('.heart-losing');
    expect(css).toContain('.score-float-pop');
  });
});
```

Append to `tests/components/Board.test.tsx`:
```tsx
  it('renders staggered victory glow and per-cat confetti burst on cat cells when isVictory is true', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('cross'));
    const locked = Array.from({ length: 4 }, () => Array(4).fill(false));
    board[0][1] = 'cat';
    board[2][3] = 'cat';

    const { getByTestId, queryByTestId } = render(
      <Board
        size={4}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={{ row: 2, col: 3 }}
        lastErrorCell={null}
        autoCrossCells={[]}
        isVictory={true}
        catVariant="orange"
        onCellTap={vi.fn()}
        onDragCross={vi.fn()}
      />
    );

    const catCell0 = getByTestId('cell-0-1');
    const catCell2 = getByTestId('cell-2-3');
    expect(catCell0.classList.contains('board-cell-victory-glow')).toBe(true);
    expect(catCell2.classList.contains('board-cell-victory-glow')).toBe(true);

    const confetti0 = getByTestId('cat-confetti-0-1');
    const confetti2 = getByTestId('cat-confetti-2-3');
    expect(confetti0.querySelectorAll('.cat-confetti-piece').length).toBe(6);
    expect(confetti2.querySelectorAll('.cat-confetti-piece').length).toBe(6);

    // Non-cat cells do not render cat confetti
    expect(queryByTestId('cat-confetti-0-0')).toBeNull();
  });
```

- [ ] **Step 2: Run Vitest to verify tests fail (RED)**

Run:
```bash
npx vitest run tests/styles/theme.test.ts tests/components/Board.test.tsx
```
Expected: FAIL (`expected ... to contain '.board-cell-victory-glow'`, `Unable to find an element by: [data-testid="cat-confetti-0-1"]`).

- [ ] **Step 3: Implement Milestone 2 CSS keyframes in `src/styles/theme.css` and per-cat victory celebration in `src/components/Board.tsx`**

In `src/styles/theme.css`, update `.cat-victory` to support `--cat-wave-delay` (`animation: catVictoryJump 1.15s ease-in-out infinite var(--cat-wave-delay, 0ms);`) and append the Milestone 2 animation classes at the bottom of `src/styles/theme.css`:
```css
/* Milestone 2: On-Board Victory Wave, 3-Star Modal Confetti & HUD Game Juice */
@keyframes boardCellVictoryGlow {
  0%, 100% {
    box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.12);
    filter: brightness(1);
  }
  30% {
    box-shadow: 0 0 0 3px #FFB703, 0 6px 14px rgba(255, 183, 3, 0.45);
    filter: brightness(1.08);
  }
}

.board-cell-victory-glow {
  animation: boardCellVictoryGlow 1.15s ease-in-out both var(--cat-wave-delay, 0ms);
}

@keyframes confettiSmoothTransform {
  0% {
    transform: translate(0, 0) scale(0.45) rotate(0deg);
  }
  100% {
    transform: translate(var(--tx, 0px), var(--ty, 40px)) scale(0.95) rotate(var(--rot, 240deg));
  }
}

@keyframes confettiSmoothOpacity {
  0% { opacity: 0; }
  8% { opacity: 1; }
  72% { opacity: 1; }
  100% { opacity: 0; }
}

.cat-confetti-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.cat-confetti-piece {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 5px;
  margin-left: -3.5px;
  margin-top: -2.5px;
  border-radius: 2px;
  pointer-events: none;
  opacity: 0;
  animation:
    confettiSmoothTransform 0.9s cubic-bezier(0.12, 0.88, 0.28, 1) forwards var(--delay, 0ms),
    confettiSmoothOpacity 0.9s linear forwards var(--delay, 0ms);
}

@keyframes starEarnedPop {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  65% {
    transform: scale(1.3) rotate(8deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(var(--final-rot, 0deg)) translateY(var(--final-y, 0px));
    opacity: 1;
  }
}

@keyframes starEmptyFade {
  0% {
    transform: scale(0.7) rotate(var(--final-rot, 0deg)) translateY(var(--final-y, 0px));
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(var(--final-rot, 0deg)) translateY(var(--final-y, 0px));
    opacity: 1;
  }
}

.victory-star-earned-1 {
  position: relative;
  z-index: 3;
  --final-rot: -12deg;
  --final-y: 0px;
  animation: starEarnedPop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.10s;
}
.victory-star-earned-2 {
  position: relative;
  z-index: 3;
  --final-rot: 0deg;
  --final-y: -6px;
  animation: starEarnedPop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.28s;
}
.victory-star-earned-3 {
  position: relative;
  z-index: 3;
  --final-rot: 12deg;
  --final-y: 0px;
  animation: starEarnedPop 0.50s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.46s;
}

.victory-star-empty-1 {
  position: relative;
  z-index: 3;
  --final-rot: -12deg;
  --final-y: 0px;
  animation: starEmptyFade 0.35s ease-out both 0.10s;
}
.victory-star-empty-2 {
  position: relative;
  z-index: 3;
  --final-rot: 0deg;
  --final-y: -6px;
  animation: starEmptyFade 0.35s ease-out both 0.28s;
}
.victory-star-empty-3 {
  position: relative;
  z-index: 3;
  --final-rot: 12deg;
  --final-y: 0px;
  animation: starEmptyFade 0.35s ease-out both 0.46s;
}

@keyframes radialBehindStarTransform {
  0% {
    transform: translate(calc(var(--tx, 0px) * 0.14), calc(var(--ty, 0px) * 0.14)) scale(0.4) rotate(0deg);
  }
  100% {
    transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(0.95) rotate(var(--rot, 260deg));
  }
}

.star3-confetti-piece {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 6px;
  margin-left: -4px;
  margin-top: -3px;
  border-radius: 2px;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  animation:
    radialBehindStarTransform 0.95s cubic-bezier(0.1, 0.9, 0.22, 1) forwards 0.52s,
    confettiSmoothOpacity 0.95s linear forwards 0.52s;
}

@keyframes heartBreakShake {
  0% { transform: scale(1) rotate(0deg); }
  18% { transform: scale(1.32) rotate(-12deg); }
  36% { transform: scale(1.25) rotate(12deg); }
  55% { transform: scale(1.1) rotate(-8deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes heartLeftHalfBreak {
  0%, 25% { transform: translate(0, 0) rotate(0deg); fill: #EF4444; }
  60% { transform: translate(-2.5px, 1px) rotate(-14deg); fill: #EF4444; }
  100% { transform: translate(0, 0) rotate(0deg); fill: #D8CBB8; }
}

@keyframes heartRightHalfBreak {
  0%, 25% { transform: translate(0, 0) rotate(0deg); fill: #EF4444; }
  60% { transform: translate(2.5px, 1.5px) rotate(14deg); fill: #EF4444; }
  100% { transform: translate(0, 0) rotate(0deg); fill: #D8CBB8; }
}

.heart-losing {
  animation: heartBreakShake 0.65s ease-out both;
}
.heart-losing .heart-half-left {
  transform-origin: 12px 18px;
  animation: heartLeftHalfBreak 0.75s ease-out forwards;
}
.heart-losing .heart-half-right {
  transform-origin: 12px 18px;
  animation: heartRightHalfBreak 0.75s ease-out forwards;
}

@keyframes scorePillPulse {
  0%, 100% { transform: scale(1); }
  35% { transform: scale(1.16); }
}

@keyframes floatPlusTen {
  0% { transform: translateY(6px) scale(0.6); opacity: 0; }
  22% { transform: translateY(-4px) scale(1.1); opacity: 1; }
  75% { transform: translateY(-14px) scale(1); opacity: 1; }
  100% { transform: translateY(-20px) scale(0.9); opacity: 0; }
}

.score-pill-pulse {
  animation: scorePillPulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.score-float-pop {
  position: absolute;
  right: 12px;
  top: -8px;
  background: #FFB703;
  color: #3D3135;
  font-size: 12px;
  font-weight: 900;
  padding: 2px 7px;
  border-radius: 99px;
  box-shadow: 0 2px 6px rgba(180, 83, 9, 0.25);
  pointer-events: none;
  opacity: 0;
  animation: floatPlusTen 0.85s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .board-cell-victory-glow,
  .cat-confetti-piece,
  .star3-confetti-piece,
  .victory-star-earned-1,
  .victory-star-earned-2,
  .victory-star-earned-3,
  .heart-losing,
  .score-pill-pulse,
  .score-float-pop {
    animation: none !important;
  }
}
```

In `src/components/Board.tsx`, define the 6 per-cat confetti vectors at the top of the file:
```tsx
const CAT_CONFETTI_VECTORS = [
  { tx: '-34px', ty: '-30px', rot: '-230deg', color: '#FF8FA3', round: false },
  { tx: '36px', ty: '-28px', rot: '240deg', color: '#FFB703', round: true },
  { tx: '-30px', ty: '32px', rot: '-190deg', color: '#2EC4B6', round: false },
  { tx: '34px', ty: '30px', rot: '250deg', color: '#C77DFF', round: false },
  { tx: '2px', ty: '-40px', rot: '185deg', color: '#80ED99', round: true },
  { tx: '-38px', ty: '-2px', rot: '-220deg', color: '#F3722C', round: false },
];
```
And inside `Board.tsx`'s cell render loop, when `isVictory && state === 'cat'`:
- Add `'board-cell-victory-glow'` to the cell's `className`.
- Include `'--cat-wave-delay': `${r * 180}ms`` in the cell's `style` object.
- Render `<div data-testid={`cat-confetti-${r}-${c}`} className="cat-confetti-burst">` with the 6 `.cat-confetti-piece` spans (`--tx`, `--ty`, `--rot`, `--delay: ${r * 180 + 20}ms`, `background: vec.color`, `borderRadius: vec.round ? '50%' : '2px'`).

- [ ] **Step 4: Run Vitest to verify tests pass (GREEN)**

Run:
```bash
npx vitest run tests/styles/theme.test.ts tests/components/Board.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/styles/theme.css src/components/Board.tsx tests/styles/theme.test.ts tests/components/Board.test.tsx
git commit -m "feat(board): add staggered cat victory wave and per-cat confetti burst"
```

---

### Task 2: Custom SVG Hearts, Score Pop, 2-Phase Victory Delay & Redesigned Victory/Defeat Modals (`src/components/GameScreen.tsx`)

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `tests/components/GameScreen.test.tsx`

- [ ] **Step 1: Update & write failing tests in `tests/components/GameScreen.test.tsx`**

Update `tests/components/GameScreen.test.tsx` to:
1. Update the status bar test (line 77) to verify `getByTestId('status-hearts-group')` and `status-heart-0`, `status-heart-1`, `status-heart-2` (`data-state="full"`).
2. Add tests for:
   - Custom SVG heart cracking (`heart-losing` class and `data-state="empty"`) when `session.mistakes` increments, and floating `+10` score pop (`score-float-pop`) when `session.partialScore` increases on a non-replay level.
   - 2-phase delayed victory celebration: when double-tapping the winning cell on a board, `victory-celebration-overlay` appears first while `victory-modal-backdrop` is absent; clicking `victory-celebration-overlay` immediately reveals `victory-modal-backdrop`.
   - 1★ (`2 mistakes`), 2★ (`1 mistake`), and 3★ (`0 mistakes`) Victory Modal rendering:
     - `3★`: `victory-star-1..3` all have `data-earned="true"` and `victory-third-star-confetti` is present.
     - `2★`: `victory-star-1` & `2` have `data-earned="true"`, `victory-star-3` has `data-earned="false"`, and `victory-third-star-confetti` is null.
     - `1★`: `victory-star-1` has `data-earned="true"`, `victory-star-2` & `3` have `data-earned="false"`, and `victory-third-star-confetti` is null.
   - Clicking `victory-levels-btn` in Victory Modal and `defeat-levels-btn` in Defeat Modal invokes `onOpenLevels`.

- [ ] **Step 2: Run Vitest to verify tests fail (RED)**

Run:
```bash
npx vitest run tests/components/GameScreen.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Implement HUD SVG Hearts, Score Pop, 2-Phase Victory Delay & Redesigned Modals in `src/components/GameScreen.tsx`**

Update `src/components/GameScreen.tsx` to:
- Accept `onOpenLevels?: () => void` in `GameScreenProps`.
- Track `prevMistakesRef`, `prevPartialScoreRef`, `justLostHeartIndex`, `scorePopKey`, and `isCelebratingVictory` (`victoryTimerRef` for `1400ms`).
- When `handleCellTap` produces `next.status === 'won'`, set `setIsCelebratingVictory(true)` and start a `1400ms` timeout to set `setIsCelebratingVictory(false)`.
- Render `data-testid="victory-celebration-overlay"` when `session.status === 'won' && isCelebratingVictory` so clicking/tapping anywhere clears the timeout and immediately opens the Victory Modal.
- Render `data-testid="status-hearts-group"` with 3 SVG hearts (`data-testid={`status-heart-${idx}`}`, `data-state={isFull ? 'full' : 'empty'}`).
- Render `data-testid="score-float-pop"` when `scorePopKey > 0` on non-replays.
- Render the redesigned 3-Star Victory Modal (`session.status === 'won' && !isCelebratingVictory`) with `victory-stars-arch`, `victory-star-1..3`, `victory-third-star-confetti` (only when `earnedStars === 3`, placed at `z-index: 1` behind Star 3), `victory-score-card`, `victory-levels-btn`, and `victory-next-btn`.
- Render the redesigned Defeat Modal (`session.status === 'lost'`) with `defeat-hearts-arch`, `defeat-levels-btn`, and `defeat-retry-btn`.

- [ ] **Step 4: Run Vitest to verify tests pass (GREEN)**

Run:
```bash
npx vitest run tests/components/GameScreen.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/GameScreen.tsx tests/components/GameScreen.test.tsx
git commit -m "feat(ui): add SVG heart crack, +10 score pop, 2-phase victory delay, and 3-star modals"
```

---

### Task 3: Win-Commit Guard & Modal Navigation Integration (`src/App.tsx` & `tests/App.test.tsx`)

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/App.test.tsx`

- [ ] **Step 1: Update & write failing tests in `tests/App.test.tsx`**

In `tests/App.test.tsx`:
1. Update line 174 (`getByText('❤️ ❤️ ❤️')`) to `getByTestId('status-hearts-group')`.
2. In the two end-to-end puzzle-solving tests (`completing the final level...` and `Review Focus #4 & #5...`), click `getByTestId('victory-celebration-overlay')` after placing the final cat to skip the 1.4s on-board celebration and open the Victory Modal.
3. Add a new test verifying that after solving Level 1, clicking `victory-levels-btn` (`Niveles`) inside the Victory Modal commits the win (`currentLevelId: 2`, `levelStars: { 1: 3 }`, `totalScore: 100`) and navigates directly to `LevelSelectScreen`.

- [ ] **Step 2: Run Vitest to verify the new test fails (RED)**

Run:
```bash
npx vitest run tests/App.test.tsx
```
Expected: FAIL (`Unable to find an element by: [data-testid="victory-levels-btn"]` or `Niveles` does not commit win progress).

- [ ] **Step 3: Implement `commitCurrentLevelWin` and wire `onOpenLevels` in `src/App.tsx`**

In `src/App.tsx`:
- Add `winCommittedForSessionRef = useRef<number | null>(null)` to track whether the current won session (`session.startedAt`) has already committed its win outcome.
- Extract `getStateWithCommittedWin(baseState: AppState): AppState`:
  - If `session.status !== 'won'` or `winCommittedForSessionRef.current === session.startedAt`, return `baseState`.
  - Mark `winCommittedForSessionRef.current = session.startedAt`.
  - Compute `computeLevelWinOutcome(activePuzzle.id, session.mistakes, session.partialScore, baseState.progress)` and return the updated `AppState`.
- Use `getStateWithCommittedWin(appState)` inside `handleAdvanceLevel`, `handleOpenLevelsFromGame`, and `handleBackToMenu`.
- Pass `onOpenLevels={handleOpenLevelsFromGame}` to `<GameScreen />`.

- [ ] **Step 4: Run full verification suite (GREEN)**

Run:
```bash
npx tsc --noEmit && npx vitest run tests/components tests/state tests/audio tests/styles tests/App.test.tsx
```
Expected: `0` TypeScript errors and all test suites PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/App.tsx tests/App.test.tsx
git commit -m "feat(app): commit level win outcome when navigating to Niveles or Menu from victory"
```
