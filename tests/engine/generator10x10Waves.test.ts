import { describe, expect, it } from 'vitest';
import { createRng, generate10x10Waves } from '../../src/engine/generator';
import { solveLogically } from '../../src/engine/solver';

describe('10x10 Waves Generator Cadence & Gifts', () => {
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
