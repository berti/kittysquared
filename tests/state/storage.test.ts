// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDefaultAppState,
  loadPersistedState,
  resetModeProgress,
  savePersistedState,
} from '../../src/state/storage';

describe('state/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads independent progress for Chill Out and Classic modes', () => {
    const state = getDefaultAppState();
    state.chill.currentLevelId = 14;
    state.classic.currentLevelId = 8;
    state.classic.totalScore = 640;
    state.settings.catVariant = 'white';
    savePersistedState(state);

    const loaded = loadPersistedState();
    expect(loaded.chill.currentLevelId).toBe(14);
    expect(loaded.classic.currentLevelId).toBe(8);
    expect(loaded.classic.totalScore).toBe(640);
    expect(loaded.settings.catVariant).toBe('white');
  });

  it('resets only the requested mode progress back to level 1 and 0 points', () => {
    const state = getDefaultAppState();
    state.chill.currentLevelId = 10;
    state.classic.currentLevelId = 5;
    state.classic.totalScore = 320;
    const afterReset = resetModeProgress(state, 'classic');
    expect(afterReset.classic.currentLevelId).toBe(1);
    expect(afterReset.classic.totalScore).toBe(0);
    expect(afterReset.classic.activeSnapshot).toBeNull();
    expect(afterReset.chill.currentLevelId).toBe(10);
  });

  it('Review Focus #5: loadPersistedState falls back to defaults when localStorage contains malformed JSON', () => {
    localStorage.setItem('kittysquared_state_v1', '{broken-json');
    const loaded = loadPersistedState();
    expect(loaded).toEqual(getDefaultAppState());
  });

  it('initializes and persists regionAssist setting with default "off"', () => {
    const state = getDefaultAppState();
    expect(state.settings.regionAssist).toBe('off');

    state.settings.regionAssist = 'textures';
    savePersistedState(state);

    const loaded = loadPersistedState();
    expect(loaded.settings.regionAssist).toBe('textures');
  });

  it('Review Focus #1: loadPersistedState defaults regionAssist to "off" if missing in older save files', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        settings: {
          controlScheme: 'toggle',
          catVariant: 'black',
          musicMuted: false,
          sfxMuted: false,
          tutorialSeen: true,
        },
      })
    );
    const loaded = loadPersistedState();
    expect(loaded.settings.regionAssist).toBe('off');
  });

  it('Review Focus #1: loadPersistedState falls back to "off" when regionAssist is an invalid corrupted string', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        settings: {
          regionAssist: 'invalid_corrupted_value',
        },
      })
    );
    const loaded = loadPersistedState();
    expect(loaded.settings.regionAssist).toBe('off');
  });

  it('migrates older state by adding default doubleTapTimeoutMs (500)', () => {
    const legacyState = {
      chill: { currentLevelId: 2, totalScore: 0, activeSnapshot: null },
      classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
      settings: {
        controlScheme: 'double-tap',
        catVariant: 'black',
        regionAssist: 'off',
        musicMuted: false,
        sfxMuted: false,
        tutorialSeen: true,
      },
    };
    localStorage.setItem('kittysquared_state_v1', JSON.stringify(legacyState));
    const loaded = loadPersistedState();
    expect(loaded.settings.doubleTapTimeoutMs).toBe(500);
  });

  it('clamps out-of-range doubleTapTimeoutMs between 250 and 900', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        settings: { doubleTapTimeoutMs: 50000 },
      })
    );
    expect(loadPersistedState().settings.doubleTapTimeoutMs).toBe(900);

    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        settings: { doubleTapTimeoutMs: -100 },
      })
    );
    expect(loadPersistedState().settings.doubleTapTimeoutMs).toBe(250);
  });
});
