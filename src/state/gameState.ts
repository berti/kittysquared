import { CellState, ControlScheme, GameMode, PuzzleDef } from '../types/puzzle';
import { findConflictingCats, isBoardSolved } from '../engine/rules';

export interface LevelSessionState {
  puzzle: PuzzleDef;
  mode: GameMode;
  board: CellState[][];
  lockedCats: boolean[][];
  mistakes: number;
  maxMistakes: number;
  partialScore: number;
  levelBonus: number;
  status: 'playing' | 'won' | 'lost';
  conflictingKeys: Set<string>;
  lastErrorCell: { row: number; col: number } | null;
  lastPlacedCat: { row: number; col: number } | null;
  history: { board: CellState[][]; lockedCats: boolean[][] }[];
}

export function createLevelSession(puzzle: PuzzleDef, mode: GameMode): LevelSessionState {
  const size = puzzle.size;
  return {
    puzzle,
    mode,
    board: Array.from({ length: size }, () => Array(size).fill('empty')),
    lockedCats: Array.from({ length: size }, () => Array(size).fill(false)),
    mistakes: 0,
    maxMistakes: 3,
    partialScore: 0,
    levelBonus: 0,
    status: 'playing',
    conflictingKeys: new Set(),
    lastErrorCell: null,
    lastPlacedCat: null,
    history: [],
  };
}

function cloneBoard(board: CellState[][]): CellState[][] {
  return board.map((row) => [...row]);
}

function cloneLocked(locked: boolean[][]): boolean[][] {
  return locked.map((row) => [...row]);
}

export function applyCellTap(
  state: LevelSessionState,
  row: number,
  col: number,
  scheme: ControlScheme,
  activeTool: 'cross' | 'cat'
): LevelSessionState {
  if (state.status !== 'playing') return state;

  // If in classic mode and this cat is already locked, tap does nothing
  if (state.mode === 'classic' && state.lockedCats[row][col]) {
    return state;
  }

  const current = state.board[row][col];
  let nextState: CellState = current;

  if (scheme === 'toggle') {
    if (activeTool === 'cross') {
      nextState = current === 'cross' ? 'empty' : 'cross';
    } else {
      nextState = current === 'cat' ? 'empty' : 'cat';
    }
  } else {
    // double-tap mode: empty -> cross -> cat -> empty
    if (current === 'empty') nextState = 'cross';
    else if (current === 'cross') nextState = 'cat';
    else nextState = 'empty';
  }

  // Handle Classic Mode validation when placing a cat
  if (state.mode === 'classic' && nextState === 'cat') {
    const isCorrect = state.puzzle.solution[row] === col;
    if (!isCorrect) {
      const nextMistakes = state.mistakes + 1;
      const isLost = nextMistakes >= state.maxMistakes;
      const cleanBoard = cloneBoard(state.board);
      cleanBoard[row][col] = 'empty'; // cell stays empty on mistake

      return {
        ...state,
        board: cleanBoard,
        mistakes: nextMistakes,
        status: isLost ? 'lost' : 'playing',
        partialScore: isLost ? 0 : state.partialScore,
        lastErrorCell: { row, col },
        lastPlacedCat: null,
      };
    } else {
      // Correct cat placement in Classic
      const newBoard = cloneBoard(state.board);
      const newLocked = cloneLocked(state.lockedCats);
      newBoard[row][col] = 'cat';
      newLocked[row][col] = true;

      const solved = isBoardSolved(newBoard, state.puzzle.regions);
      let bonus = 0;
      if (solved) {
        if (state.mistakes === 0) bonus = 50;
        else if (state.mistakes === 1) bonus = 30;
        else if (state.mistakes === 2) bonus = 10;
      }

      return {
        ...state,
        board: newBoard,
        lockedCats: newLocked,
        partialScore: state.partialScore + 10,
        levelBonus: bonus,
        status: solved ? 'won' : 'playing',
        conflictingKeys: new Set(),
        lastErrorCell: null,
        lastPlacedCat: { row, col },
        // Do not allow undoing locked cats
        history: [],
      };
    }
  }

  // Chill out mode or non-cat changes in Classic
  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = nextState;

  const conflicts = findConflictingCats(newBoard, state.puzzle.regions);
  const solved = isBoardSolved(newBoard, state.puzzle.regions);

  return {
    ...state,
    board: newBoard,
    conflictingKeys: conflicts,
    status: solved ? 'won' : 'playing',
    lastErrorCell: null,
    lastPlacedCat: nextState === 'cat' ? { row, col } : null,
    history: [...state.history, { board: cloneBoard(state.board), lockedCats: cloneLocked(state.lockedCats) }],
  };
}

export function applyDragCross(
  state: LevelSessionState,
  row: number,
  col: number,
  targetCrossState: 'cross' | 'empty'
): LevelSessionState {
  if (state.status !== 'playing') return state;

  // Never overwrite or erase a cell that contains a cat
  if (state.board[row][col] === 'cat' || state.lockedCats[row][col]) {
    return state;
  }

  if (state.board[row][col] === targetCrossState) {
    return state;
  }

  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = targetCrossState;

  return {
    ...state,
    board: newBoard,
    history: [...state.history, { board: cloneBoard(state.board), lockedCats: cloneLocked(state.lockedCats) }],
  };
}

export function undoMove(state: LevelSessionState): LevelSessionState {
  if (state.status !== 'playing' || state.history.length === 0) {
    return state;
  }

  const prev = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);
  const conflicts = findConflictingCats(prev.board, state.puzzle.regions);

  return {
    ...state,
    board: prev.board,
    lockedCats: prev.lockedCats,
    conflictingKeys: conflicts,
    history: newHistory,
    lastErrorCell: null,
  };
}

export function clearCrosses(state: LevelSessionState): LevelSessionState {
  if (state.status !== 'playing') return state;

  const size = state.puzzle.size;
  const newBoard = cloneBoard(state.board);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (newBoard[r][c] === 'cross') {
        newBoard[r][c] = 'empty';
      }
    }
  }

  return {
    ...state,
    board: newBoard,
    history: [...state.history, { board: cloneBoard(state.board), lockedCats: cloneLocked(state.lockedCats) }],
    conflictingKeys: findConflictingCats(newBoard, state.puzzle.regions),
  };
}
