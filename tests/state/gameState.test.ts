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
  it('awards 10 partial points per valid cat, penalizes mistakes, and loses on 3rd mistake', () => {
    let s = createLevelSession(samplePuzzle);
    // Valid cat at (0,1)
    s = applyCellTap(s, 0, 1, { isDoubleTap: true });
    expect(s.board[0][1]).toBe('cat');
    expect(s.lockedCats[0][1]).toBe(true);
    expect(s.partialScore).toBe(10);

    // 3 wrong cat placements -> lost on 3rd mistake, partialScore reset to 0
    s = applyCellTap(s, 0, 0, { isDoubleTap: true });
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');
    s = applyCellTap(s, 1, 0, { isDoubleTap: true });
    expect(s.mistakes).toBe(2);
    expect(s.status).toBe('playing');
    s = applyCellTap(s, 2, 2, { isDoubleTap: true });
    expect(s.mistakes).toBe(3);
    expect(s.status).toBe('lost');
    expect(s.partialScore).toBe(0);
  });

  it('calculates completion bonus (+50 for 0 mistakes, +30 for 1, +10 for 2) and wins when solved', () => {
    let s = createLevelSession(samplePuzzle);
    s = applyCellTap(s, 0, 0, { isDoubleTap: true }); // 1 mistake
    s = applyCellTap(s, 0, 1, { isDoubleTap: true });
    s = applyCellTap(s, 1, 3, { isDoubleTap: true });
    s = applyCellTap(s, 2, 0, { isDoubleTap: true });
    s = applyCellTap(s, 3, 2, { isDoubleTap: true });
    expect(s.status).toBe('won');
    expect(s.partialScore).toBe(40);
    expect(s.levelBonus).toBe(30);
  });

  it('Review Focus #1: applyDragCross ignores cells that already contain a cat', () => {
    let s = createLevelSession(samplePuzzle);
    s = applyCellTap(s, 0, 1, { isDoubleTap: true });
    s = applyDragCross(s, 0, 1, 'cross');
    expect(s.board[0][1]).toBe('cat');
    s = applyDragCross(s, 0, 2, 'cross');
    expect(s.board[0][2]).toBe('cross');
  });

  it('Review Focus #2: locks validated cats against tap, clearCrosses, and undoMove', () => {
    let s = createLevelSession(samplePuzzle);
    s = applyCellTap(s, 0, 1, { isDoubleTap: true }); // valid, locked
    s = applyCellTap(s, 0, 2); // single tap = cross
    s = applyCellTap(s, 0, 1, { isDoubleTap: true }); // attempt to remove locked cat
    expect(s.board[0][1]).toBe('cat');
    s = clearCrosses(s);
    expect(s.board[0][2]).toBe('empty');
    expect(s.board[0][1]).toBe('cat');
    s = undoMove(s); // undoes clearCrosses
    s = undoMove(s); // undoes cross at (0,2)
    s = undoMove(s); // cannot undo locked cat
    expect(s.board[0][1]).toBe('cat');
  });

  it('toggles cross on single tap without triggering cat validation, and places cat on double tap', () => {
    let s = createLevelSession(samplePuzzle);
    // (0,0) is a wrong cat position, but single tap only places a cross
    s = applyCellTap(s, 0, 0, { isDoubleTap: false });
    expect(s.board[0][0]).toBe('cross');
    expect(s.mistakes).toBe(0);

    // Second single tap on (0,0) toggles cross back to empty
    s = applyCellTap(s, 0, 0, { isDoubleTap: false });
    expect(s.board[0][0]).toBe('empty');

    // Double tap on (0,0) attempts to place a cat -> triggers mistake and adds cross
    s = applyCellTap(s, 0, 0, { isDoubleTap: true });
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');

    // Double tap on valid position (0,1) places locked cat
    s = applyCellTap(s, 0, 1, { isDoubleTap: true });
    expect(s.board[0][1]).toBe('cat');
    expect(s.lockedCats[0][1]).toBe(true);
    expect(s.partialScore).toBe(10);
  });

  it('adds locked red cross on wrong cat guess, immune to taps, drag, clearCrosses, and undo', () => {
    let s = createLevelSession(samplePuzzle);
    // Place wrong cat at (0,0) with double tap
    s = applyCellTap(s, 0, 0, { isDoubleTap: true });
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('cross');
    expect(s.errorCrosses[0][0]).toBe(true);

    // Tapping again (single or double) does not alter the error cross
    s = applyCellTap(s, 0, 0);
    expect(s.board[0][0]).toBe('cross');
    s = applyCellTap(s, 0, 0, { isDoubleTap: true });
    expect(s.board[0][0]).toBe('cross');

    // Dragging cross over it does not alter it
    s = applyDragCross(s, 0, 0, 'empty');
    expect(s.board[0][0]).toBe('cross');

    // clearCrosses clears normal crosses but keeps error cross
    s = applyCellTap(s, 0, 2);
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
});
