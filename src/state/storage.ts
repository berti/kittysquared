import {
  ALL_CONCRETE_TRACKS,
  AutoCrossMode,
  CatBreedDef,
  CatVariant,
  ConcreteTrackId,
  DailyProgress,
  DailyPuzzleResult,
  Language,
  RegionAssistMode,
  SavedBoardSnapshot,
} from '../types/puzzle';
import { getTodayDateString } from '../engine/daily';

export { ALL_CONCRETE_TRACKS, type ConcreteTrackId };
export type { SavedBoardSnapshot };

export type StarRating = 1 | 2 | 3;

export interface ModeProgress {
  currentLevelId: number;
  totalScore: number;
  activeSnapshot: SavedBoardSnapshot | null;
  levelStars?: Record<number, StarRating>;
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
  language: Language;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  autoCross: AutoCrossMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
  musicVolume: SteppedVolume;
  sfxVolume: SteppedVolume;
  selectedTracks: ConcreteTrackId[];
  /** @deprecated Legacy single-track preference, use selectedTracks */
  musicTrack?: MusicTrackOption;
}

export interface PersistedAppState {
  progress: ModeProgress;
  settings: AppSettings;
  daily: DailyProgress;
}

export const DEFAULT_DAILY_PROGRESS: DailyProgress = {
  lastPlayedDate: null,
  currentStreak: 0,
  maxStreak: 0,
  history: {},
  activeSnapshot: null,
  activeSnapshotDate: null,
};

const STORAGE_KEY = 'kittysquared_state_v1';

export const VALID_LANGUAGES: readonly Language[] = ['auto', 'es', 'en'];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: 'auto',
  doubleTapTimeoutMs: 500,
  catVariant: 'black',
  regionAssist: 'off',
  autoCross: 'off',
  musicMuted: false,
  sfxMuted: false,
  tutorialSeen: false,
  musicVolume: 0.75,
  sfxVolume: 0.75,
  selectedTracks: [...ALL_CONCRETE_TRACKS],
  musicTrack: 'auto',
};

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
  'all',
];

export const CAT_BREEDS: readonly CatBreedDef[] = [
  { id: 'black', name: 'Gato Negro', requiredStars: 0 },
  { id: 'white', name: 'Gato Blanco', requiredStars: 0 },
  { id: 'orange', name: 'Naranjito', requiredStars: 25 },
  { id: 'siamese', name: 'Siamés', requiredStars: 60 },
  { id: 'calico', name: 'Calicó', requiredStars: 100 },
  { id: 'tuxedo', name: 'Esmoquin', requiredStars: 150 },
  { id: 'russian', name: 'Azul Ruso', requiredStars: 210 },
  { id: 'sakura', name: 'Sakura Mochi', requiredStars: 280 },
] as const;

export const VALID_CAT_VARIANTS: readonly CatVariant[] = CAT_BREEDS.map((b) => b.id);

export function getCatBreedDef(variant: CatVariant): CatBreedDef {
  return CAT_BREEDS.find((b) => b.id === variant) ?? CAT_BREEDS[0];
}

export function isCatBreedUnlocked(variant: CatVariant, totalStars: number): boolean {
  return totalStars >= getCatBreedDef(variant).requiredStars;
}

export function getNewlyUnlockedBreeds(
  beforeStars: number,
  afterStars: number
): CatBreedDef[] {
  if (afterStars <= beforeStars) return [];
  return CAT_BREEDS.filter(
    (b) => b.requiredStars > beforeStars && b.requiredStars <= afterStars
  );
}

export function getDefaultAppState(): PersistedAppState {
  return {
    progress: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
      levelStars: {},
    },
    settings: { ...DEFAULT_APP_SETTINGS },
    daily: { ...DEFAULT_DAILY_PROGRESS },
  };
}

export function getTotalEarnedStars(progress: ModeProgress): number {
  const starsMap = progress.levelStars || {};
  return Object.values(starsMap).reduce((sum, s) => sum + s, 0);
}

function sanitizeAndBackfillLevelStars(
  rawLevelStars: unknown,
  currentLevelId: number
): Record<number, StarRating> {
  const sanitized: Record<number, StarRating> = {};
  if (rawLevelStars && typeof rawLevelStars === 'object') {
    for (const [key, val] of Object.entries(rawLevelStars as Record<string, unknown>)) {
      const lvl = Number(key);
      if (
        Number.isInteger(lvl) &&
        lvl >= 1 &&
        lvl <= 300 &&
        (val === 1 || val === 2 || val === 3)
      ) {
        sanitized[lvl] = val;
      }
    }
  }

  const maxBackfill = Math.min(300, Math.max(0, currentLevelId - 1));
  for (let lvl = 1; lvl <= maxBackfill; lvl++) {
    if (sanitized[lvl] === undefined) {
      sanitized[lvl] = 1;
    }
  }

  return sanitized;
}

