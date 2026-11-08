export type CellState = 'empty' | 'cross' | 'cat';

export type CatVariant =
  | 'black'
  | 'white'
  | 'orange'
  | 'siamese'
  | 'calico'
  | 'tuxedo'
  | 'russian'
  | 'sakura';

export interface CatBreedDef {
  id: CatVariant;
  name: string;
  requiredStars: number;
}

export type RegionAssistMode = 'off' | 'textures' | 'glyphs' | 'numbers';

export type AutoCrossMode = 'off' | 'row_col_surround' | 'all';

export type CatAnimState = 'idle' | 'placed' | 'conflict' | 'victory';

export interface CellCoord {
  row: number;
  col: number;
}

export interface SavedBoardSnapshot {
  levelId: number;
  board: CellState[][];
  lockedCats: boolean[][];
  errorCrosses?: boolean[][];
  mistakes: number;
  partialScore: number;
}

export interface DailyPuzzleResult {
  date: string; // 'YYYY-MM-DD'
  stars: 1 | 2 | 3;
  mistakes: number;
  timeSeconds: number;
  completedAt: string; // ISO 8601
}

export interface DailyProgress {
  lastPlayedDate: string | null; // 'YYYY-MM-DD'
  currentStreak: number;
  maxStreak: number;
  history: Record<string, DailyPuzzleResult>; // Keyed by 'YYYY-MM-DD'
  activeSnapshot: SavedBoardSnapshot | null;
  activeSnapshotDate: string | null;
}

export interface PuzzleDef {
  id: number;
  size: number;
  regions: number[][];
  solution: number[]; // solution[row] = col of cat in that row
  maxRuleUsed: number;
  difficultyScore: number;
}
