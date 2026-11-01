import { CatVariant, CellState, RegionAssistMode } from '../types/puzzle';

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

export interface AppSettings {
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
}

export interface PersistedAppState {
  progress: ModeProgress;
  settings: AppSettings;
}

const STORAGE_KEY = 'kittysquared_state_v1';

export const VALID_REGION_ASSIST_MODES: RegionAssistMode[] = [
  'off',
  'textures',
  'glyphs',
  'numbers',
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
      musicMuted: false,
      sfxMuted: false,
      tutorialSeen: false,
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