function sanitizeDailyProgress(rawDaily: unknown): DailyProgress {
  if (!rawDaily || typeof rawDaily !== 'object') {
    return { ...DEFAULT_DAILY_PROGRESS };
  }
  const raw = rawDaily as Record<string, unknown>;

  const lastPlayedDate =
    typeof raw.lastPlayedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastPlayedDate)
      ? raw.lastPlayedDate
      : null;

  const currentStreak =
    typeof raw.currentStreak === 'number' && Number.isFinite(raw.currentStreak) && raw.currentStreak >= 0
      ? Math.floor(raw.currentStreak)
      : 0;

  const maxStreak =
    typeof raw.maxStreak === 'number' && Number.isFinite(raw.maxStreak) && raw.maxStreak >= 0
      ? Math.floor(raw.maxStreak)
      : 0;

  const history: Record<string, DailyPuzzleResult> = {};
  if (raw.history && typeof raw.history === 'object') {
    for (const [key, val] of Object.entries(raw.history as Record<string, unknown>)) {
      if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>;
        if (
          typeof v.date === 'string' &&
          (v.stars === 1 || v.stars === 2 || v.stars === 3) &&
          typeof v.mistakes === 'number' &&
          typeof v.timeSeconds === 'number' &&
          typeof v.completedAt === 'string'
        ) {
          history[key] = {
            date: v.date,
            stars: v.stars as 1 | 2 | 3,
            mistakes: v.mistakes,
            timeSeconds: v.timeSeconds,
            completedAt: v.completedAt,
          };
        }
      }
    }
  }

  const todayStr = getTodayDateString();
  let activeSnapshot: SavedBoardSnapshot | null = null;
  let activeSnapshotDate: string | null = null;
  if (
    raw.activeSnapshot &&
    typeof raw.activeSnapshot === 'object' &&
    raw.activeSnapshotDate === todayStr
  ) {
    activeSnapshot = raw.activeSnapshot as SavedBoardSnapshot;
    activeSnapshotDate = todayStr;
  }

  return {
    lastPlayedDate,
    currentStreak,
    maxStreak,
    history,
    activeSnapshot,
    activeSnapshotDate,
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
    const mergedProgress = {
      ...defaults.progress,
      ...rawProgress,
    };
    const currentLevelId =
      typeof mergedProgress.currentLevelId === 'number' && mergedProgress.currentLevelId >= 1
        ? mergedProgress.currentLevelId
        : 1;

    const sanitizedProgress: ModeProgress = {
      ...mergedProgress,
      currentLevelId,
      levelStars: sanitizeAndBackfillLevelStars(rawProgress.levelStars, currentLevelId),
    };
    const totalStars = getTotalEarnedStars(sanitizedProgress);

    const rawCatVariant = cleanRawSettings.catVariant as CatVariant;
    const catVariant =
      VALID_CAT_VARIANTS.includes(rawCatVariant) && isCatBreedUnlocked(rawCatVariant, totalStars)
        ? rawCatVariant
        : 'black';

    const language: Language = VALID_LANGUAGES.includes(cleanRawSettings.language)
      ? cleanRawSettings.language
      : 'auto';

    let selectedTracks: ConcreteTrackId[] | null = null;
    if (Array.isArray(cleanRawSettings.selectedTracks)) {
      const valid = cleanRawSettings.selectedTracks.filter((t: unknown): t is ConcreteTrackId =>
        ALL_CONCRETE_TRACKS.includes(t as ConcreteTrackId)
      );
      if (valid.length > 0) {
        selectedTracks = valid;
      }
    }
    if (!selectedTracks) {
      if (cleanRawSettings.musicTrack === 'auto') {
        selectedTracks = [...ALL_CONCRETE_TRACKS];
      } else if (
        cleanRawSettings.musicTrack &&
        ALL_CONCRETE_TRACKS.includes(cleanRawSettings.musicTrack as ConcreteTrackId)
      ) {
        selectedTracks = [cleanRawSettings.musicTrack as ConcreteTrackId];
      } else {
        selectedTracks = [...ALL_CONCRETE_TRACKS];
      }
    }

    const rawAutoCross = cleanRawSettings.autoCross;
    const autoCross: AutoCrossMode =
      rawAutoCross === 'row_col_surround' || rawAutoCross === 'all'
        ? 'all'
        : 'off';

    const rawMusicTrack = cleanRawSettings.musicTrack;
    const musicTrack: MusicTrackOption = VALID_MUSIC_TRACKS.includes(rawMusicTrack)
      ? rawMusicTrack
      : selectedTracks.length === 1
        ? selectedTracks[0]
        : 'auto';

    return {
      progress: sanitizedProgress,
      settings: {
        ...defaults.settings,
        ...cleanRawSettings,
        language,
        catVariant,
        doubleTapTimeoutMs,
        regionAssist: VALID_REGION_ASSIST_MODES.includes(cleanRawSettings.regionAssist)
          ? cleanRawSettings.regionAssist
          : 'off',
        autoCross,
        musicVolume: VALID_STEPPED_VOLUMES.includes(cleanRawSettings.musicVolume)
          ? cleanRawSettings.musicVolume
          : 0.75,
        sfxVolume: VALID_STEPPED_VOLUMES.includes(cleanRawSettings.sfxVolume)
          ? cleanRawSettings.sfxVolume
          : 0.75,
        selectedTracks,
        musicTrack,
      },
      daily: sanitizeDailyProgress(parsed.daily),
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
  const nextCatVariant = isCatBreedUnlocked(state.settings.catVariant, 0)
    ? state.settings.catVariant
    : 'black';
  const next: PersistedAppState = {
    ...state,
    progress: {
      currentLevelId: 1,
      totalScore: 0,
      activeSnapshot: null,
      levelStars: {},
    },
    settings: {
      ...state.settings,
      catVariant: nextCatVariant,
    },
    daily: state.daily ? { ...state.daily } : { ...DEFAULT_DAILY_PROGRESS },
  };
  savePersistedState(next);
  return next;
}
