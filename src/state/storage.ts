import { CatVariant, CellState, ControlScheme, GameMode } from '../types/puzzle';

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
  catVariant: CatVariant;
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
      catVariant: 'black',
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
        ...(parsed.settings || {}),
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
