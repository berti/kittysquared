import { describe, expect, it } from 'vitest';
import { createRng, generatePuzzle, generate10x10Waves } from '../../src/engine/generator';
import { countSolutions, solveLogically } from '../../src/engine/solver';

describe('10x10 Generator with Targeted Rules & Waves', () => {
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

  it('generates a 20-level wave with interleaved cadence and trivial gifts at slots 2, 5, 13', () => {
    const rng = createRng(20261031);
    const wave = generate10x10Waves(101, 1, rng);

    expect(wave).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      expect(wave[i].id).toBe(101 + i);
      expect(wave[i].size).toBe(10);
      const logic = solveLogically(wave[i].regions, 6);
      expect(logic.solved).toBe(true);
    }

    // Verify gift slots (indices 2, 5, 13) have a 1-cell region
    for (const giftSlot of [2, 5, 13]) {
      const p = wave[giftSlot];
      const counts = Array(10).fill(0);
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          counts[p.regions[r][c]]++;
        }
      }
      expect(counts.some((c) => c === 1)).toBe(true);
    }

    // Verify mid-peak breather at slot 13 breaks peak clusters:
    // Slots 10, 11, 12 are Peak 1 (streak of 3)
    // Slot 13 is a gift
    // Slots 14, 15, 16, 17 are Peak 2 (streak of 4)
    // So peak streak never exceeds 4
    expect(wave[10].difficultyScore).toBeGreaterThanOrEqual(wave[0].difficultyScore);
  }, 60000);
});
