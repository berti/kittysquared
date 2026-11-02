import { describe, expect, it } from 'vitest';
import {
  applyCellTap,
  applyDragCross,
  clearCrosses,
  computeLevelWinOutcome,
  createLevelSession,
  getBonusForStars,
  getStarsForMistakes,
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

  describe('autoCross assist', () => {
    it('does not place auto-crosses when autoCross is "off" or unspecified', () => {
      let s = createLevelSession(samplePuzzle);
      s = applyCellTap(s, 0, 1, { isDoubleTap: true, autoCross: 'off' });
      expect(s.board[0][1]).toBe('cat');
      // Empty cells remain empty
      expect(s.board[0][0]).toBe('empty');
      expect(s.board[0][2]).toBe('empty');
      expect(s.lastAutoCrossCells).toBeUndefined();
    });

    it('places crosses in row, column, and surround when autoCross is "row_col_surround"', () => {
      let s = createLevelSession(samplePuzzle);
      // Place correct cat at (0,1)
      s = applyCellTap(s, 0, 1, { isDoubleTap: true, autoCross: 'row_col_surround' });
      expect(s.board[0][1]).toBe('cat');

      // Row 0 cells
      expect(s.board[0][0]).toBe('cross');
      expect(s.board[0][2]).toBe('cross');
      expect(s.board[0][3]).toBe('cross');

      // Col 1 cells
      expect(s.board[1][1]).toBe('cross');
      expect(s.board[2][1]).toBe('cross');
      expect(s.board[3][1]).toBe('cross');

      // Surround cells (1,0) and (1,2)
      expect(s.board[1][0]).toBe('cross');
      expect(s.board[1][2]).toBe('cross');

      // Cell (1,3) is another cat's solution and not in row 0, col 1, or surround -> remains empty
      expect(s.board[1][3]).toBe('empty');
      // Cell (2,0) remains empty
      expect(s.board[2][0]).toBe('empty');

      // Verify lastAutoCrossCells contains all auto-crossed coordinates
      expect(s.lastAutoCrossCells).toBeDefined();
      expect(s.lastAutoCrossCells?.length).toBe(8);
      expect(s.lastAutoCrossCells).toEqual(
        expect.arrayContaining([
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 2, col: 1 },
          { row: 3, col: 1 },
        ])
      );
    });

    it('places crosses in row, column, surround, AND region cells when autoCross is "all"', () => {
      // Create a 5x5 puzzle where a region has a distant cell
      const customPuzzle: PuzzleDef = {
        id: 99,
        size: 5,
        regions: [
          [0, 1, 1, 1, 1],
          [2, 2, 2, 2, 2],
          [3, 3, 3, 3, 3],
          [4, 4, 4, 4, 4],
          [4, 4, 4, 4, 0], // (4,4) is in region 0, same as (0,0)
        ],
        solution: [0, 1, 2, 3, 4],
        maxRuleUsed: 1,
        difficultyScore: 5,
      };

      let s = createLevelSession(customPuzzle);
      // Place correct cat at (0,0)
      s = applyCellTap(s, 0, 0, { isDoubleTap: true, autoCross: 'all' });
      expect(s.board[0][0]).toBe('cat');
      // (4,4) is not in row 0, col 0, or surround, but IS in region 0 -> must be crossed
      expect(s.board[4][4]).toBe('cross');
      expect(s.lastAutoCrossCells).toEqual(
        expect.arrayContaining([{ row: 4, col: 4 }])
      );
    });

    it('does not trigger auto-cross when placing an incorrect cat (mistake)', () => {
      let s = createLevelSession(samplePuzzle);
      // (0,0) is incorrect
      s = applyCellTap(s, 0, 0, { isDoubleTap: true, autoCross: 'all' });
      expect(s.mistakes).toBe(1);
      expect(s.board[0][0]).toBe('cross');
      // Other cells in row/col/region remain empty
      expect(s.board[0][1]).toBe('empty');
      expect(s.board[0][2]).toBe('empty');
      expect(s.lastAutoCrossCells).toBeUndefined();
    });

    it('preserves existing crosses and locked cats untouched during auto-cross', () => {
      let s = createLevelSession(samplePuzzle);
      // User placed cross manually at (0,2)
      s = applyCellTap(s, 0, 2);
      expect(s.board[0][2]).toBe('cross');

      // Now place correct cat at (0,1) with autoCross
      s = applyCellTap(s, 0, 1, { isDoubleTap: true, autoCross: 'row_col_surround' });
      expect(s.board[0][1]).toBe('cat');
      expect(s.board[0][2]).toBe('cross');
      // (0,2) was already cross, so it shouldn't be in lastAutoCrossCells (newly added crosses)
      expect(s.lastAutoCrossCells).not.toEqual(
        expect.arrayContaining([{ row: 0, col: 2 }])
      );
    });

    it('Review Focus #3: resolves victory on the exact turn the final cat is placed with autoCross', () => {
      let s = createLevelSession(samplePuzzle);
      // Place first 3 cats
      s = applyCellTap(s, 0, 1, { isDoubleTap: true, autoCross: 'all' });
      s = applyCellTap(s, 1, 3, { isDoubleTap: true, autoCross: 'all' });
      s = applyCellTap(s, 2, 0, { isDoubleTap: true, autoCross: 'all' });
      expect(s.status).toBe('playing');

      // Place 4th (final) cat at (3,2)
      s = applyCellTap(s, 3, 2, { isDoubleTap: true, autoCross: 'all' });
      expect(s.status).toBe('won');
      expect(s.partialScore).toBe(40);
      expect(s.levelBonus).toBe(50);
      expect(s.board.flat().filter((c) => c === 'cat')).toHaveLength(4);
      expect(s.board.flat().filter((c) => c === 'cross')).toHaveLength(12);
    });
  });

  describe('star ratings and replay scoring', () => {
    it('maps mistakes to stars (0->3, 1->2, 2->1) and stars to bonus (3->50, 2->30, 1->10)', () => {
      expect(getStarsForMistakes(0)).toBe(3);
      expect(getStarsForMistakes(1)).toBe(2);
      expect(getStarsForMistakes(2)).toBe(1);
      expect(getBonusForStars(3)).toBe(50);
      expect(getBonusForStars(2)).toBe(30);
      expect(getBonusForStars(1)).toBe(10);
    });

    it('computeLevelWinOutcome awards full cat + bonus points and advances currentLevelId on first-time frontier clear', () => {
      let s = createLevelSession(samplePuzzle);
      s = applyCellTap(s, 0, 0, { isDoubleTap: true }); // 1 mistake -> 2 stars (+30)
      s = applyCellTap(s, 0, 1, { isDoubleTap: true });
      s = applyCellTap(s, 1, 3, { isDoubleTap: true });
      s = applyCellTap(s, 2, 0, { isDoubleTap: true });
      s = applyCellTap(s, 3, 2, { isDoubleTap: true });

      const outcome = computeLevelWinOutcome(s, {
        currentLevelId: 1,
        totalScore: 100,
        activeSnapshot: null,
        levelStars: {},
      });

      expect(outcome).toEqual({
        isReplay: false,
        earnedStars: 2,
        bestStars: 2,
        scoreGain: 70, // 40 partial + 30 bonus
        nextCurrentLevelId: 2,
      });
    });

    it('Review Focus #2: computeLevelWinOutcome on replay only awards positive bonus delta and never downgrades bestStars', () => {
      let s = createLevelSession(samplePuzzle);
      // 0 mistakes -> 3 stars (+50)
      s = applyCellTap(s, 0, 1, { isDoubleTap: true });
      s = applyCellTap(s, 1, 3, { isDoubleTap: true });
      s = applyCellTap(s, 2, 0, { isDoubleTap: true });
      s = applyCellTap(s, 3, 2, { isDoubleTap: true });

      // Improving from 1 star (+10) to 3 stars (+50) awards +40 and keeps currentLevelId at 5
      const improved = computeLevelWinOutcome(s, {
        currentLevelId: 5,
        totalScore: 400,
        activeSnapshot: null,
        levelStars: { 1: 1 },
      });
      expect(improved).toEqual({
        isReplay: true,
        earnedStars: 3,
        bestStars: 3,
        scoreGain: 40,
        nextCurrentLevelId: 5,
      });

      // Replaying with 2 mistakes (1 star) when already holding 3 stars -> 0 gain, keeps 3 stars
      let worseSession = createLevelSession(samplePuzzle);
      worseSession = applyCellTap(worseSession, 0, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 1, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 0, 1, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 1, 3, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 2, 0, { isDoubleTap: true });
      worseSession = applyCellTap(worseSession, 3, 2, { isDoubleTap: true });

      const worse = computeLevelWinOutcome(worseSession, {
        currentLevelId: 5,
        totalScore: 440,
        activeSnapshot: null,
        levelStars: { 1: 3 },
      });
      expect(worse).toEqual({
        isReplay: true,
        earnedStars: 1,
        bestStars: 3,
        scoreGain: 0,
        nextCurrentLevelId: 5,
      });
    });
  });
});
