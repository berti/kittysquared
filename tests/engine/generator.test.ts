import { describe, expect, it } from 'vitest';
import { areRegionsContiguous } from '../../src/engine/rules';
import { countSolutions, solveLogically } from '../../src/engine/solver';
import { createRng, generatePuzzle } from '../../src/engine/generator';
import puzzles from '../../src/data/puzzles.json';

describe('engine/generator & puzzles.json', () => {
  it('generated puzzle regions are strictly orthogonally contiguous and have a unique human-solvable solution', () => {
    const rng = createRng(42);
    const puzzle = generatePuzzle(1, 5, 3, rng);
    expect(puzzle.size).toBe(5);
    expect(areRegionsContiguous(puzzle.regions)).toBe(true);
    expect(countSolutions(puzzle.regions, 2).count).toBe(1);
    expect(solveLogically(puzzle.regions, 3).solved).toBe(true);
  });

  it('validates all 300 pre-generated puzzles in src/data/puzzles.json match the spec tier distribution and uniqueness', () => {
    expect(puzzles).toHaveLength(300);
    expect(puzzles[0].size).toBe(5);
    expect(puzzles[14].size).toBe(5);
    expect(puzzles[15].size).toBe(6);
    expect(puzzles[39].size).toBe(6);
    expect(puzzles[40].size).toBe(7);
    expect(puzzles[64].size).toBe(7);
    expect(puzzles[65].size).toBe(8);
    expect(puzzles[84].size).toBe(8);
    expect(puzzles[85].size).toBe(9);
    expect(puzzles[99].size).toBe(9);
    expect(puzzles[100].size).toBe(10);
    expect(puzzles[299].size).toBe(10);

    for (const p of puzzles) {
      expect(areRegionsContiguous(p.regions)).toBe(true);
      const exact = countSolutions(p.regions, 2);
      expect(exact.count).toBe(1);
      expect(exact.firstSolution).toEqual(p.solution);
    }
  });
});
