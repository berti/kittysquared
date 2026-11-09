import { describe, expect, it } from 'vitest';
import {
  computeDailyWinOutcome,
  formatDailyDate,
  formatDailyDateSpanish,
  getDailyPuzzleIndex,
  getDayOfYearIndex,
  getEffectiveStreak,
  getPreviousDateString,
  getTodayDateString,
} from '../../src/engine/daily';
import { DailyProgress } from '../../src/types/puzzle';

describe('engine/daily', () => {
  describe('getTodayDateString', () => {
    it('returns YYYY-MM-DD for a specific Date', () => {
      const date = new Date(2026, 10, 8); // November is month 10 (0-indexed)
      expect(getTodayDateString(date)).toBe('2026-11-08');
    });

    it('pads single-digit month and day with zeros', () => {
      const date = new Date(2026, 0, 5); // Jan 5
      expect(getTodayDateString(date)).toBe('2026-01-05');
    });

    it('returns current date when called without arguments', () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getPreviousDateString', () => {
    it('returns the previous day in same month', () => {
      expect(getPreviousDateString('2026-11-08')).toBe('2026-11-07');
    });

    it('handles month boundary', () => {
      expect(getPreviousDateString('2026-05-01')).toBe('2026-04-30');
    });

    it('handles year boundary', () => {
      expect(getPreviousDateString('2026-01-01')).toBe('2025-12-31');
    });

    it('handles leap year February 29th', () => {
      // 2024 is a leap year
      expect(getPreviousDateString('2024-03-01')).toBe('2024-02-29');
      expect(getPreviousDateString('2024-02-29')).toBe('2024-02-28');
    });

    it('handles non-leap year March 1st', () => {
      // 2023 is non-leap
      expect(getPreviousDateString('2023-03-01')).toBe('2023-02-28');
    });

    it('is immune to Daylight Saving Time shifts (pure UTC arithmetic)', () => {
      // European DST shift occurs in late March
      expect(getPreviousDateString('2026-03-30')).toBe('2026-03-29');
      expect(getPreviousDateString('2026-03-29')).toBe('2026-03-28');
    });
  });

  describe('getDayOfYearIndex', () => {
    it('returns 0 for Jan 1', () => {
      expect(getDayOfYearIndex('2026-01-01')).toBe(0);
    });

    it('returns 1 for Jan 2', () => {
      expect(getDayOfYearIndex('2026-01-02')).toBe(1);
    });

    it('returns 364 for Dec 31 on a non-leap year (2026)', () => {
      expect(getDayOfYearIndex('2026-12-31')).toBe(364);
    });

    it('returns 365 for Dec 31 on a leap year (2024)', () => {
      expect(getDayOfYearIndex('2024-12-31')).toBe(365);
    });

    it('maintains continuous sequential indices across March DST spring-forward', () => {
      const idx28 = getDayOfYearIndex('2026-03-28');
      const idx29 = getDayOfYearIndex('2026-03-29');
      const idx30 = getDayOfYearIndex('2026-03-30');
      expect(idx29).toBe(idx28 + 1);
      expect(idx30).toBe(idx29 + 1);
    });
  });

  describe('getDailyPuzzleIndex', () => {
    it('returns a non-negative integer within 0..bankLength - 1', () => {
      const bankLength = 365;
      const index = getDailyPuzzleIndex('2026-11-08', bankLength);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(bankLength);
    });

    it('is deterministic for the same date', () => {
      expect(getDailyPuzzleIndex('2026-11-08', 365)).toBe(getDailyPuzzleIndex('2026-11-08', 365));
    });

    it('produces continuous unique transitions across year boundaries', () => {
      const dec31 = getDailyPuzzleIndex('2024-12-31', 365);
      const jan1 = getDailyPuzzleIndex('2025-01-01', 365);
      expect(dec31).toBeGreaterThanOrEqual(0);
      expect(jan1).toBeGreaterThanOrEqual(0);
      expect(dec31).not.toBe(jan1);
    });
  });

  describe('getEffectiveStreak', () => {
    const baseDaily: DailyProgress = {
      lastPlayedDate: null,
      currentStreak: 0,
      maxStreak: 0,
      history: {},
      activeSnapshot: null,
      activeSnapshotDate: null,
    };

    it('returns 0 when never played or currentStreak is 0', () => {
      expect(getEffectiveStreak(baseDaily, '2026-11-08')).toBe(0);
      expect(
        getEffectiveStreak({ ...baseDaily, lastPlayedDate: '2026-11-08', currentStreak: 0 }, '2026-11-08')
      ).toBe(0);
    });

    it('returns currentStreak when played today', () => {
      const daily: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-08',
        currentStreak: 5,
        maxStreak: 10,
      };
      expect(getEffectiveStreak(daily, '2026-11-08')).toBe(5);
    });

    it('returns currentStreak when played yesterday (streak is still active today)', () => {
      const daily: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-07',
        currentStreak: 5,
        maxStreak: 10,
      };
      expect(getEffectiveStreak(daily, '2026-11-08')).toBe(5);
    });

    it('returns 0 when gap is 2 or more days', () => {
      const daily: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-06',
        currentStreak: 5,
        maxStreak: 10,
      };
      expect(getEffectiveStreak(daily, '2026-11-08')).toBe(0);
    });
  });

  describe('computeDailyWinOutcome', () => {
    const baseDaily: DailyProgress = {
      lastPlayedDate: null,
      currentStreak: 0,
      maxStreak: 0,
      history: {},
      activeSnapshot: null,
      activeSnapshotDate: null,
    };

    it('sets streak to 1 on initial win', () => {
      const outcome = computeDailyWinOutcome(baseDaily, '2026-11-08', 3, 0, 125);
      expect(outcome.lastPlayedDate).toBe('2026-11-08');
      expect(outcome.currentStreak).toBe(1);
      expect(outcome.maxStreak).toBe(1);
      expect(outcome.activeSnapshot).toBeNull();
      expect(outcome.activeSnapshotDate).toBeNull();
      expect(outcome.history['2026-11-08']).toMatchObject({
        date: '2026-11-08',
        stars: 3,
        mistakes: 0,
        timeSeconds: 125,
      });
      expect(outcome.history['2026-11-08'].completedAt).toBeDefined();
    });

    it('increments streak on consecutive day play', () => {
      const current: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-07',
        currentStreak: 4,
        maxStreak: 6,
      };
      const outcome = computeDailyWinOutcome(current, '2026-11-08', 2, 1, 180);
      expect(outcome.currentStreak).toBe(5);
      expect(outcome.maxStreak).toBe(6);
      expect(outcome.lastPlayedDate).toBe('2026-11-08');
    });

    it('updates maxStreak when currentStreak exceeds maxStreak', () => {
      const current: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-07',
        currentStreak: 6,
        maxStreak: 6,
      };
      const outcome = computeDailyWinOutcome(current, '2026-11-08', 3, 0, 90);
      expect(outcome.currentStreak).toBe(7);
      expect(outcome.maxStreak).toBe(7);
    });

    it('resets streak to 1 after a gap of 2 or more days', () => {
      const current: DailyProgress = {
        ...baseDaily,
        lastPlayedDate: '2026-11-05',
        currentStreak: 12,
        maxStreak: 12,
      };
      const outcome = computeDailyWinOutcome(current, '2026-11-08', 3, 0, 110);
      expect(outcome.currentStreak).toBe(1);
      expect(outcome.maxStreak).toBe(12); // maxStreak is retained
      expect(outcome.lastPlayedDate).toBe('2026-11-08');
    });

    it('does not increment streak again on same-day replay', () => {
      const firstWin = computeDailyWinOutcome(baseDaily, '2026-11-08', 3, 0, 120);
      const replay = computeDailyWinOutcome(firstWin, '2026-11-08', 2, 1, 140);
      expect(replay.currentStreak).toBe(1);
      expect(replay.maxStreak).toBe(1);
      // Keeps original history record
      expect(replay.history['2026-11-08'].stars).toBe(3);
    });
  });

  describe('formatDailyDateSpanish', () => {
    it('formats in long style (default): "8 de noviembre"', () => {
      expect(formatDailyDateSpanish('2026-11-08')).toBe('8 de noviembre');
      expect(formatDailyDateSpanish('2026-11-08', 'long')).toBe('8 de noviembre');
    });

    it('formats in short style: "8 nov 2026"', () => {
      expect(formatDailyDateSpanish('2026-11-08', 'short')).toBe('8 nov 2026');
    });

    it('handles first day of the month without leading zero', () => {
      expect(formatDailyDateSpanish('2026-01-01', 'long')).toBe('1 de enero');
      expect(formatDailyDateSpanish('2026-01-01', 'short')).toBe('1 ene 2026');
    });

    it('formats all 12 months correctly', () => {
      const longMonths = [
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
      const shortMonths = [
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

      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        const dateStr = `2026-${mm}-15`;
        expect(formatDailyDateSpanish(dateStr, 'long')).toBe(`15 de ${longMonths[m - 1]}`);
        expect(formatDailyDateSpanish(dateStr, 'short')).toBe(`15 ${shortMonths[m - 1]} 2026`);
      }
    });
  });

  describe('formatDailyDate', () => {
    it('defaults to Spanish and long style when style and lang are omitted', () => {
      expect(formatDailyDate('2026-11-08')).toBe('8 de noviembre');
    });

    it('formats in Spanish long and short styles', () => {
      expect(formatDailyDate('2026-11-08', 'long', 'es')).toBe('8 de noviembre');
      expect(formatDailyDate('2026-11-08', 'short', 'es')).toBe('8 nov 2026');
    });

    it('formats in English long style ("November 8")', () => {
      expect(formatDailyDate('2026-11-08', 'long', 'en')).toBe('November 8');
      expect(formatDailyDate('2026-01-01', 'long', 'en')).toBe('January 1');
    });

    it('formats in English short style ("Nov 8, 2026")', () => {
      expect(formatDailyDate('2026-11-08', 'short', 'en')).toBe('Nov 8, 2026');
      expect(formatDailyDate('2026-01-01', 'short', 'en')).toBe('Jan 1, 2026');
    });

    it('formats all 12 English months correctly in both styles', () => {
      const enLongMonths = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const enShortMonths = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, '0');
        const dateStr = `2026-${mm}-15`;
        expect(formatDailyDate(dateStr, 'long', 'en')).toBe(`${enLongMonths[m - 1]} 15`);
        expect(formatDailyDate(dateStr, 'short', 'en')).toBe(`${enShortMonths[m - 1]} 15, 2026`);
      }
    });

    it('preserves backward compatibility with formatDailyDateSpanish', () => {
      expect(formatDailyDateSpanish('2026-11-08', 'long')).toBe(formatDailyDate('2026-11-08', 'long', 'es'));
      expect(formatDailyDateSpanish('2026-11-08', 'short')).toBe(formatDailyDate('2026-11-08', 'short', 'es'));
    });
  });
});
