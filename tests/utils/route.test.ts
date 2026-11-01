// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { clearDebugRoute, parseDebugRoute, updateDebugRoute } from '../../src/utils/route';

describe('route utilities', () => {
  describe('parseDebugRoute', () => {
    it('returns null for empty or non-debug routes', () => {
      expect(parseDebugRoute('')).toBeNull();
      expect(parseDebugRoute('/')).toBeNull();
      expect(parseDebugRoute('/levels')).toBeNull();
      expect(parseDebugRoute('/debug')).toBeNull();
      expect(parseDebugRoute('/debug/')).toBeNull();
    });

    it('returns null for invalid modes', () => {
      expect(parseDebugRoute('/debug/speed/10')).toBeNull();
      expect(parseDebugRoute('/debug/unknown/5')).toBeNull();
    });

    it('returns null for non-numeric levels', () => {
      expect(parseDebugRoute('/debug/classic/abc')).toBeNull();
      expect(parseDebugRoute('/debug/chill/')).toBeNull();
    });

    it('parses valid classic and chill routes', () => {
      expect(parseDebugRoute('/debug/classic/84')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 84,
      });

      expect(parseDebugRoute('/debug/chill/12')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 12,
      });
    });

    it('clamps level between 1 and 300', () => {
      expect(parseDebugRoute('/debug/classic/0')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 1,
      });

      expect(parseDebugRoute('/debug/chill/150')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 150,
      });

      expect(parseDebugRoute('/debug/chill/350')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 300,
      });
    });
  });

  describe('updateDebugRoute and clearDebugRoute', () => {
    it('updates URL without reloading page', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      updateDebugRoute('classic', 85);
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/debug/classic/85');
      replaceStateSpy.mockRestore();
    });

    it('clears debug route to root', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      clearDebugRoute();
      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/');
      pushStateSpy.mockRestore();
    });
  });
});
