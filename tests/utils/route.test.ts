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

      // Subpath deployment (e.g. GitHub Pages /kittysquared/)
      expect(parseDebugRoute('/kittysquared/debug/classic/84')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 84,
      });

      // Hash routing support (for static hosts like GitHub Pages)
      expect(parseDebugRoute('#/debug/classic/84')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 84,
      });

      expect(parseDebugRoute('#debug/chill/12')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 12,
      });

      expect(parseDebugRoute('/kittysquared/#/debug/classic/84')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 84,
      });

      expect(parseDebugRoute('https://berti.github.io/kittysquared/#/debug/chill/50')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 50,
      });

      // Query parameter support
      expect(parseDebugRoute('?debug=classic/42')).toEqual({
        isDebug: true,
        mode: 'classic',
        levelId: 42,
      });

      expect(parseDebugRoute('https://berti.github.io/kittysquared/?debug/chill/18')).toEqual({
        isDebug: true,
        mode: 'chill',
        levelId: 18,
      });
    });

    it('reads from window.location if no path is provided', () => {
      const origHash = window.location.hash;
      try {
        window.location.hash = '#/debug/chill/77';
        expect(parseDebugRoute()).toEqual({
          isDebug: true,
          mode: 'chill',
          levelId: 77,
        });
      } finally {
        window.location.hash = origHash;
      }
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

    it('updates URL preserving subpath if deployed in a subdirectory', () => {
      const origPathname = window.location.pathname;
      try {
        window.history.pushState(null, '', '/kittysquared/debug/chill/10');
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateDebugRoute('chill', 15);
        expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/kittysquared/debug/chill/15');
        replaceStateSpy.mockRestore();
      } finally {
        window.history.pushState(null, '', origPathname);
      }
    });

    it('updates URL preserving hash format when hash routing is active', () => {
      const origHref = window.location.href;
      try {
        window.history.pushState(null, '', '/kittysquared/#/debug/chill/10');
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateDebugRoute('chill', 11);
        expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/kittysquared/#/debug/chill/11');
        replaceStateSpy.mockRestore();
      } finally {
        window.history.pushState(null, '', origHref);
      }
    });

    it('clears debug route to root or subpath', () => {
      const pushStateSpy = vi.spyOn(window.history, 'pushState');
      clearDebugRoute();
      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/');
      pushStateSpy.mockRestore();
    });

    it('clears debug route preserving subpath', () => {
      const origPathname = window.location.pathname;
      try {
        window.history.pushState(null, '', '/kittysquared/debug/classic/20');
        const pushStateSpy = vi.spyOn(window.history, 'pushState');
        clearDebugRoute();
        expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/kittysquared/');
        pushStateSpy.mockRestore();
      } finally {
        window.history.pushState(null, '', origPathname);
      }
    });
  });
});
