# Milestone 1: Level Selector, Star Rating Progression & Gold Paw-Coin Score Icon — Design Spec

Date: 2026-11-02

## 1. Intent & Why
Players currently progress strictly linearly through `currentLevelId` (`1..300`) and can only replay Level 300 after completing the entire game. There is no way to browse levels, see board-size tiers, or replay earlier levels to improve a 1-heart clear into a 0-mistake ("Purr-fect") 3-star clear. Additionally, the status bar uses a `⭐` emoji for Score, which collides with using Stars (`1–3★`) as the universal mobile puzzle level rating symbol.

This project adds:
1. Per-level star ratings (`1–3★` based on mistakes) persisted in [`storage.ts`](../../../src/state/storage.ts), with anti-farming replay score logic.
2. A full-screen **Level Selector (`LevelSelectScreen.tsx`)** organized by board-size tier tabs (`5×5`, `6×6`, `7×7`, `8×8`, `9×9`, `10×10`).
3. An updated [`HomeScreen.tsx`](../../../src/components/HomeScreen.tsx) layout featuring a dedicated **Niveles** button (`★ X / 900`) and side-by-side **Tutorial** / **Ajustes** buttons.
4. A custom **Gold Kitty-Paw Coin SVG** replacing the `⭐` score emoji in [`GameScreen.tsx`](../../../src/components/GameScreen.tsx).

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Track and persist the best star rating (`1 | 2 | 3`) achieved on every completed level (`1..300`).
- Migrate existing saved progress cleanly so already-completed levels (`1 .. currentLevelId - 1`) are marked as completed (`1★` default if not yet recorded).
- Prevent infinite score farming when replaying completed levels: first-time clears award full points (`partialScore + levelBonus`), whereas replaying a completed level only awards the positive difference in `levelBonus` if the player improves their previous star rating on that level.
- Preserve the player's frontier `activeSnapshot` (`levelId === currentLevelId`) when they hop into an earlier level for a replay.
- Advance seamlessly from level `N` to `N + 1` when clicking "Siguiente Nivel ▶" after replaying level `N`, so players can replay a sequence of old levels without friction.
- Replace the `⭐` emoji in the [`GameScreen.tsx`](../../../src/components/GameScreen.tsx) status bar with the custom **Gold Kitty-Paw Coin SVG** (`B3`).

### Non-Goals
- Redesigning the Victory/Defeat modal layout or adding the delayed board confetti celebration (scheduled for **Milestone 2**).
- Replacing other emojis across Settings/Tutorial/Hearts (scheduled for **Milestones 2 & 3**).

