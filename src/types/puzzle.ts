export type CellState = 'empty' | 'cross' | 'cat';

export type CatVariant = 'black' | 'white';

export type RegionAssistMode = 'off' | 'textures' | 'glyphs' | 'numbers';

export type CatAnimState = 'idle' | 'placed' | 'conflict' | 'victory';

export interface CellCoord {
  row: number;
  col: number;
}

export interface PuzzleDef {
  id: number;
  size: number;
  regions: number[][];
  solution: number[]; // solution[row] = col of cat in that row
  maxRuleUsed: number;
  difficultyScore: number;
}
