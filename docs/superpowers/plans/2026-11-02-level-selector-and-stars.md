# Level Selector, Star Rating Progression & Gold Paw-Coin Score Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-level 1–3★ star ratings with anti-farming replay scoring, a tier-tabbed full-screen Level Selector (`5×5` to `10×10`), an updated Home Screen with a `Niveles` button, and a custom Gold Kitty-Paw Coin SVG score icon in `GameScreen`.

**Architecture:** `ModeProgress` in `src/state/storage.ts` gains `levelStars?: Record<number, StarRating>` (migrating existing saves by backfilling `1★` for levels `1 .. currentLevelId - 1`). Pure helper functions in `src/state/gameState.ts` calculate star ratings, bonus improvements, and replay vs. frontier outcomes. `src/App.tsx` manages `'home' | 'levels' | 'game'` screens via `navigateWithTransition`, protecting the frontier `activeSnapshot` during replays and stepping `N -> N + 1` when advancing from any level.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, `@testing-library/preact`.

**Spec:** `docs/superpowers/specs/2026-11-02-level-selector-and-stars-design.md`

## Global Constraints

- Maintain compatibility with existing `localStorage` key `kittysquared_state_v1` in `src/state/storage.ts`.
- Never allow replaying an earlier level to lower `currentLevelId`, downgrade `levelStars[id]`, decrease `totalScore`, or overwrite an in-progress `activeSnapshot` on the frontier level (`currentLevelId`).
- All screen navigations (`home` ↔ `levels`, `levels` ↔ `game`, `home` ↔ `game`) must use `navigateWithTransition` in `src/App.tsx`.
- Replace `⭐` in `src/components/GameScreen.tsx` status bar with the custom Gold Kitty-Paw Coin SVG (`data-testid="score-paw-coin-icon"`).

## Review Focus

1. **Corrupted `levelStars` in `localStorage`:** If `localStorage` contains non-object `levelStars` or out-of-range keys/values (e.g., `{ "1": 99, "-3": 2, "abc": "three", "2": 3 }`), `loadPersistedState()` discards invalid entries, preserves valid `1 | 2 | 3` ratings for keys `1..300`, and backfills missing completed levels `1 .. currentLevelId - 1` with `1`.
2. **Replay with Worse Mistakes than Previous Best:** If a player previously cleared Level 1 with `3★` (`0` mistakes) and replays Level 1 making `2` mistakes (`1★`), `computeLevelWinOutcome` returns `scoreGain: 0` and `bestStars: 3` so neither their star rating nor `totalScore` decreases.
3. **Post-Game Completed State (`currentLevelId === 301`) in `LevelSelectScreen`:** Opening `LevelSelectScreen` when `currentLevelId > 300` selects the `10×10` tab (`tier-tab-10`) without crashing and renders all 300 levels as unlocked and clickable.
4. **Frontier Snapshot Preservation During Replay:** If a player has an in-progress `activeSnapshot` at frontier Level 5, opens `LevelSelectScreen`, plays Level 1 (placing crosses/cats), and returns to Home to click `Jugar`, Level 5 resumes with its original `activeSnapshot` intact.
5. **Replaying Level `currentLevelId - 1` and Advancing Into `currentLevelId`:** When a player replays Level `currentLevelId - 1`, wins, and clicks `Siguiente Nivel ▶` to step into frontier `currentLevelId`, if an `activeSnapshot` exists for `currentLevelId`, that snapshot is restored into the new session.

---

### Task 1: Star & Replay Outcome Math and `levelStars` Persistence

**Files:**
- Modify: `src/state/gameState.ts`
- Modify: `src/state/storage.ts`
- Test: `tests/state/gameState.test.ts`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Produces in `src/state/storage.ts`:
  - `export type StarRating = 1 | 2 | 3;`
  - `export interface ModeProgress { currentLevelId: number; totalScore: number; activeSnapshot: SavedBoardSnapshot | null; levelStars?: Record<number, StarRating>; }`
  - `export function getTotalEarnedStars(progress: ModeProgress): number`
