import { AutoCrossMode, CellState, PuzzleDef, SavedBoardSnapshot } from '../types/puzzle';
import { isBoardSolved } from '../engine/rules';
import { ModeProgress, StarRating } from './storage';

export function getStarsForMistakes(mistakes: number): StarRating {
  if (mistakes <= 0) return 3;
  if (mistakes === 1) return 2;
  return 1;
}

export function getBonusForStars(stars: StarRating): number {
  if (stars === 3) return 50;
  if (stars === 2) return 30;
  return 10;
}

export interface LevelWinOutcome {
  isReplay: boolean;
  earnedStars: StarRating;
  bestStars: StarRating;
  scoreGain: number;
  nextCurrentLevelId: number;
}

export function computeLevelWinOutcome(
  session: LevelSessionState,
  progress: ModeProgress
): LevelWinOutcome {
  const levelId = session.puzzle.id;
  const prevStars = progress.levelStars?.[levelId];
  const isReplay = levelId < progress.currentLevelId || prevStars !== undefined;
  const earnedStars = getStarsForMistakes(session.mistakes);

  if (isReplay) {
    const baselineStars: StarRating = prevStars ?? 1;
    const bestStars = (Math.max(baselineStars, earnedStars) as StarRating);
    const scoreGain = Math.max(
      0,
      getBonusForStars(earnedStars) - getBonusForStars(baselineStars)
    );
    return {
      isReplay: true,
      earnedStars,
      bestStars,
      scoreGain,
      nextCurrentLevelId: progress.currentLevelId,
    };
  }

  return {
    isReplay: false,
    earnedStars,
    bestStars: earnedStars,
    scoreGain: session.partialScore + session.levelBonus,
    nextCurrentLevelId: levelId + 1,
  };
}

export interface LevelSessionState {
  puzzle: PuzzleDef;
  board: CellState[][];
  lockedCats: boolean[][];
  errorCrosses: boolean[][];
  mistakes: number;
  maxMistakes: number;
  partialScore: number;
  levelBonus: number;
  status: 'playing' | 'won' | 'lost';
  conflictingKeys: Set<string>;
  lastErrorCell: { row: number; col: number } | null;
  lastPlacedCat: { row: number; col: number } | null;
  lastAutoCrossCells?: { row: number; col: number }[];
  history: { board: CellState[][]; lockedCats: boolean[][] }[];
}

