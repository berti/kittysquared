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
});
