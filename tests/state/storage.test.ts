// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDefaultAppState,
  loadPersistedState,
  resetProgress,
  savePersistedState,
} from '../../src/state/storage';

describe('state/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads progress', () => {
    const state = getDefaultAppState();
    state.progress.currentLevelId = 8;
    state.progress.totalScore = 640;
    state.settings.catVariant = 'white';
    savePersistedState(state);

    const loaded = loadPersistedState();
    expect(loaded.progress.currentLevelId).toBe(8);
    expect(loaded.progress.totalScore).toBe(640);
    expect(loaded.settings.catVariant).toBe('white');
  });

  it('provides default musicVolume (0.75), sfxVolume (0.75), and musicTrack ("auto") in default state', () => {
    const state = getDefaultAppState();
    expect(state.settings.musicVolume).toBe(0.75);
    expect(state.settings.sfxVolume).toBe(0.75);
    expect(state.settings.musicTrack).toBe('auto');
  });

  it('migrates legacy save format missing volume and track fields with robust defaults', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 3, totalScore: 100, activeSnapshot: null },
        settings: {
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: false,
          sfxMuted: false,
          tutorialSeen: true,
        },
      })
    );
    const loaded = loadPersistedState();
    expect(loaded.settings.musicVolume).toBe(0.75);
    expect(loaded.settings.sfxVolume).toBe(0.75);
    expect(loaded.settings.musicTrack).toBe('auto');
  });

  it('persists and reloads custom volume and track preferences', () => {
    const state = getDefaultAppState();
    state.settings.musicVolume = 0.5;
    state.settings.sfxVolume = 1.0;
    state.settings.musicTrack = 'bossa';
    savePersistedState(state);

    const loaded = loadPersistedState();
    expect(loaded.settings.musicVolume).toBe(0.5);
    expect(loaded.settings.sfxVolume).toBe(1.0);
    expect(loaded.settings.musicTrack).toBe('bossa');
  });

  it('persists all 6 warm soundtrack IDs and falls back to "auto" for unknown track IDs', () => {
    for (const track of ['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba'] as const) {
      const state = getDefaultAppState();
      state.settings.musicTrack = track;
      savePersistedState(state);
      expect(loadPersistedState().settings.musicTrack).toBe(track);
    }

    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({ settings: { musicTrack: 'removed_track_id' } })
    );
    expect(loadPersistedState().settings.musicTrack).toBe('auto');
  });

  it('resets progress back to level 1 and 0 points while preserving settings', () => {
    const state = getDefaultAppState();
    state.progress.currentLevelId = 5;
    state.progress.totalScore = 320;
    state.settings.catVariant = 'white';
    const afterReset = resetProgress(state);
    expect(afterReset.progress.currentLevelId).toBe(1);
    expect(afterReset.progress.totalScore).toBe(0);
    expect(afterReset.progress.activeSnapshot).toBeNull();
    expect(afterReset.settings.catVariant).toBe('white');
  });

  it('migrates legacy save format with classic progress to unified progress', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        classic: { currentLevelId: 42, totalScore: 1200, activeSnapshot: null },
        chill: { currentLevelId: 5, totalScore: 0, activeSnapshot: null },
      })
    );
    const loaded = loadPersistedState();
    expect(loaded.progress.currentLevelId).toBe(42);
    expect(loaded.progress.totalScore).toBe(1200);
  });

  it('migrates legacy save format with only chill progress if classic is missing', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 15, totalScore: 0, activeSnapshot: null },
      })
    );
    const loaded = loadPersistedState();
    expect(loaded.progress.currentLevelId).toBe(15);
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

  it('Review Focus #1: loadPersistedState strips legacy controlScheme cleanly and does not include it in AppSettings', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        settings: {
          controlScheme: 'toggle',
          catVariant: 'white',
        },
      })
    );
    const loaded = loadPersistedState();
    expect((loaded.settings as any).controlScheme).toBeUndefined();
    expect(loaded.settings.catVariant).toBe('white');

    const defaultState = getDefaultAppState();
    expect((defaultState.settings as any).controlScheme).toBeUndefined();
  });
});