- Produces in `src/state/gameState.ts`:
  - `export function getStarsForMistakes(mistakes: number): StarRating`
  - `export function getBonusForStars(stars: StarRating): number`
  - `export interface LevelWinOutcome { isReplay: boolean; earnedStars: StarRating; bestStars: StarRating; scoreGain: number; nextCurrentLevelId: number; }`
  - `export function computeLevelWinOutcome(session: LevelSessionState, progress: ModeProgress): LevelWinOutcome`

- [ ] **Step 1: Write failing tests in `tests/state/gameState.test.ts` and `tests/state/storage.test.ts`**

Add to `tests/state/gameState.test.ts`:
```ts
  describe('star ratings and replay scoring', () => {
    it('maps mistakes to stars (0->3, 1->2, 2->1) and stars to bonus (3->50, 2->30, 1->10)', () => {
      expect(getStarsForMistakes(0)).toBe(3);
      expect(getStarsForMistakes(1)).toBe(2);
      expect(getStarsForMistakes(2)).toBe(1);
      expect(getBonusForStars(3)).toBe(50);
      expect(getBonusForStars(2)).toBe(30);
      expect(getBonusForStars(1)).toBe(10);
    });

    it('computeLevelWinOutcome awards full cat + bonus points and advances currentLevelId on first-time frontier clear', () => {
      let s = createLevelSession(samplePuzzle);
      s = applyCellTap(s, 0, 0, { isDoubleTap: true }); // 1 mistake -> 2 stars (+30)
      s = applyCellTap(s, 0, 1, { isDoubleTap: true });
      s = applyCellTap(s, 1, 3, { isDoubleTap: true });
      s = applyCellTap(s, 2, 0, { isDoubleTap: true });
      s = applyCellTap(s, 3, 2, { isDoubleTap: true });

      const outcome = computeLevelWinOutcome(s, {
        currentLevelId: 1,
        totalScore: 100,
        activeSnapshot: null,
        levelStars: {},
      });

      expect(outcome).toEqual({
        isReplay: false,
        earnedStars: 2,
        bestStars: 2,
        scoreGain: 70, // 40 partial + 30 bonus
        nextCurrentLevelId: 2,
      });
    });

    it('Review Focus #2: computeLevelWinOutcome on replay only awards positive bonus delta and never downgrades bestStars', () => {
      let s = createLevelSession(samplePuzzle);
      // 0 mistakes -> 3 stars (+50)
      s = applyCellTap(s, 0, 1, { isDoubleTap: true });
      s = applyCellTap(s, 1, 3, { isDoubleTap: true });
      s = applyCellTap(s, 2, 0, { isDoubleTap: true });
      s = applyCellTap(s, 3, 2, { isDoubleTap: true });

      // Improving from 1 star (+10) to 3 stars (+50) awards +40 and keeps currentLevelId at 5
      const improved = computeLevelWinOutcome(s, {
        currentLevelId: 5,
        totalScore: 400,
        activeSnapshot: null,
        levelStars: { 1: 1 },
      });
      expect(improved).toEqual({
        isReplay: true,
        earnedStars: 3,
        bestStars: 3,
        scoreGain: 40,
        nextCurrentLevelId: 5,
      });

      // Replaying with 2 mistakes (1 star) when already holding 3 stars -> 0 gain, keeps 3 stars
      let worseSession = createLevelSession(samplePuzzle);
      worseSession = applyCellTap(worseSession, 0, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 1, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 0, 1, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 1, 3, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 2, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 3, 2, { isDoubleTap: true });

      const worse = computeLevelWinOutcome(worseSession, {
        currentLevelId: 5,
        totalScore: 440,
        activeSnapshot: null,
        levelStars: { 1: 3 },
      });
      expect(worse).toEqual({
        isReplay: true,
        earnedStars: 1,
        bestStars: 3,
        scoreGain: 0,
        nextCurrentLevelId: 5,
      });
    });
  });
```

