import { CatVariant, CellState, ControlScheme, GameMode, RegionAssistMode } from '../types/puzzle';

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
  controlScheme: ControlScheme;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
}

export interface PersistedAppState {
  chill: ModeProgress;
  classic: ModeProgress;
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
    chill: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
    },
    classic: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
    },
    settings: {
      controlScheme: 'toggle',
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
    const rawTimeout = rawSettings.doubleTapTimeoutMs;
    const doubleTapTimeoutMs =
      typeof rawTimeout === 'number' && !isNaN(rawTimeout)
        ? Math.max(250, Math.min(900, rawTimeout))
        : 500;

    return {
      chill: {
        ...defaults.chill,
        ...(parsed.chill || {}),
      },
      classic: {
        ...defaults.classic,
        ...(parsed.classic || {}),
      },
      settings: {
        ...defaults.settings,
        ...rawSettings,
        doubleTapTimeoutMs,
        regionAssist: VALID_REGION_ASSIST_MODES.includes(rawSettings.regionAssist)
          ? rawSettings.regionAssist
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

export function resetModeProgress(state: PersistedAppState, mode: GameMode): PersistedAppState {
  const next: PersistedAppState = {
    ...state,
    [mode]: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
    },
  };
  savePersistedState(next);
  return next;
}
