# Milestone 2 Design Spec: "Game Juice", Heart/Score Animations & Delayed Victory Celebration

**Date:** 2026-11-02  
**Status:** Draft (Pending User Approval)  
**Parent Roadmap:** `docs/superpowers/specs/2026-11-02-aaa-mobile-roadmap.md` (Milestone 2 of 8)

---

## 1. Goal & Scope

Elevate the moment-to-moment tactile feedback ("Game Juice") and end-of-level celebration in **KittySquared** so every cat placement, mistake, and puzzle completion feels like a AAA mobile puzzle game:

1. **2-Phase Delayed Victory Celebration (`~1.4s` On-Board Wave + Tap-to-Skip):**
   - When the final cat is placed (`session.status === 'won'`), keep the completed board visible for `1400ms` before opening the Victory Modal.
   - During this `1400ms` window, cats on the board perform a staggered row-by-row victory jump wave (`180ms` stagger per row), their cells pulse with a warm golden glow, and **Option A (Per-Cat Staggered Confetti Pop)** bursts 6 pastel confetti pieces outward directly from each cat's cell in sync with its jump.
   - Tapping/clicking anywhere on the board celebration overlay skips the remaining delay and immediately reveals the Victory Modal.
2. **Redesigned 3-Star Victory Modal with 3rd-Star Confetti Burst:**
   - Displays a 3-star arch at the top (`1–3★` based on `getStarsForMistakes(session.mistakes)`).
   - Earned stars pop in sequentially (`100ms`, `280ms`, `460ms` delays); unearned stars fade in as muted clay outlines (`#E6DAC6` fill, `#C9B99F` stroke).
   - When `earnedStars === 3` (`0` mistakes), a 12-particle radial confetti burst fires at `520ms` from **behind** the 3rd star SVG (`z-index: 1` behind the star's `z-index: 3`, using `animation-fill-mode: forwards` and initial `opacity: 0` so no origin clump is ever visible before the burst). No modal confetti is rendered for `1★` or `2★`.
   - Below the title, displays a structured score summary card (`#F3E9D2` background, `#E2D6C1` border) with the Gold Kitty-Paw Coin SVG icon (`data-testid="score-paw-coin-icon"`).
   - Action row at the bottom provides both a secondary **`Niveles`** button (`onOpenLevels`) and the primary **`Siguiente Nivel ▶`** button (`onAdvanceLevel`, or **`Volver al Menú Principal`** on the final level `300`).
3. **HUD Status Bar "Game Juice" (Custom SVG Hearts & Score Pop):**
   - Replace the plain text emoji hearts (`❤️` / `🖤`) in `GameScreen.tsx` with a 3-heart SVG row (`data-testid="status-heart-0"`, `"status-heart-1"`, `"status-heart-2"`).
   - When `session.mistakes` increases (`1`, `2`, or `3`), the newly lost heart (`index === MAX_LIVES - session.mistakes`) plays a crack-and-shake animation (`heart-losing` class: left and right halves split along a central jagged seam while shaking, then settle into the muted clay empty state `#D8CBB8`).
   - When `session.partialScore` increases on a non-replay level (`!isReplay`), the score container pulses (`score-pill-pulse`) and a floating golden `+10` badge (`data-testid="score-float-pop"`) rises and fades above the score.
4. **Redesigned Defeat Modal ("¡3 fallos alcanzados!"):**
   - Matches the new Victory Modal visual language: a 3-broken-heart SVG arch at the top, a structured info card explaining that attempt points reset while total score is preserved, and a two-button action row with **`Niveles`** (`onOpenLevels`) and **`Reintentar Nivel ↺`** (`onRetryLevel`).

### Non-Goals (Deferred to Later Milestones)
- Replacing top-bar (`↺`, `⚙️`), tutorial, or settings modal emojis with custom SVGs (Milestone 3).
- 10×10 board gap tightening, region contiguity borders, and drag-start origin cell fix (Milestone 4).
- New cat art breeds and unlockable cats (Milestone 5).

---

## 2. Architecture & State Flow

### 2.1 Delayed Victory Phase in `GameScreen`

`GameScreen.tsx` manages a local presentation state for the 2-phase victory sequence:
- `isCelebratingVictory: boolean` (default `false`).
- When a player places the winning cat via `handleCellTap` (`next.status === 'won'`), `handleCellTap` sets `setIsCelebratingVictory(true)` and starts a `1400ms` timeout (`victoryTimerRef`) that calls `setIsCelebratingVictory(false)`.
- The Victory Modal is rendered whenever `session.status === 'won' && !isCelebratingVictory`.
  - This guarantees that real gameplay wins always play the `1400ms` on-board celebration first, while unit tests that pass `session.status === 'won'` directly via props render the Victory Modal immediately without needing fake timers.
- While `session.status === 'won' && isCelebratingVictory`, a full-board transparent click-catcher (`data-testid="victory-celebration-overlay"`) sits over the board so tapping anywhere immediately clears `victoryTimerRef` and calls `setIsCelebratingVictory(false)`, revealing the Victory Modal right away.
- Whenever `puzzle.id` or `session.startedAt` changes (or `session.status !== 'won'`), `isCelebratingVictory` resets to `false` and any pending `victoryTimerRef` is cleared.

### 2.2 Per-Cat Staggered Confetti on `Board`

When `isVictory === true` in `Board.tsx`:
- Each cell containing a cat (`board[r][c] === 'cat'`) computes a wave index `catWaveIndex` (`0, 1, 2, ...` in row-major order, which equals `r` since Queens puzzles have exactly 1 cat per row).
- The cat cell receives class `board-cell-victory-glow` with `style={{ '--cat-wave-delay': `${r * 180}ms` }}` and its `.board-cat-wrapper` receives `--cat-wave-delay: ${r * 180}ms`.
- Inside each cat cell when `isVictory === true`, `Board` renders a `.cat-confetti-burst` container (`data-testid={`cat-confetti-${r}-${c}`}`) with 6 `.cat-confetti-piece` spans using deterministic radial vectors (`--tx`, `--ty`, `--rot`, color) and `--delay: ${r * 180 + 20}ms`.
- All confetti animations use single-segment `transform` (`0% -> 100%`) paired with linear `opacity` (`0% -> 8% -> 72% -> 100%`) and `animation-fill-mode: forwards` so there is never an intermediate keyframe pause or visible origin clump prior to the cat's jump.

### 2.3 Custom SVG Hearts & Score Pop in `GameScreen`

In `GameScreen.tsx`:
- Track previous mistakes (`prevMistakesRef = useRef(session.mistakes)`) and previous partial score (`prevPartialScoreRef = useRef(session.partialScore)`), reset whenever `puzzle.id` or `session.startedAt` changes.
- **Heart Loss Tracking:**
  - `justLostHeartIndex: number | null` — set to `MAX_LIVES - session.mistakes` when `session.mistakes > prevMistakesRef.current`, cleared after `750ms` (or on session reset).
  - Render 3 SVG hearts (`index = 0, 1, 2`):
    - `isFull = index < MAX_LIVES - session.mistakes`
    - `isJustLost = index === justLostHeartIndex`
    - Full hearts render a solid red two-half heart (`#EF4444` fill, `#B91C1C` stroke).
    - Lost hearts render a split two-half heart (`#D8CBB8` fill, `#BDAE98` stroke); when `isJustLost` is true, class `heart-losing` animates the shake and split transition from `#EF4444` to `#D8CBB8`.
- **Score Pop Tracking:**
  - `scorePopKey: number` — incremented whenever `!isReplay && session.partialScore > prevPartialScoreRef.current`.
  - When `scorePopKey > 0`, the score wrapper applies class `score-pill-pulse` (keyed by `scorePopKey`) and renders `<span key={scorePopKey} data-testid="score-float-pop" className="score-float-pop">+10</span>`.

### 2.4 Redesigned Victory & Defeat Modals (`GameScreen.tsx` & `App.tsx`)

- Add `onOpenLevels?: () => void` prop to `GameScreenProps` in `GameScreen.tsx` and wire `onOpenLevels={handleOpenLevelsFromGame}` from `App.tsx`.
- **Committing Win Progress on Any Exit from a Won Level (`src/App.tsx`):**
  - Extract a helper in `src/App.tsx` (guarded by a `winCommittedForSessionRef = useRef<number | null>(null)` keyed by `session.startedAt`) that applies `computeLevelWinOutcome(...)` and persists the updated `progress` (`totalScore`, `currentLevelId`, `levelStars`) whenever `session.status === 'won'` and `winCommittedForSessionRef.current !== session.startedAt`.
  - Invoke this helper inside `handleAdvanceLevel`, `handleOpenLevelsFromGame`, and `handleBackToMenu` so that whether a player clicks **`Siguiente Nivel ▶`**, **`Niveles`**, or **`← Menú`** after winning a level, their earned stars, score gain, and frontier unlock are always saved exactly once.
- **Victory Modal (`session.status === 'won' && !isCelebratingVictory`):**
  - **Top 3-Star Arch (`data-testid="victory-stars-arch"`):**
    - Computes `earnedStars = getStarsForMistakes(session.mistakes)` (`1 | 2 | 3`).
    - Renders 3 stars (`data-testid="victory-star-1"`, `"victory-star-2"`, `"victory-star-3"`):
      - Star `i` (`1..3`) has `data-earned={i <= earnedStars ? 'true' : 'false'}`.
      - Earned stars use class `victory-star-earned-${i}` (`#FFB703` fill, `#D97706` stroke); unearned stars use `victory-star-empty-${i}` (`#E6DAC6` fill, `#C9B99F` stroke).
    - When `earnedStars === 3`, Star 3's wrapper includes `data-testid="victory-third-star-confetti"` containing 12 `.star3-confetti-piece` spans at `z-index: 1` behind the Star 3 SVG (`z-index: 3`), with `opacity: 0` and `animation-fill-mode: forwards` starting at `520ms`.
  - **Score Breakdown Card (`data-testid="victory-score-card"`):**
    - First-time clear (`!isReplay`):
      - Row 1: `Puntos gatos` / `+{session.partialScore}`
      - Row 2: `Bono ${earnedStars}★ (${session.mistakes === 0 ? '0 fallos' : session.mistakes === 1 ? '1 fallo' : '2 fallos'})` / `+{session.levelBonus}`
      - Divider + Total Row: `Nuevo total: {progress.totalScore + victoryScoreGain} pts` (or `Puntuación final: ...` on `isLastLevel`) with the Gold Kitty-Paw Coin SVG.
    - Replay clear (`isReplay`):
      - Row 1: `{victoryScoreGain > 0 ? `+${victoryScoreGain} pts (mejora de récord)` : '+0 pts (ya completado)'}`
      - Divider + Total Row: `Nuevo total: {progress.totalScore + victoryScoreGain} pts` with the Gold Kitty-Paw Coin SVG.
  - **Action Buttons:**
    - When `!isLastLevel`:
      - Secondary button (`data-testid="victory-levels-btn"`): `Niveles` (calls `onOpenLevels ?? onBackToMenu`).
      - Primary button (`data-testid="victory-next-btn"`): `Siguiente Nivel ▶` (calls `onAdvanceLevel`).
    - When `isLastLevel`:
      - Secondary button (`data-testid="victory-levels-btn"`): `Niveles` (calls `onOpenLevels ?? onBackToMenu`).
      - Primary button: `Volver al Menú Principal` (calls `onAdvanceLevel`).
- **Defeat Modal (`session.status === 'lost'`):**
  - **Top 3-Broken-Heart Arch (`data-testid="defeat-hearts-arch"`):** 3 split-heart SVGs in an arch matching the Victory Modal's proportions.
  - **Title:** `3 fallos alcanzados`
  - **Info Card:** `Se han perdido los puntos parciales de este intento. Puedes reintentar el nivel manteniendo tu puntuación anterior.`
  - **Action Buttons:**
    - Secondary button (`data-testid="defeat-levels-btn"`): `Niveles` (calls `onOpenLevels ?? onBackToMenu`).
    - Primary button (`data-testid="defeat-retry-btn"`): `Reintentar Nivel ↺` (calls `onRetryLevel`).

---

## 3. Reduced Motion Accessibility

Under `@media (prefers-reduced-motion: reduce)` in `src/styles/theme.css`:
- Disable confetti particle movement and star/heart bounce animations so users with motion sensitivity see clean instant state transitions.

---

## 4. Testing Strategy

1. **`tests/components/Board.test.tsx`:**
   - Verify that when `isVictory={true}`, each cat cell renders its staggered `.cat-confetti-burst` container (`data-testid="cat-confetti-r-c"`) and applies `.board-cell-victory-glow`.
2. **`tests/components/GameScreen.test.tsx`:**
   - Update existing status bar heart assertion (`'❤️ ❤️ ❤️'`) to check `data-testid="status-hearts-group"` and `status-heart-0`, `status-heart-1`, `status-heart-2`.
   - Verify custom SVG hearts (`status-heart-0`, `status-heart-1`, `status-heart-2`) render full (`data-state="full"`) vs empty (`data-state="empty"`) states and apply `heart-losing` when `mistakes` increments.
   - Verify floating `+10` score pop (`score-float-pop`) appears when `partialScore` increases on a non-replay level, and does not appear during a replay.
   - Verify the 2-phase victory transition: when `handleCellTap` completes a puzzle, the board celebration overlay (`victory-celebration-overlay`) is shown first (`victory-modal-backdrop` is absent), and either tapping `victory-celebration-overlay` or advancing timers by `1400ms` reveals the Victory Modal (`victory-modal-backdrop`).
   - Verify 1★, 2★, and 3★ Victory Modal states:
     - `0 mistakes` (`3★`): all 3 stars have `data-earned="true"` and `victory-third-star-confetti` is rendered.
     - `1 mistake` (`2★`): stars 1 & 2 have `data-earned="true"`, star 3 has `data-earned="false"`, and `victory-third-star-confetti` is NOT rendered.
     - `2 mistakes` (`1★`): star 1 has `data-earned="true"`, stars 2 & 3 have `data-earned="false"`, and `victory-third-star-confetti` is NOT rendered.
   - Verify clicking `Niveles` in the Victory or Defeat modal calls `onOpenLevels`.
3. **`tests/App.test.tsx`:**
   - Update the heart centering assertion (line 174) to query `getByTestId('status-hearts-group')`.
   - Update end-to-end level completion tests to click `victory-celebration-overlay` (tap-to-skip) so the Victory Modal opens after solving a board, and verify that clicking `Niveles` in the Victory Modal saves the level's stars/score/unlock and opens `LevelSelectScreen`.
