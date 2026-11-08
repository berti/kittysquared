import dailyPuzzlesData from '../data/dailyPuzzles.json';
import { DailyProgress, PuzzleDef } from '../types/puzzle';

const SPANISH_MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SPANISH_MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

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
  return Math.abs(year * 366 + dayOfYear) % bankLength;
}

export function getEffectiveStreak(
  daily: DailyProgress,
  todayStr: string = getTodayDateString()
): number {
  if (!daily.lastPlayedDate || daily.currentStreak <= 0) return 0;
  if (daily.lastPlayedDate === todayStr) return daily.currentStreak;
  if (daily.lastPlayedDate === getPreviousDateString(todayStr)) return daily.currentStreak;
  return 0;
}

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

export function formatDailyDateSpanish(
  dateStr: string,
  style: 'long' | 'short' = 'long'
): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const day = Number(dayStr);

  if (style === 'short') {
    const shortMonth = SPANISH_MONTHS_SHORT[monthIdx] ?? '';
    return `${day} ${shortMonth} ${year}`;
  }

  const longMonth = SPANISH_MONTHS_LONG[monthIdx] ?? '';
  return `${day} de ${longMonth}`;
}

export function getDailyPuzzleForDate(dateStr: string): PuzzleDef {
  const [year] = dateStr.split('-').map(Number);
  const index = getDailyPuzzleIndex(dateStr, dailyPuzzlesData.length);
  const basePuzzle = dailyPuzzlesData[index] as PuzzleDef;
  const virtualId = 10000 + (year % 100) * 1000 + index;

  return {
    ...basePuzzle,
    id: virtualId,
    regions: basePuzzle.regions.map((row) => [...row]),
    solution: [...basePuzzle.solution],
  };
}

