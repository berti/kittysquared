import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DailyShareOptions,
  formatDailyShareText,
  shareDailyResult,
} from '../../src/engine/share';

describe('engine/share', () => {
  describe('formatDailyShareText', () => {
    it('formats a 3-star, 0-mistake result with default URL', () => {
      const options: DailyShareOptions = {
        dateStr: '2026-11-08',
        stars: 3,
        mistakes: 0,
        timeSeconds: 135,
        streak: 5,
      };

      const result = formatDailyShareText(options);
      const expected = [
        'KittySquared \u2014 Reto Diario 2026-11-08',
        '\u2605\u2605\u2605 \u2022 0 fallos \u2022 2:15',
        'Racha: 5 d\u00edas',
        'https://kittysquared.game',
      ].join('\n');

      expect(result).toBe(expected);
    });

    it('formats a 1-star, 2-mistake result with custom URL', () => {
      const options: DailyShareOptions = {
        dateStr: '2026-11-09',
        stars: 1,
        mistakes: 2,
        timeSeconds: 65,
        streak: 1,
        url: 'https://custom.kittysquared.game',
      };

      const result = formatDailyShareText(options);
      const expected = [
        'KittySquared \u2014 Reto Diario 2026-11-09',
        '\u2605 \u2022 2 fallos \u2022 1:05',
        'Racha: 1 d\u00edas',
        'https://custom.kittysquared.game',
      ].join('\n');

      expect(result).toBe(expected);
    });

    it('zero-pads seconds properly (e.g. 0 seconds, 5 seconds)', () => {
      const resultZero = formatDailyShareText({
        dateStr: '2026-11-08',
        stars: 2,
        mistakes: 1,
        timeSeconds: 0,
        streak: 3,
      });
      expect(resultZero).toContain('0:00');

      const resultFive = formatDailyShareText({
        dateStr: '2026-11-08',
        stars: 2,
        mistakes: 1,
        timeSeconds: 5,
        streak: 3,
      });
      expect(resultFive).toContain('0:05');
    });

    it('omits URL line when url is empty string', () => {
      const result = formatDailyShareText({
        dateStr: '2026-11-08',
        stars: 3,
        mistakes: 0,
        timeSeconds: 90,
        streak: 10,
        url: '',
      });

      expect(result.split('\n')).toHaveLength(3);
      expect(result).not.toContain('http');
    });

    it('never contains forbidden unicode emojis or characters', () => {
      const text = formatDailyShareText({
        dateStr: '2026-11-08',
        stars: 3,
        mistakes: 0,
        timeSeconds: 120,
        streak: 7,
      });

      const forbiddenEmojiRegex =
        /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{2714}\u{2716}-\u{27BF}\u{2B50}\u{21BA}]/u;
      expect(forbiddenEmojiRegex.test(text)).toBe(false);
    });
  });

  describe('shareDailyResult', () => {
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    });

    it('returns "shared" when navigator.share succeeds', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
        },
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('shared');
      expect(mockShare).toHaveBeenCalledWith({
        title: 'KittySquared Reto Diario',
        text: 'Test share text',
      });
    });

    it('returns "shared" when navigator.share is cancelled by user (AbortError)', async () => {
      const abortError = new Error('Share canceled by user');
      abortError.name = 'AbortError';
      const mockShare = vi.fn().mockRejectedValue(abortError);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
        },
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('shared');
    });

    it('falls back to navigator.clipboard.writeText and returns "copied" when navigator.share is unavailable', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          clipboard: {
            writeText: mockWriteText,
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('copied');
      expect(mockWriteText).toHaveBeenCalledWith('Test share text');
    });

    it('falls back to navigator.clipboard.writeText when navigator.share throws non-abort error', async () => {
      const networkError = new Error('Network failure');
      networkError.name = 'TypeError';
      const mockShare = vi.fn().mockRejectedValue(networkError);
      const mockWriteText = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
          clipboard: {
            writeText: mockWriteText,
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('copied');
      expect(mockShare).toHaveBeenCalled();
      expect(mockWriteText).toHaveBeenCalledWith('Test share text');
    });

    it('returns "failed" when both navigator.share and navigator.clipboard.writeText fail', async () => {
      const shareError = new Error('Share failed');
      const mockShare = vi.fn().mockRejectedValue(shareError);
      const clipboardError = new Error('Clipboard denied');
      const mockWriteText = vi.fn().mockRejectedValue(clipboardError);

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: mockShare,
          clipboard: {
            writeText: mockWriteText,
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('failed');
    });

    it('returns "failed" when neither share nor clipboard are available', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });

      const result = await shareDailyResult('Test share text');
      expect(result).toBe('failed');
    });
  });
});
