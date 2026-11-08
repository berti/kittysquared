import { describe, it, expect } from 'vitest';
import dailyPuzzlesData from '../../src/data/dailyPuzzles.json';
import { getDailyPuzzleForDate, getDailyPuzzleIndex } from '../../src/engine/daily';
import { areRegionsContiguous } from '../../src/engine/rules';
import { countSolutions, solveLogically } from '../../src/engine/solver';
import { PuzzleDef } from '../../src/types/puzzle';

describe('Daily Puzzles Bank Validation', { timeout: 180000 }, () => {
  describe('getDailyPuzzleForDate', () => {
    it('returns a deterministic puzzle for a given date string', () => {
      const puzzle1 = getDailyPuzzleForDate('2026-11-08');
      const puzzle2 = getDailyPuzzleForDate('2026-11-08');

      expect(puzzle1.id).toBe(puzzle2.id);
      expect(puzzle1.size).toBe(10);
      expect(puzzle2.size).toBe(10);
      expect(puzzle1.solution).toEqual(puzzle2.solution);
      expect(puzzle1.regions).toEqual(puzzle2.regions);
    });

    it('assigns unique virtual ID formatted as 10000 + (year % 100) * 1000 + index', () => {
      const dateStr = '2026-11-08';
      const index = getDailyPuzzleIndex(dateStr, dailyPuzzlesData.length);
      const expectedVirtualId = 10000 + (2026 % 100) * 1000 + index;

      const puzzle = getDailyPuzzleForDate(dateStr);
      expect(puzzle.id).toBe(expectedVirtualId);
    });

    it('returns independent object copies preventing mutation of base bank', () => {
      const dateStr = '2026-05-15';
      const puzzle = getDailyPuzzleForDate(dateStr);
      const originalVal = puzzle.regions[0][0];

      puzzle.regions[0][0] = 999;
      const freshPuzzle = getDailyPuzzleForDate(dateStr);
      expect(freshPuzzle.regions[0][0]).toBe(originalVal);
    });

    it('returns valid distinct puzzles for consecutive days', () => {
      const p1 = getDailyPuzzleForDate('2026-11-08');
      const p2 = getDailyPuzzleForDate('2026-11-09');

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('365 Daily Puzzle Bank Integrity', () => {
    it('contains exactly 365 pre-generated puzzles', () => {
      expect(dailyPuzzlesData.length).toBe(365);
    });

    it('has sequential IDs from 1001 to 1365', () => {
      dailyPuzzlesData.forEach((p, idx) => {
        expect(p.id).toBe(1001 + idx);
      });
    });

    it('validates all 365 puzzles: size 10, contiguous regions, unique solution, and human solvability (Rules 4-6)', () => {
      for (const puzzle of dailyPuzzlesData as PuzzleDef[]) {
        expect(puzzle.size).toBe(10);
        expect(puzzle.regions.length).toBe(10);
        for (const row of puzzle.regions) {
          expect(row.length).toBe(10);
        }

        // 1. Orthogonal connectivity of regions
        expect(areRegionsContiguous(puzzle.regions)).toBe(true);

        // 2. Exactly one unique solution
        const exact = countSolutions(puzzle.regions, 2);
        expect(exact.count).toBe(1);
        expect(exact.firstSolution).toEqual(puzzle.solution);

        // 3. 100% Logically solvable using rules up to 6
        const logic = solveLogically(puzzle.regions, 6);
        expect(logic.solved).toBe(true);
        expect(logic.solution).toEqual(puzzle.solution);

        // 4. Hard difficulty verification: requires Rule 4, 5, or 6
        expect(puzzle.maxRuleUsed).toBeGreaterThanOrEqual(4);
        expect(puzzle.maxRuleUsed).toBeLessThanOrEqual(6);
      }
    });
  });
});