export function createLevelSession(puzzle: PuzzleDef): LevelSessionState {
  const size = puzzle.size;
  return {
    puzzle,
    board: Array.from({ length: size }, () => Array(size).fill('empty')),
    lockedCats: Array.from({ length: size }, () => Array(size).fill(false)),
    errorCrosses: Array.from({ length: size }, () => Array(size).fill(false)),
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

export function restoreLevelSession(
  puzzle: PuzzleDef,
  snapshot?: SavedBoardSnapshot | null
): LevelSessionState {
  const session = createLevelSession(puzzle);
  if (snapshot && snapshot.levelId === puzzle.id) {
    session.board = snapshot.board.map((row) => [...row]);
    session.lockedCats = snapshot.lockedCats.map((row) => [...row]);
    if (snapshot.errorCrosses) {
      session.errorCrosses = snapshot.errorCrosses.map((row) => [...row]);
    }
    session.mistakes = snapshot.mistakes;
    session.partialScore = snapshot.partialScore;
  }
  return session;
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
  options?: { isDoubleTap?: boolean; autoCross?: AutoCrossMode }
): LevelSessionState {
  if (state.status !== 'playing') return state;

  // If this cell is locked (cat or error cross), tap does nothing
  if (state.lockedCats[row][col] || state.errorCrosses?.[row][col]) {
    return state;
  }

  const current = state.board[row][col];
  let nextState: CellState = current;

  // Double-tap mode:
  // If it's a confirmed double-tap (within timeout on the same cell):
  // placing cat or toggling off cat
  if (options?.isDoubleTap) {
    nextState = current === 'cat' ? 'empty' : 'cat';
  } else {
    // Single tap: toggle cross (empty -> cross, cross -> empty, cat -> cross)
    nextState = current === 'cross' ? 'empty' : 'cross';
  }

  // Handle Classic Mode validation when placing a cat
  if (nextState === 'cat') {
    const isCorrect = state.puzzle.solution[row] === col;
    if (!isCorrect) {
      const nextMistakes = state.mistakes + 1;
      const isLost = nextMistakes >= state.maxMistakes;
      const cleanBoard = cloneBoard(state.board);
      cleanBoard[row][col] = 'cross'; // automatically add red cross on mistake
      const newErrorCrosses = cloneLocked(state.errorCrosses);
      newErrorCrosses[row][col] = true;

      return {
        ...state,
        board: cleanBoard,
        errorCrosses: newErrorCrosses,
        mistakes: nextMistakes,
        status: isLost ? 'lost' : 'playing',
        partialScore: isLost ? 0 : state.partialScore,
        lastErrorCell: { row, col },
        lastPlacedCat: null,
        lastAutoCrossCells: undefined,
      };
    } else {
      // Correct cat placement
      const newBoard = cloneBoard(state.board);
      const newLocked = cloneLocked(state.lockedCats);
      newBoard[row][col] = 'cat';
      newLocked[row][col] = true;

      let lastAutoCrossCells: { row: number; col: number }[] | undefined = undefined;
      const autoCross = options?.autoCross ?? 'off';
      if (autoCross !== 'off') {
        const size = state.puzzle.size;
        const targetRegion = state.puzzle.regions[row][col];
        const addedCrosses: { row: number; col: number }[] = [];

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (r === row && c === col) continue;

            const sameRow = r === row;
            const sameCol = c === col;
            const isNeighbor = Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1;
            const sameRegion = autoCross === 'all' && state.puzzle.regions[r][c] === targetRegion;

            if (sameRow || sameCol || isNeighbor || sameRegion) {
              if (newBoard[r][c] === 'empty') {
                newBoard[r][c] = 'cross';
                addedCrosses.push({ row: r, col: c });
              }
            }
          }
        }

        if (addedCrosses.length > 0) {
          lastAutoCrossCells = addedCrosses;
        }
      }

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
        lastAutoCrossCells,
        // Do not allow undoing locked cats
        history: [],
      };
    }
  }

  // Non-cat changes (toggling cross)
  const newBoard = cloneBoard(state.board);
  newBoard[row][col] = nextState;

  return {
    ...state,
    board: newBoard,
    conflictingKeys: new Set(),
    lastErrorCell: null,
    lastPlacedCat: null,
    lastAutoCrossCells: undefined,
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

  // Never overwrite or erase a cell that contains a cat or locked cell (including error cross)
  if (
    state.board[row][col] === 'cat' ||
    state.lockedCats[row][col] ||
    state.errorCrosses?.[row][col]
  ) {
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
    lastAutoCrossCells: undefined,
    history: [...state.history, { board: cloneBoard(state.board), lockedCats: cloneLocked(state.lockedCats) }],
  };
}

export function undoMove(state: LevelSessionState): LevelSessionState {
  if (state.status !== 'playing' || state.history.length === 0) {
    return state;
  }

  const prev = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);
  const restoredBoard = cloneBoard(prev.board);

  // Preserve errorCrosses on restored board
  if (state.errorCrosses) {
    for (let r = 0; r < state.puzzle.size; r++) {
      for (let c = 0; c < state.puzzle.size; c++) {
        if (state.errorCrosses[r][c]) {
          restoredBoard[r][c] = 'cross';
        }
      }
    }
  }

  return {
    ...state,
    board: restoredBoard,
    lockedCats: prev.lockedCats,
    conflictingKeys: new Set(),
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
      if (newBoard[r][c] === 'cross' && (!state.errorCrosses || !state.errorCrosses[r][c])) {
        newBoard[r][c] = 'empty';
      }
    }
  }

  return {
    ...state,
    board: newBoard,
    history: [...state.history, { board: cloneBoard(state.board), lockedCats: cloneLocked(state.lockedCats) }],
    conflictingKeys: new Set(),
  };
}
