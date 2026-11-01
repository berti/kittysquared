import { describe, expect, it } from 'vitest';
import puzzles from '../../src/data/puzzles.json';
import { countSolutions, solveLogically } from '../../src/engine/solver';

describe('Puzzles Dataset Validation (1-300)', () => {
  it('contains exactly 300 puzzles with consecutive IDs 1 to 300', () => {
    expect(puzzles).toHaveLength(300);
    puzzles.forEach((p, index) => {
      expect(p.id).toBe(index + 1);
    });
  });

  it('keeps existing levels 1 to 100 with their original board sizes', () => {
    // 5x5: 1-15, 6x6: 16-40, 7x7: 41-65, 8x8: 66-85, 9x9: 86-100
    for (let id = 1; id <= 15; id++) {
      expect(puzzles[id - 1].size).toBe(5);
    }
    for (let id = 16; id <= 40; id++) {
      expect(puzzles[id - 1].size).toBe(6);
    }
    for (let id = 41; id <= 65; id++) {
      expect(puzzles[id - 1].size).toBe(7);
    }
    for (let id = 66; id <= 85; id++) {
      expect(puzzles[id - 1].size).toBe(8);
    }
    for (let id = 86; id <= 100; id++) {
      expect(puzzles[id - 1].size).toBe(9);
    }
  });

  it('ensures all new levels 101 to 300 are size 10', () => {
    for (let id = 101; id <= 300; id++) {
      expect(puzzles[id - 1].size).toBe(10);
      expect(puzzles[id - 1].regions).toHaveLength(10);
      expect(puzzles[id - 1].regions[0]).toHaveLength(10);
    }
  });

  it('ensures wave pacing: 3 gifts per wave and max 4 consecutive peaks', () => {
    const newPuzzles = puzzles.slice(100);
    expect(newPuzzles).toHaveLength(200);

    for (let w = 0; w < 10; w++) {
      const wave = newPuzzles.slice(w * 20, (w + 1) * 20);
      // Slots 2, 5, 13 must have a 1-cell region (gift)
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

      // Check max consecutive Rule 6 (peak) levels <= 4
      let consecutivePeaks = 0;
      for (const p of wave) {
        if (p.maxRuleUsed >= 6) {
          consecutivePeaks++;
          expect(consecutivePeaks).toBeLessThanOrEqual(4);
        } else {
          consecutivePeaks = 0;
        }
      }
    }
  });

  it('ensures all 300 puzzles are uniquely solvable and logically solvable without guessing', () => {
    for (const p of puzzles) {
      // 1. Unique solution check
      const sol = countSolutions(p.regions, 2);
      expect(sol.count).toBe(1);

      // 2. Logical solver check (all levels 1..300 solvable up to Rule 6)
      const logic = solveLogically(p.regions, 6);
      expect(logic.solved).toBe(true);
    }
  }, 120000);
});
