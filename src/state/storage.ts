import { AutoCrossMode, CatVariant, CellState, RegionAssistMode } from '../types/puzzle';

export interface SavedBoardSnapshot {
  levelId: number;
  board: CellState[][];
  lockedCats: boolean[][];
  errorCrosses?: boolean[][];
  mistakes: number;
  partialScore: number;
}

export interface ModeProgress {
  currentLevelId: number;
  totalScore: number;
  activeSnapshot: SavedBoardSnapshot | null;
}

export type SteppedVolume = 0 | 0.25 | 0.5 | 0.75 | 1.0;
export type MusicTrackOption =
  | 'auto'
  | 'marimba'
  | 'velvet'
  | 'sunbeam'
  | 'bossa'
  | 'waltz'
  | 'samba';

export interface AppSettings {
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  autoCross: AutoCrossMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
  musicVolume: SteppedVolume;
  sfxVolume: SteppedVolume;
  musicTrack: MusicTrackOption;
}

export interface PersistedAppState {
  progress: ModeProgress;
  settings: AppSettings;
}

const STORAGE_KEY = 'kittysquared_state_v1';

export const VALID_STEPPED_VOLUMES: SteppedVolume[] = [0, 0.25, 0.5, 0.75, 1.0];
export const VALID_MUSIC_TRACKS: MusicTrackOption[] = [
  'auto',
  'marimba',
  'velvet',
  'sunbeam',
  'bossa',
  'waltz',
  'samba',
];

export const VALID_REGION_ASSIST_MODES: RegionAssistMode[] = [
  'off',
  'textures',
  'glyphs',
  'numbers',
];

export const VALID_AUTO_CROSS_MODES: AutoCrossMode[] = [
  'off',
  'row_col_surround',
  'all',
];

export function getDefaultAppState(): PersistedAppState {
  return {
    progress: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
    },
    settings: {
      doubleTapTimeoutMs: 500,
      catVariant: 'black',
      regionAssist: 'off',
      autoCross: 'off',
      musicMuted: false,
      sfxMuted: false,
      tutorialSeen: false,
      musicVolume: 0.75,
      sfxVolume: 0.75,
      musicTrack: 'auto',
    },
  };
}

export function loadPersistedState(): PersistedAppState {
  const defaults = getDefaultAppState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const rawSettings = parsed.settings || {};
    const { controlScheme: _legacyControlScheme, ...cleanRawSettings } = rawSettings;
    const rawTimeout = cleanRawSettings.doubleTapTimeoutMs;
    const doubleTapTimeoutMs =
      typeof rawTimeout === 'number' && !isNaN(rawTimeout)
        ? Math.max(250, Math.min(900, rawTimeout))
        : 500;

    const rawProgress = parsed.progress || parsed.classic || parsed.chill || {};

    return {
      progress: {
        ...defaults.progress,
        ...rawProgress,
      },
      settings: {
        ...defaults.settings,
        ...cleanRawSettings,
        doubleTapTimeoutMs,
        regionAssist: VALID_REGION_ASSIST_MODES.includes(cleanRawSettings.regionAssist)
          ? cleanRawSettings.regionAssist
          : 'off',
        autoCross: VALID_AUTO_CROSS_MODES.includes(cleanRawSettings.autoCross)
          ? cleanRawSettings.autoCross
          : 'off',
        musicVolume: VALID_STEPPED_VOLUMES.includes(cleanRawSettings.musicVolume)
          ? cleanRawSettings.musicVolume
          : 0.75,
        sfxVolume: VALID_STEPPED_VOLUMES.includes(cleanRawSettings.sfxVolume)
          ? cleanRawSettings.sfxVolume
          : 0.75,
        musicTrack: VALID_MUSIC_TRACKS.includes(cleanRawSettings.musicTrack)
          ? cleanRawSettings.musicTrack
          : 'auto',
      },
    };
  } catch (_e) {
    return defaults;
  }
}

export function savePersistedState(state: PersistedAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_e) {
    // Ignore storage quota errors
  }
}

export function resetProgress(state: PersistedAppState): PersistedAppState {
  const next: PersistedAppState = {
    ...state,
    progress: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
    },
  };
  savePersistedState(next);
  return next;
}
