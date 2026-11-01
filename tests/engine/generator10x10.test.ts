import { describe, expect, it } from 'vitest';
import { createRng, generatePuzzle } from '../../src/engine/generator';
import { countSolutions, solveLogically } from '../../src/engine/solver';

describe('10x10 Generator with Targeted Rules & Gifts', () => {
  it('generates a 10x10 puzzle with minRuleRequired = 6 that solves uniquely and uses Rule 6', () => {
    const rng = createRng(42);
    const puzzle = generatePuzzle(101, 10, 6, rng, 6, { minRuleRequired: 6 });

    expect(puzzle.size).toBe(10);
    expect(puzzle.maxRuleUsed).toBe(6);

    // Verify unique solution
    const count = countSolutions(puzzle.regions, 2);
    expect(count.count).toBe(1);

    // Verify logical solvability
    const logic = solveLogically(puzzle.regions, 6);
    expect(logic.solved).toBe(true);
    expect(logic.maxRuleUsed).toBe(6);
  }, 30000);

  it('generates a trivial gift puzzle when requested with a 1-cell starting region', () => {
    const rng = createRng(99);
    const puzzle = generatePuzzle(102, 10, 6, rng, 1, { giftSingleton: true });

    expect(puzzle.size).toBe(10);
    // Find at least one region with size === 1
    const regionCounts = Array(10).fill(0);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        regionCounts[puzzle.regions[r][c]]++;
      }
    }
    expect(regionCounts.some((count) => count === 1)).toBe(true);
  }, 20000);
});
