# Milestone 6 — Daily 10×10 Hard Puzzle ("Reto Diario") & Shareable Grid Design Spec

Date: 2026-11-08

## 1. Overview & Goals

Milestone 6 introduces **Reto Diario** (Daily Challenge) to **KittySquared**, giving players a fresh, high-stakes 10×10 logic puzzle every calendar day.

### Core Objectives:
1. **Instant, Zero-Lag Daily Bank (Approach A):** A pre-generated bank of 365 unique, 10×10 hard puzzles (`rules 4–6`, single unique solution, verified 100% logically solvable) stored in [`src/data/dailyPuzzles.json`](file:///home/berti/code/kittysquared/src/data/dailyPuzzles.json). Zero runtime CPU freeze or battery drain.
2. **Deterministic Date Mapping:** Calendar dates (`YYYY-MM-DD`) map deterministically to a daily puzzle via pure UTC date arithmetic (immune to DST spring-forward/fall-back shifts) so all players worldwide face the identical challenge on any given day.
3. **Dedicated Home Screen Card:** A prominent "Reto Diario" card on [`HomeScreen.tsx`](file:///home/berti/code/kittysquared/src/components/HomeScreen.tsx) displaying today's date, status (`Disponible` vs `Completado`), and active streak.
4. **Independent Daily Streak Progression:** Daily challenge tracking is kept strictly distinct from campaign progression (stars/points do not mix with cat breed unlocks). Tracks `currentStreak`, `maxStreak`, and per-date historical records.
5. **Effective Streak Calculation:** Calculates active streak dynamically so stale streaks from missed days display as 0 until solved.
6. **One-Tap Shareable Result Summary:** Clean, spoiler-free text summary formatted for Wordle/NYT Mini style sharing via native `navigator.share` with fallback to clipboard copy and toast feedback.
7. **Zero-Emoji Source Integrity:** All UI icons are bespoke Soft-Clay SVG vectors (`FlameIcon`, `CheckIcon`, `CalendarIcon`) in [`Icons.tsx`](file:///home/berti/code/kittysquared/src/components/Icons.tsx). Dynamic string construction for share text so source files remain 100% emoji-free to satisfy `tests/components/Icons.test.tsx`.

---

## 2. Data Model & State Architecture

### 2.1 Daily Types (`src/types/puzzle.ts`)

```ts
export interface DailyPuzzleResult {
  date: string; // 'YYYY-MM-DD'
  stars: 1 | 2 | 3;
  mistakes: number;
  timeSeconds: number;
  completedAt: string; // ISO 8601
}

export interface DailyProgress {
  lastPlayedDate: string | null; // 'YYYY-MM-DD'
  currentStreak: number;
  maxStreak: number;
  history: Record<string, DailyPuzzleResult>; // Keyed by 'YYYY-MM-DD'
  activeSnapshot: SavedBoardSnapshot | null;
  activeSnapshotDate: string | null;
}
```

### 2.2 Storage Model & Sanitization (`src/state/storage.ts`)

Add `daily: DailyProgress` to `PersistedAppState`:

```ts
export interface PersistedAppState {
  progress: ModeProgress;
  settings: AppSettings;
  daily: DailyProgress;
}
```

#### Default State:
```ts
export const DEFAULT_DAILY_PROGRESS: DailyProgress = {
  lastPlayedDate: null,
  currentStreak: 0,
  maxStreak: 0,
  history: {},
  activeSnapshot: null,
  activeSnapshotDate: null,
};
```

#### `loadPersistedState()` Backward Compatibility:
- For existing save files lacking `daily`, cleanly initialize with `DEFAULT_DAILY_PROGRESS`.
- Validate that `currentStreak` and `maxStreak` are non-negative numbers.
- Validate `history` items match `DailyPuzzleResult`.
- If `activeSnapshotDate !== getTodayDateString()`, discard stale snapshots from previous days.

#### `resetProgress(state)` Isolation:
- Preserves `state.daily` intact when resetting campaign levels. Campaign level resets do not wipe daily challenge streaks or history.

---

## 3. Date Math & Streak Logic (`src/engine/daily.ts`)

### 3.1 UTC-Safe Date Math (DST Proof)
```ts
export function getTodayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day) - 86400000;
  const prevDate = new Date(utc);
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = String(prevDate.getUTCMonth() + 1).padStart(2, '0');
  const prevDay = String(prevDate.getUTCDate()).padStart(2, '0');
  return `${prevYear}-${prevMonth}-${prevDay}`;
}

export function getDayOfYearIndex(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const currentUtc = Date.UTC(year, month - 1, day);
  const startOfYearUtc = Date.UTC(year, 0, 1);
  return Math.round((currentUtc - startOfYearUtc) / 86400000);
}

export function getDailyPuzzleIndex(dateStr: string, bankLength: number): number {
  const [year] = dateStr.split('-').map(Number);
  const dayOfYear = getDayOfYearIndex(dateStr);
  // Year-offset hashing prevents Dec 31 / Jan 1 duplicate adjacency across leap years
  return Math.abs((year * 366) + dayOfYear) % bankLength;
}
```

### 3.2 Effective Streak Calculation
```ts
export function getEffectiveStreak(daily: DailyProgress, todayStr: string = getTodayDateString()): number {
  if (!daily.lastPlayedDate || daily.currentStreak <= 0) return 0;
  if (daily.lastPlayedDate === todayStr) return daily.currentStreak;
  if (daily.lastPlayedDate === getPreviousDateString(todayStr)) return daily.currentStreak;
  // Gap of 2 or more days: streak is broken
  return 0;
}
```

### 3.3 Commit Daily Win Outcome
```ts
export function computeDailyWinOutcome(
  currentDaily: DailyProgress,
  todayStr: string,
  stars: 1 | 2 | 3,
  mistakes: number,
  timeSeconds: number
): DailyProgress {
  const alreadyCompleted = Boolean(currentDaily.history[todayStr]);
  let newCurrentStreak = currentDaily.currentStreak;

  if (!alreadyCompleted) {
    const yesterday = getPreviousDateString(todayStr);
    if (currentDaily.lastPlayedDate === yesterday) {
      newCurrentStreak = currentDaily.currentStreak + 1;
    } else if (currentDaily.lastPlayedDate === todayStr) {
      newCurrentStreak = currentDaily.currentStreak;
    } else {
      newCurrentStreak = 1;
    }
  }

  const newMaxStreak = Math.max(currentDaily.maxStreak, newCurrentStreak);

  return {
    ...currentDaily,
    lastPlayedDate: todayStr,
    currentStreak: newCurrentStreak,
    maxStreak: newMaxStreak,
    activeSnapshot: null,
    activeSnapshotDate: null,
    history: {
      ...currentDaily.history,
      [todayStr]: currentDaily.history[todayStr] ?? {
        date: todayStr,
        stars,
        mistakes,
        timeSeconds,
        completedAt: new Date().toISOString(),
      },
    },
  };
}
```

---

## 4. UI & Game Flow

### 4.1 Home Screen Reto Diario Card (`HomeScreen.tsx`)
Rendered between `Jugar` and `Niveles`:
- Styled with cozy Soft-Clay palette (`#FFF8F0`, border `#EADCC9`, shadow `0 3px 0 #E2D6C1`).
- **Left Side:**
  - Bespoke `CalendarIcon` (`src/components/Icons.tsx`).
  - Title: `"Reto Diario"`.
  - Date subtitle: formatted in Spanish (e.g. `"8 de noviembre"`).
- **Right Side:**
  - If **unplayed today**:
    - `"10×10 Difícil"` pill.
    - Streak badge with `FlameIcon` + count (e.g. `FlameIcon` + `getEffectiveStreak()`).
  - If **completed today**:
    - Green check pill with `CheckIcon` + `"Completado"`.
    - Star rating badge (e.g. `StarIcon` + `3★`).
- Clicking launches Daily mode in `GameScreen`.

### 4.2 Game Screen Daily Mode (`GameScreen.tsx` & `App.tsx`)
- **Game Mode State:** `activeGameMode: 'campaign' | 'daily'`.
- **Session Locking:** When entering daily mode, session records `puzzleDate: todayStr`. If play crosses midnight, the win commits to `session.puzzleDate` accurately.
- **Top Bar:**
  - Title: `"Reto Diario"`.
  - Subtitle: today's date formatted (e.g. `"8 nov 2026"`).
  - Score display is replaced with an active live elapsed timer (`MM:SS`).
- **Retry / Game Over Policy:**
  - If the player exhausts 3 hearts, they can tap `"Reintentar"` to start the daily puzzle over.
  - The daily streak is maintained as long as the puzzle is solved before local midnight.
- **Victory Modal:**
  - Header: `"¡Reto Diario Completado!"`.
  - Displays: Earned stars (`1–3★`), mistakes (`0–2 fallos`), elapsed time (`MM:SS`), and current daily streak (`"Racha: X días"` with `FlameIcon`).
  - Secondary Action: `"Compartir"` button.
  - Primary Action: `"Volver al inicio"` button.

### 4.3 Share Summary Generator (`src/engine/share.ts`)

#### Format:
```text
KittySquared — Reto Diario 2026-11-08
★★★ • 0 fallos • 2:15
Racha: 5 días
https://kittysquared.game
```

#### Implementation:
- Uses `★` (U+2605, standard unicode symbol permitted by zero-emoji test regex) or dynamic codepoint assembly.
- Attempts native `navigator.share({ title: 'KittySquared Reto Diario', text: shareText })`.
- Falls back to `navigator.clipboard.writeText(shareText)` and triggers a toast notification: `"¡Resultado copiado al portapapeles!"`.

### 4.4 New SVG Icons (`src/components/Icons.tsx`)
- `FlameIcon`: stylized soft-clay flame vector with amber/orange gradient fill.
- `CalendarIcon`: stylized soft-clay desk calendar with date sheet.
- `CheckIcon`: rounded stroke checkmark vector.

---

## 5. Verification & Testing Strategy

1. **Daily Generator & Dataset Validation:**
   - Pre-generated `src/data/dailyPuzzles.json` (365 puzzles).
   - Test suite verifies every puzzle has `size === 10`, `countSolutions === 1`, and `solveLogically === true`.
2. **UTC Date Math & Streak Tests:**
   - DST spring/fall transitions produce strictly consecutive indices.
   - Leap year Dec 31 to Jan 1 transition is continuous.
   - `getEffectiveStreak` returns 0 after 2+ missed days.
   - Consecutive days increment streak; same-day replay does not double-increment.
3. **Storage & Backward Compatibility Tests:**
   - Existing state without `daily` migrates cleanly with `DEFAULT_DAILY_PROGRESS`.
   - `resetProgress()` preserves `daily` progress intact.
4. **UI Integration Tests:**
   - `HomeScreen` renders Reto Diario card with correct date and streak.
   - `GameScreen` displays timer and daily header.
   - Victory Modal displays daily stats and triggers share action.
   - Zero-Emoji audit test (`Icons.test.tsx`) passes 100% cleanly.