Add to `tests/state/storage.test.ts`:
```ts
  it('Review Focus #1: sanitizes corrupted levelStars and backfills 1 star for completed levels 1..currentLevelId-1', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: {
          currentLevelId: 4,
          totalScore: 250,
          activeSnapshot: null,
          levelStars: { '1': 99, '2': 3, '-5': 2, abc: 'three' },
        },
      })
    );

    const loaded = loadPersistedState();
    expect(loaded.progress.levelStars).toEqual({
      1: 1, // backfilled since 99 was invalid
      2: 3, // preserved valid rating
      3: 1, // backfilled since missing and < currentLevelId (4)
    });
    expect(getTotalEarnedStars(loaded.progress)).toBe(5);
  });

  it('clears levelStars to empty object on resetProgress', () => {
    const state = getDefaultAppState();
    state.progress.currentLevelId = 3;
    state.progress.levelStars = { 1: 3, 2: 2 };
    const after = resetProgress(state);
    expect(after.progress.levelStars).toEqual({});
    expect(getTotalEarnedStars(after.progress)).toBe(0);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/state/gameState.test.ts tests/state/storage.test.ts`
Expected: FAIL with missing exports `getStarsForMistakes`, `getBonusForStars`, `computeLevelWinOutcome`, `getTotalEarnedStars`.

- [ ] **Step 3: Implement star & replay helpers in `src/state/storage.ts` and `src/state/gameState.ts`**

In `src/state/storage.ts`:
- Export `type StarRating = 1 | 2 | 3;` and add `levelStars?: Record<number, StarRating>;` to `ModeProgress` (initializing `levelStars: {}` in `getDefaultAppState()` and `resetProgress()`).
- In `loadPersistedState()`, sanitize `rawProgress.levelStars` (accepting integer keys `1..300` with values `1 | 2 | 3`) and backfill `sanitizedStars[lvl] = 1` for every `lvl` from `1` to `Math.min(300, currentLevelId - 1)` where `sanitizedStars[lvl]` is undefined.
- Export `getTotalEarnedStars(progress: ModeProgress): number` summing `Object.values(progress.levelStars || {})`.

