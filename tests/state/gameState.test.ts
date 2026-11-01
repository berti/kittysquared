import { describe, expect, it } from 'vitest';
import {
  applyCellTap,
  applyDragCross,
  clearCrosses,
  createLevelSession,
  undoMove,
} from '../../src/state/gameState';
import { PuzzleDef } from '../../src/types/puzzle';

const samplePuzzle: PuzzleDef = {
  id: 1,
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [2, 3, 3, 3],
    [2, 2, 3, 3],
  ],
  solution: [1, 3, 0, 2],
  maxRuleUsed: 2,
  difficultyScore: 10,
};

describe('state/gameState', () => {
  it('Chill Out mode highlights conflicts without failing and wins when solved', () => {
    let s = createLevelSession(samplePuzzle, 'chill');
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // same row & neighbor
    expect(s.conflictingKeys.has('0,0')).toBe(true);
    expect(s.conflictingKeys.has('0,1')).toBe(true);
    expect(s.status).toBe('playing');

    // Remove (0,0) and place remaining valid cats: (1,3), (2,0), (3,2)
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    s = applyCellTap(s, 1, 3, 'toggle', 'cat');
    s = applyCellTap(s, 2, 0, 'toggle', 'cat');
    s = applyCellTap(s, 3, 2, 'toggle', 'cat');
    expect(s.status).toBe('won');
  });

  it('Classic mode awards 10 partial points per valid cat, penalizes mistakes, and loses on 3rd mistake', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    // Valid cat at (0,1)
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    expect(s.board[0][1]).toBe('cat');
    expect(s.lockedCats[0][1]).toBe(true);
    expect(s.partialScore).toBe(10);

    // 3 wrong cat placements -> lost on 3rd mistake, partialScore reset to 0
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');
    s = applyCellTap(s, 1, 0, 'toggle', 'cat');
    expect(s.mistakes).toBe(2);
    expect(s.status).toBe('playing');
    s = applyCellTap(s, 2, 2, 'toggle', 'cat');
    expect(s.mistakes).toBe(3);
    expect(s.status).toBe('lost');
    expect(s.partialScore).toBe(0);
  });

  it('Classic mode calculates completion bonus (+50 for 0 mistakes, +30 for 1, +10 for 2)', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    s = applyCellTap(s, 0, 0, 'toggle', 'cat'); // 1 mistake
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    s = applyCellTap(s, 1, 3, 'toggle', 'cat');
    s = applyCellTap(s, 2, 0, 'toggle', 'cat');
    s = applyCellTap(s, 3, 2, 'toggle', 'cat');
    expect(s.status).toBe('won');
    expect(s.partialScore).toBe(40);
    expect(s.levelBonus).toBe(30);
  });

  it('Review Focus #1: applyDragCross ignores cells that already contain a cat', () => {
    let s = createLevelSession(samplePuzzle, 'chill');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    s = applyDragCross(s, 0, 1, 'cross');
    expect(s.board[0][1]).toBe('cat');
    s = applyDragCross(s, 0, 2, 'cross');
    expect(s.board[0][2]).toBe('cross');
  });

  it('Review Focus #2: Classic mode locks validated cats against tap, clearCrosses, and undoMove', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // valid, locked
    s = applyCellTap(s, 0, 2, 'toggle', 'cross');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // attempt to remove locked cat
    expect(s.board[0][1]).toBe('cat');
    s = clearCrosses(s);
    expect(s.board[0][2]).toBe('empty');
    expect(s.board[0][1]).toBe('cat');
    s = undoMove(s); // undoes clearCrosses
    s = undoMove(s); // undoes cross at (0,2)
    s = undoMove(s); // cannot undo locked cat in Classic
    expect(s.board[0][1]).toBe('cat');
  });

  it('Review Focus #3: double-tap scheme places cross on single tap without triggering Classic cat validation, and places cat on double tap', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    // (0,0) is a wrong cat position, but single tap in double-tap mode only places a cross
    s = applyCellTap(s, 0, 0, 'double-tap', 'cat', { isDoubleTap: false });
    expect(s.board[0][0]).toBe('cross');
    expect(s.mistakes).toBe(0);

    // Double tap on (0,0) attempts to place a cat -> triggers Classic mistake and adds cross
    s = applyCellTap(s, 0, 0, 'double-tap', 'cat', { isDoubleTap: true });
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');

    // Double tap on valid position (0,1) places locked cat
    s = applyCellTap(s, 0, 1, 'double-tap', 'cat', { isDoubleTap: true });
    expect(s.board[0][1]).toBe('cat');
    expect(s.lockedCats[0][1]).toBe(true);
    expect(s.partialScore).toBe(10);
  });

  it('Classic mode adds locked red cross on wrong cat guess, immune to taps, drag, clearCrosses, and undo', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    // Place wrong cat at (0,0)
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');
    expect(s.errorCrosses[0][0]).toBe(true);

    // Tapping again does not alter the error cross
    s = applyCellTap(s, 0, 0, 'toggle', 'cross');
    expect(s.board[0][0]).toBe('cross');
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    expect(s.board[0][0]).toBe('cross');

    // Dragging cross over it does not alter it
    s = applyDragCross(s, 0, 0, 'empty');
    expect(s.board[0][0]).toBe('cross');

    // clearCrosses clears normal crosses but keeps error cross
    s = applyCellTap(s, 0, 2, 'toggle', 'cross');
    expect(s.board[0][2]).toBe('cross');
    s = clearCrosses(s);
    expect(s.board[0][2]).toBe('empty');
    expect(s.board[0][0]).toBe('cross');
    expect(s.errorCrosses[0][0]).toBe(true);

    // undoMove does not clear error cross
    s = undoMove(s);
    expect(s.board[0][0]).toBe('cross');
    expect(s.errorCrosses[0][0]).toBe(true);
  });

  it('debug mode in Classic auto-places crosses on valid cat placement, but normal mode does not', () => {
    // Normal classic mode
    let normalSession = createLevelSession(samplePuzzle, 'classic');
    normalSession = applyCellTap(normalSession, 0, 1, 'toggle', 'cat');
    // Row 0 has empty cells still empty in normal mode
    expect(normalSession.board[0][0]).toBe('empty');
    expect(normalSession.board[0][2]).toBe('empty');
    expect(normalSession.board[0][3]).toBe('empty');

    // Debug classic mode
    let debugSession = createLevelSession(samplePuzzle, 'classic', true);
    expect(debugSession.isDebug).toBe(true);

    debugSession = applyCellTap(debugSession, 0, 1, 'toggle', 'cat');
    expect(debugSession.board[0][1]).toBe('cat');
    // Row 0 cells (except cat at (0,1)) should now be cross
    expect(debugSession.board[0][0]).toBe('cross');
    expect(debugSession.board[0][2]).toBe('cross');
    expect(debugSession.board[0][3]).toBe('cross');

    // Column 1 cells should be cross
    expect(debugSession.board[1][1]).toBe('cross');
    expect(debugSession.board[2][1]).toBe('cross');
    expect(debugSession.board[3][1]).toBe('cross');

    // Region 0 cells should be cross: (0,0), (0,1)-cat, (1,0), (1,1), (1,2)
    expect(debugSession.board[1][0]).toBe('cross');
    expect(debugSession.board[1][2]).toBe('cross');

    // Diagonal/orthogonal neighbors should be cross
    expect(debugSession.board[1][2]).toBe('cross');
  });

  it('debug mode auto-cross preserves existing cats on the board', () => {
    let debugSession = createLevelSession(samplePuzzle, 'classic', true);
    // Place cat 1: (0, 1)
    debugSession = applyCellTap(debugSession, 0, 1, 'toggle', 'cat');
    expect(debugSession.board[0][1]).toBe('cat');

    // Place cat 2: (1, 3) (valid in solution: [1, 3, 0, 2])
    debugSession = applyCellTap(debugSession, 1, 3, 'toggle', 'cat');
    expect(debugSession.board[1][3]).toBe('cat');
    // Cat 1 at (0, 1) must remain cat
    expect(debugSession.board[0][1]).toBe('cat');
  });
});