### Anti-Goals
- Never allow replaying an earlier level to overwrite or lower `currentLevelId` (the player's highest unlocked frontier level) or decrease `levelStars[id]` or `totalScore`.
- Never allow replaying an earlier level to wipe out an in-progress `activeSnapshot` on the frontier level (`currentLevelId`).

---

## 3. Constraints
- Preact functional components with inline/CSS-class Soft Clay styling matching [`theme.css`](../../../src/styles/theme.css).
- Must maintain compatibility with existing `localStorage` key `kittysquared_state_v1` in [`storage.ts`](../../../src/state/storage.ts).
- All screen navigations (`home` ↔ `levels`, `levels` ↔ `game`, `home` ↔ `game`) must use `navigateWithTransition` in [`App.tsx`](../../../src/App.tsx).

---

## 4. Approaches Considered

### Approach 1 (Selected): Full-Screen `LevelSelectScreen` + Protected Frontier Snapshot
- Add `'levels'` to `activeScreen` (`'home' | 'levels' | 'game'`) in [`App.tsx`](../../../src/App.tsx).
- Add `levelStars: Record<number, 1 | 2 | 3>` to [`ModeProgress`](../../../src/state/storage.ts).
- Keep `currentLevelId` strictly as the player's frontier (`1..301`) and only save `activeSnapshot` when `session.puzzle.id === progress.currentLevelId`.
- **Why selected:** Gives full mobile viewport height to the 5-column level grid (especially important for the 200 levels in the `10×10` tab) and guarantees a player never loses mid-board progress on their frontier level when replaying an earlier level.

### Approach 2 (Rejected): Fly-in Modal Level Selector + Shared Single Snapshot
- Render Level Select inside a modal card over [`HomeScreen.tsx`](../../../src/components/HomeScreen.tsx) and overwrite `activeSnapshot` on any level played.
- **Why rejected:** Cramped vertical space on compact mobile screens and destructive to in-progress frontier boards when replaying old levels.

---

## 5. Detailed Specification

### 5.1 Star & Score Math (`src/state/gameState.ts` & `src/state/storage.ts`)
- **Star mapping by mistakes on level win:**
  - `0 mistakes` → `3` stars (`levelBonus = 50`)
  - `1 mistake` → `2` stars (`levelBonus = 30`)
  - `2 mistakes` → `1` star (`levelBonus = 10`)
  - Export helper functions in [`gameState.ts`](../../../src/state/gameState.ts):
    - `getStarsForMistakes(mistakes: number): 1 | 2 | 3` (`mistakes <= 0 ? 3 : mistakes === 1 ? 2 : 1`)
    - `getBonusForStars(stars: 1 | 2 | 3): number` (`stars === 3 ? 50 : stars === 2 ? 30 : 10`)
- **`ModeProgress` in [`storage.ts`](../../../src/state/storage.ts):**
  ```ts
  export type StarRating = 1 | 2 | 3;

  export interface ModeProgress {
    currentLevelId: number;
    totalScore: number;
    activeSnapshot: SavedBoardSnapshot | null;
    levelStars?: Record<number, StarRating>;
  }
  ```
  *(Note: making `levelStars?: Record<number, StarRating>` optional on the TypeScript interface or defaulting to `{}` ensures existing unit tests that construct a `ModeProgress` literal without `levelStars` continue to typecheck while runtime state from `getDefaultAppState()` and `loadPersistedState()` always populates `levelStars: Record<number, StarRating>`).*
- **Migration in `loadPersistedState()`:**
  - Sanitize `rawProgress.levelStars`: keep keys `1..300` whose values are `1`, `2`, or `3`.
  - For every level `id` from `1` to `Math.min(300, currentLevelId - 1)`, if `levelStars[id]` is undefined, set `levelStars[id] = 1`.
- **Reset in `resetProgress()`:**
  - Resets `currentLevelId: 1`, `totalScore: 0`, `activeSnapshot: null`, `levelStars: {}`.

### 5.2 Replay vs. Frontier Progression & Score Award (`src/App.tsx` & `src/components/GameScreen.tsx`)
- **Determining if a session is a Replay vs. Frontier:**
  - A level `L = session.puzzle.id` is a **completed replay** if `L < progress.currentLevelId` or `progress.levelStars?.[L] !== undefined`.
  - Otherwise (`L === progress.currentLevelId` and not yet in `levelStars`), it is the **frontier level**.
- **Score Gain Calculation (`computeWinScoreGain`):**
  - On a **frontier level**:
    - While playing: status bar shows `(+${session.partialScore})` when `session.partialScore > 0`.
    - When won (`session.status === 'won'`): total gain is `session.partialScore + session.levelBonus` (status bar shows `(+${session.partialScore + session.levelBonus})`, and Victory modal shows cat points, mistake bonus, and new total).
  - On a **completed replay** (`prevStars = progress.levelStars?.[L] ?? 1`):
    - While playing (`session.status === 'playing'`): cat placements do not grant duplicate points, so no `(+...)` badge is shown in the status bar.
    - When won (`session.status === 'won'`): `earnedStars = getStarsForMistakes(session.mistakes)`. The bonus improvement is `scoreGain = Math.max(0, getBonusForStars(earnedStars) - getBonusForStars(prevStars))`.
    - Status bar shows `(+${scoreGain})` if `scoreGain > 0`.
    - Victory modal shows the earned stars (`earnedStars`) and the score summary (`scoreGain > 0 ? "+X pts (mejora de récord)" : "+0 pts (ya completado)"`, plus `Nuevo total: ${progress.totalScore + scoreGain} pts`).
- **When `handleAdvanceLevel` runs in `App.tsx`:**
  - `L = session.puzzle.id`
  - If `session.status === 'won'`:
    - `earnedStars = getStarsForMistakes(session.mistakes)`
    - `prevStars = appState.progress.levelStars?.[L]`
    - `isReplay = L < appState.progress.currentLevelId || prevStars !== undefined`
    - `scoreGain = isReplay ? Math.max(0, getBonusForStars(earnedStars) - getBonusForStars(prevStars ?? 1)) : (session.partialScore + session.levelBonus)`
    - `bestStars = prevStars ? (Math.max(prevStars, earnedStars) as StarRating) : earnedStars`
    - `nextLevelStars = { ...(appState.progress.levelStars || {}), [L]: bestStars }`
    - `nextCurrentLevelId = isReplay ? appState.progress.currentLevelId : L + 1`
    - `nextActiveSnapshot = isReplay ? appState.progress.activeSnapshot : null`
    - `newTotalScore = appState.progress.totalScore + scoreGain`
  - If `L >= puzzles.length` (Level 300 completed):
    - Save updated progress and navigate back to `'home'`.
  - If `L < puzzles.length`:
    - Save updated progress.
    - Advance the active game session to `nextLvlId = L + 1`:
      - If `nextLvlId === nextCurrentLevelId` and `nextActiveSnapshot?.levelId === nextLvlId`, restore `nextActiveSnapshot` into `createLevelSession(puzzleForNext)`.
      - Otherwise, start a fresh `createLevelSession(puzzleForNext)`.
- **Saving `activeSnapshot` during play (`handleUpdateSession` in `App.tsx`):**
  - Only update `progress.activeSnapshot` when `nextSession.puzzle.id === appState.progress.currentLevelId`. When replaying an earlier level (`nextSession.puzzle.id < appState.progress.currentLevelId`), keep `appState.progress.activeSnapshot` unchanged.

### 5.3 `LevelSelectScreen.tsx` Component (`src/components/LevelSelectScreen.tsx`)
- **Tiers (6 Board-Size Tabs):**
  1. `5×5`: Levels `1–15` (max 45★)
  2. `6×6`: Levels `16–40` (max 75★)
  3. `7×7`: Levels `41–65` (max 75★)
  4. `8×8`: Levels `66–85` (max 60★)
  5. `9×9`: Levels `86–100` (max 45★)
  6. `10×10`: Levels `101–300` (max 600★)
- **Initial Active Tab:**
  - Defaults to the tier containing `initialLevelId` (which is `Math.min(progress.currentLevelId, totalLevels)` when opened from Home).
- **Top Bar:**
  - `← Menú` button (`data-testid="level-select-back-btn"`) → triggers `onBack()` (backward transition to `'home'`).
  - Title: `Niveles`.
  - Total Stars Pill (`data-testid="level-select-total-stars"`): Custom SVG filled star + `${totalEarnedStars} / ${totalLevels * 3}` (e.g., `48 / 900`).
- **Segmented Tier Tab Bar:**
  - 6 buttons (`data-testid="tier-tab-5"`, `tier-tab-6`, `tier-tab-7`, `tier-tab-8`, `tier-tab-9`, `tier-tab-10`) displaying `5×5` .. `10×10`.
- **Tier Summary Banner:**
  - Left: `Tableros ${size}×${size} (Niv. ${startId}–${endId})`
  - Right: SVG star + `${tierEarnedStars} / ${tierMaxStars}`
- **5-Column Level Grid:**
  - Scrollable container (`overflowY: 'auto'`) so the `10×10` tab scrolls smoothly within the screen viewport.
  - Each level tile (`data-testid="level-tile-${id}"`) is a `<button>`:
    - **Completed (`id < progress.currentLevelId` or `levelStars[id]` defined):**
      - White background (`#FFFFFF`), clay border (`#E2D6C1`), clickable.
      - Displays level number + 3 mini SVG stars (`1..3` filled gold `#FFB703` with `#D97706` stroke, remaining empty `#E2D6C1` with `#C9B99F` stroke).
    - **Current Frontier (`id === progress.currentLevelId` and not completed):**
      - Orange highlight background (`#FF9770`), border `#E07A5F`, white text, clickable.
      - Displays level number + `JUGAR` label beneath.
    - **Locked (`id > progress.currentLevelId`):**
      - Muted beige background (`#EFE6D5`), `disabled={true}`, cursor `not-allowed`.
      - Displays level number + custom SVG lock icon.

### 5.4 `HomeScreen.tsx` Updates
- Below `Jugar` (`data-testid="start-game-btn"`), add the **Niveles** button (`data-testid="open-levels-btn"`):
  - Full width, `#F3E9D2` background, `2px solid #E2D6C1` border, `0 3px 0 #E2D6C1` shadow.
  - Left text: `Niveles`.
  - Right badge: Custom SVG gold star + `${totalEarnedStars} / ${levelsCount * 3}`.
- Place `Tutorial` (`data-testid="open-tutorial-btn"`) and `Ajustes` (`data-testid="open-settings-btn"`) side-by-side in a 2-column row (`display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'`).
- Also add an option in `PostGameModal` (or keep `PostGameModal` working seamlessly alongside the `Niveles` button on HomeScreen).

### 5.5 Gold Kitty-Paw Coin SVG Score Icon (`src/components/GameScreen.tsx`)
- Replace `<span style={{ fontSize: '19px', lineHeight: 1 }}>⭐</span>` in `GameScreen.tsx` status bar with the **Gold Kitty-Paw Coin SVG (B3)** (`data-testid="score-paw-coin-icon"`, `20×20` `viewBox="0 0 24 24"`):
  - Gold coin circle (`cx="12" cy="12" r="10" fill="#FFB703" stroke="#B45309" strokeWidth="2"`).
  - Central paw pad (`path` in `#B45309`) + 4 angled toe ellipses in `#B45309`.

---

## 6. Builder's Calls (Minor Decisions Settled)
- **Backfill rating for pre-existing saves:** Completed levels from older saves (where `levelStars` didn't exist yet) backfill to `1★` (`levelStars[id] = 1`). This guarantees unlocked levels look completed with a star while allowing returning players to replay them for `2★`/`3★` and earn the remaining bonus points (`+20` / `+40`).
- **Auto-scroll in `10×10` tab:** When `LevelSelectScreen` mounts on the `10×10` tab, if the active frontier tile is inside that tab, call `scrollIntoView({ block: 'center' })` (guarded with `typeof el.scrollIntoView === 'function'` for jsdom test compatibility).