In `src/state/gameState.ts`:
- Export `getStarsForMistakes`, `getBonusForStars`, `LevelWinOutcome`, and `computeLevelWinOutcome(session: LevelSessionState, progress: ModeProgress): LevelWinOutcome` per Spec §5.1–5.2.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/state/gameState.test.ts tests/state/storage.test.ts`
Expected: PASS.

---

### Task 2: `LevelSelectScreen` Component

**Files:**
- Create: `src/components/LevelSelectScreen.tsx`
- Test: `tests/components/LevelSelectScreen.test.tsx`

**Interfaces:**
- Consumes: `ModeProgress`, `StarRating`, `getTotalEarnedStars` from `src/state/storage.ts`; `LEVEL_TIERS` from `src/engine/generator.ts`.
- Produces in `src/components/LevelSelectScreen.tsx`:
  ```ts
  export interface LevelSelectScreenProps {
    progress: ModeProgress;
    totalLevels?: number;
    onSelectLevel: (levelId: number) => void;
    onBack: () => void;
  }
  export function LevelSelectScreen(props: LevelSelectScreenProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing test in `tests/components/LevelSelectScreen.test.tsx`**

```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LevelSelectScreen } from '../../src/components/LevelSelectScreen';

describe('LevelSelectScreen component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('auto-selects the tier tab containing currentLevelId, displays total and tier stars, and renders completed, frontier, and locked tiles', () => {
    const onSelectLevel = vi.fn();
    const onBack = vi.fn();

    render(
      <LevelSelectScreen
        progress={{
          currentLevelId: 18,
          totalScore: 1500,
          activeSnapshot: null,
          levelStars: {
            1: 3,
            16: 3,
            17: 2,
          },
        }}
        totalLevels={300}
        onSelectLevel={onSelectLevel}
        onBack={onBack}
      />
    );

    // Total stars pill shows sum of levelStars (3 + 3 + 2 = 8 / 900)
    expect(screen.getByTestId('level-select-total-stars').textContent).toContain('8 / 900');

    // Level 18 is in 6x6 tier (16..40), so tier-tab-6 is active
    expect(screen.getByTestId('tier-tab-6').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('tier-summary-banner').textContent).toContain('16–40');
    expect(screen.getByTestId('tier-summary-banner').textContent).toContain('5 / 75');

    // Completed tile 16 is enabled and clickable
    const tile16 = screen.getByTestId('level-tile-16') as HTMLButtonElement;
    expect(tile16.disabled).toBe(false);
    fireEvent.click(tile16);
    expect(onSelectLevel).toHaveBeenCalledWith(16);

    // Frontier tile 18 shows JUGAR and is clickable
    const tile18 = screen.getByTestId('level-tile-18') as HTMLButtonElement;
    expect(tile18.disabled).toBe(false);
    expect(tile18.textContent).toContain('JUGAR');
    fireEvent.click(tile18);
    expect(onSelectLevel).toHaveBeenCalledWith(18);

    // Locked tile 19 is disabled and does not fire onSelectLevel
    const tile19 = screen.getByTestId('level-tile-19') as HTMLButtonElement;
    expect(tile19.disabled).toBe(true);
    fireEvent.click(tile19);
    expect(onSelectLevel).toHaveBeenCalledTimes(2);

    // Switching to 5x5 tab renders levels 1..15
    fireEvent.click(screen.getByTestId('tier-tab-5'));
    expect(screen.getByTestId('level-tile-1')).toBeTruthy();

    // Back button calls onBack
    fireEvent.click(screen.getByTestId('level-select-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Review Focus #3: defaults to 10x10 tab and unlocks all 300 levels when game is completed (currentLevelId === 301)', () => {
    const onSelectLevel = vi.fn();
    render(
      <LevelSelectScreen
        progress={{
          currentLevelId: 301,
          totalScore: 25000,
          activeSnapshot: null,
          levelStars: { 300: 3 },
        }}
        totalLevels={300}
        onSelectLevel={onSelectLevel}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId('tier-tab-10').getAttribute('aria-selected')).toBe('true');
    const tile300 = screen.getByTestId('level-tile-300') as HTMLButtonElement;
    expect(tile300.disabled).toBe(false);
    fireEvent.click(tile300);
    expect(onSelectLevel).toHaveBeenCalledWith(300);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/LevelSelectScreen.test.tsx`
Expected: FAIL with module `../../src/components/LevelSelectScreen` not found.

- [ ] **Step 3: Implement `LevelSelectScreen` in `src/components/LevelSelectScreen.tsx`**

Implement `LevelSelectScreen` per Spec §5.3 with the 6 board-size tiers (`5×5`: `1–15`, `6×6`: `16–40`, `7×7`: `41–65`, `8×8`: `66–85`, `9×9`: `86–100`, `10×10`: `101–300`), SVG filled/empty stars, SVG lock icon, `data-testid="tier-summary-banner"`, `data-testid="tier-tab-${size}"`, `data-testid="level-tile-${id}"`, `data-testid="level-select-back-btn"`, and `data-testid="level-select-total-stars"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/LevelSelectScreen.test.tsx`
Expected: PASS.

---

### Task 3: `HomeScreen` `Niveles` Button & `GameScreen` Gold Paw-Coin Icon + Replay Score Display

**Files:**
- Modify: `src/components/HomeScreen.tsx`
- Modify: `src/components/GameScreen.tsx`
- Modify: `tests/components/HomeScreen.test.tsx`
- Modify: `tests/components/GameScreen.test.tsx`

**Interfaces:**
- Modifies `HomeScreenProps` in `src/components/HomeScreen.tsx`:
  - Adds `onOpenLevels?: () => void;`
- Modifies `GameScreen` in `src/components/GameScreen.tsx`:
  - Renders `data-testid="score-paw-coin-icon"` SVG instead of `⭐`.
  - Uses `computeLevelWinOutcome(session, progress)` when displaying replay vs. frontier score additions in the status bar and Victory modal.

- [ ] **Step 1: Update and add failing tests in `tests/components/HomeScreen.test.tsx` and `tests/components/GameScreen.test.tsx`**

In `tests/components/HomeScreen.test.tsx`, add:
```tsx
  it('renders Niveles button with earned stars and triggers onOpenLevels', () => {
    const onOpenLevels = vi.fn();
    render(
      <HomeScreen
        progress={{
          currentLevelId: 4,
          totalScore: 125,
          activeSnapshot: null,
          levelStars: { 1: 3, 2: 2, 3: 3 },
        }}
        totalLevels={300}
        catVariant="black"
        onPlay={vi.fn()}
        onOpenLevels={onOpenLevels}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const levelsBtn = screen.getByTestId('open-levels-btn');
    expect(levelsBtn.textContent).toContain('Niveles');
    expect(levelsBtn.textContent).toContain('8 / 900');
    fireEvent.click(levelsBtn);
    expect(onOpenLevels).toHaveBeenCalledTimes(1);
  });
```

In `tests/components/GameScreen.test.tsx`:
- Update line 78 from `expect(statusBar.textContent).toContain('⭐ 0');` to verify `getByTestId('score-paw-coin-icon')` is rendered and `statusBar.textContent` does not contain `'⭐'`.
- Add test verifying replay score display in `GameScreen`:
```tsx
  it('hides partial cat score badge during a replay and shows only bonus improvement on win', () => {
    const session = createLevelSession(samplePuzzle);
    session.partialScore = 20;
    const defaultState = getDefaultAppState();
    // Level 42 already completed with 2 stars (+30 bonus)
    defaultState.progress.currentLevelId = 50;
    defaultState.progress.totalScore = 500;
    defaultState.progress.levelStars = { 42: 2 };

    const { getByTestId, rerender, getByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={session}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    // While playing a replay, no (+20) badge is shown in status bar
    expect(getByTestId('game-status-bar').textContent).not.toContain('(+');

    // When won with 0 mistakes (3 stars -> +50 bonus vs previous +30 -> +20 improvement)
    session.status = 'won';
    session.partialScore = 40;
    session.levelBonus = 50;
    session.mistakes = 0;

    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={{ ...session }}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(getByTestId('game-status-bar').textContent).toContain('(+20)');
    expect(getByText(/Nuevo total: 520 pts/i)).toBeTruthy();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/HomeScreen.test.tsx tests/components/GameScreen.test.tsx`
Expected: FAIL on `open-levels-btn` and `score-paw-coin-icon`.

- [ ] **Step 3: Implement `HomeScreen.tsx` and `GameScreen.tsx` updates**

In `src/components/HomeScreen.tsx`:
- Add `onOpenLevels?: () => void` to `HomeScreenProps`.
- Render `data-testid="open-levels-btn"` below `start-game-btn` with `Niveles` on the left and the custom SVG gold star + `${getTotalEarnedStars(progress)} / ${levelsCount * 3}` on the right.
- Wrap `open-tutorial-btn` and `open-settings-btn` in a 2-column grid container (`display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'`).

In `src/components/GameScreen.tsx`:
- Replace `⭐` in `game-status-bar` with the Gold Kitty-Paw Coin SVG (`data-testid="score-paw-coin-icon"`, Spec §5.5).
- Compute `isReplay = puzzle.id < progress.currentLevelId || progress.levelStars?.[puzzle.id] !== undefined`.
- In `game-status-bar`, display `(+...)` as:
  - On frontier (`!isReplay`): `session.partialScore > 0 ? (+${session.partialScore + (session.status === 'won' ? session.levelBonus : 0)}) : null`.
  - On replay (`isReplay`): when `session.status === 'won'` and `winOutcome.scoreGain > 0`, show `(+${winOutcome.scoreGain})`.
- In the Victory modal (`session.status === 'won'`), use `winOutcome.scoreGain` for the new total (`progress.totalScore + winOutcome.scoreGain`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/HomeScreen.test.tsx tests/components/GameScreen.test.tsx`
Expected: PASS.

---

### Task 4: Full-Screen Level Select Navigation, Snapshot Protection & Replay Flow in `App.tsx`

**Files:**
- Modify: `src/App.tsx`
- Modify: `tests/App.test.tsx`

**Interfaces:**
- Consumes: `LevelSelectScreen` from `src/components/LevelSelectScreen.tsx`; `computeLevelWinOutcome` from `src/state/gameState.ts`; `StarRating` from `src/state/storage.ts`.

- [ ] **Step 1: Write failing integration tests in `tests/App.test.tsx`**

Add to `tests/App.test.tsx`:
```tsx
    it('Review Focus #4 & #5: navigates to LevelSelectScreen, replays an earlier level without overwriting frontier activeSnapshot, awards only bonus improvement, and restores frontier snapshot when stepping into currentLevelId', () => {
      // Frontier is Level 2 with an active snapshot (cross at 0,0); Level 1 completed with 1 star (mistakes: 2)
      const level2SnapBoard = Array.from({ length: 5 }, () => Array(5).fill('empty'));
      level2SnapBoard[0][0] = 'cross';
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: {
            currentLevelId: 2,
            totalScore: 60, // 50 cat pts + 10 bonus from 1-star clear
            levelStars: { 1: 1 },
            activeSnapshot: {
              levelId: 2,
              board: level2SnapBoard,
              lockedCats: Array.from({ length: 5 }, () => Array(5).fill(false)),
              mistakes: 0,
              partialScore: 0,
            },
          },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, getByText } = render(<App transitionDurationMs={0} />);

      // Open Level Selector from Home
      fireEvent.click(getByTestId('open-levels-btn'));
      expect(getByTestId('level-select-total-stars').textContent).toContain('1 / 900');

      // Select Level 1 for replay
      fireEvent.click(getByTestId('level-tile-1'));
      expect(getByText('Nivel 1')).toBeTruthy();

      // Place a cross on Level 1 -> must NOT overwrite Level 2's activeSnapshot in localStorage
      fireEvent.click(getByTestId('cell-0-0'));
      const midReplaySaved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(midReplaySaved.progress.activeSnapshot?.levelId).toBe(2);
      expect(midReplaySaved.progress.activeSnapshot?.board[0][0]).toBe('cross');

      // Clear cross at (0,0) and solve Level 1 with 0 mistakes (solution for puzzle 1: [3, 0, 2, 4, 1])
      fireEvent.click(getByTestId('cell-0-0'));
      const lvl1Solution = [3, 0, 2, 4, 1];
      for (let r = 0; r < lvl1Solution.length; r++) {
        const cell = getByTestId(`cell-${r}-${lvl1Solution[r]}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      // Advance from Level 1 -> steps to Level 2
      fireEvent.click(getByText(/Siguiente Nivel ▶/i));
      expect(getByText('Nivel 2')).toBeTruthy();

      // Score should increase by +40 (3-star 50 bonus minus 1-star 10 bonus = 40 -> total 100), stars[1] = 3, currentLevelId stays 2
      const afterWinSaved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(afterWinSaved.progress.totalScore).toBe(100);
      expect(afterWinSaved.progress.levelStars['1']).toBe(3);
      expect(afterWinSaved.progress.currentLevelId).toBe(2);

      // And Level 2's saved cross at (0,0) should be restored on the board!
      const cell00OnLvl2 = getByTestId('cell-0-0');
      expect(cell00OnLvl2.querySelector('svg.cross-mark')).not.toBeNull();
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/App.test.tsx`
Expected: FAIL (`open-levels-btn` does not navigate to `LevelSelectScreen`).

- [ ] **Step 3: Implement `'levels'` screen state, `handleSelectLevel`, snapshot protection, and `handleAdvanceLevel` in `src/App.tsx`**

In `src/App.tsx`:
- Expand `activeScreen` to `'home' | 'levels' | 'game'`.
- Add `handleOpenLevels` (`navigateWithTransition('forward', () => setActiveScreen('levels'))`) and `handleSelectLevel(levelId: number)` (loads `levelId`, restoring `activeSnapshot` only if `activeSnapshot?.levelId === levelId`, and navigates forward to `'game'`).
- In `handleUpdateSession(nextSession)`, only update `progress.activeSnapshot` if `nextSession.puzzle.id === appState.progress.currentLevelId`; otherwise preserve `appState.progress.activeSnapshot`.
- In `handleAdvanceLevel()`, use `computeLevelWinOutcome(session, appState.progress)` to update `totalScore`, `levelStars`, `currentLevelId`, and `activeSnapshot`, and when advancing to `nextLvlId = session.puzzle.id + 1`, restore `nextActiveSnapshot` if `nextActiveSnapshot?.levelId === nextLvlId`.

- [ ] **Step 4: Run the full test suite to verify everything passes**

Run: `npx vitest run tests/App.test.tsx tests/state/storage.test.ts tests/state/gameState.test.ts tests/components/LevelSelectScreen.test.tsx tests/components/HomeScreen.test.tsx tests/components/GameScreen.test.tsx`
Expected: PASS.
