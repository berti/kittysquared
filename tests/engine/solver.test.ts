import { describe, expect, it } from 'vitest';
import { countSolutions, solveLogically } from '../../src/engine/solver';

describe('engine/solver', () => {
  it('counts unique vs multiple solutions accurately', () => {
    // 5x5 board with unique solution: [ 4, 1, 3, 0, 2 ]
    const uniqueRegions = [
      [1, 1, 1, 0, 0],
      [3, 1, 0, 0, 0],
      [3, 3, 3, 2, 0],
      [3, 3, 3, 3, 0],
      [3, 3, 4, 4, 4],
    ];
    const res = countSolutions(uniqueRegions, 2);
    expect(res.count).toBe(1);
    expect(res.firstSolution).toEqual([4, 1, 3, 0, 2]);

    // Symmetric 4x4 regions allowing both [1,3,0,2] and [2,0,3,1]
    const dualRegions = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];
    expect(countSolutions(dualRegions, 2).count).toBe(2);
  });

  it('solves a basic puzzle using only Rules 1-3', () => {
    const uniqueRegions = [
      [1, 1, 1, 0, 0],
      [3, 1, 0, 0, 0],
      [3, 3, 3, 2, 0],
      [3, 3, 3, 3, 0],
      [3, 3, 4, 4, 4],
    ];
    const logic = solveLogically(uniqueRegions, 3);
    expect(logic.solved).toBe(true);
    expect(logic.maxRuleUsed).toBeLessThanOrEqual(3);
    expect(logic.solution).toEqual([4, 1, 3, 0, 2]);
  });

  it('applies Rule 5 (K-subsets of regions/lines) and Rule 6 (1-step lookahead asphyxiation) when needed', () => {
    const regions5x5 = [
      [1, 1, 1, 0, 2],
      [1, 1, 1, 0, 2],
      [1, 1, 4, 2, 2],
      [3, 3, 4, 4, 2],
      [4, 4, 4, 4, 2],
    ];
    const exact = countSolutions(regions5x5, 2);
    expect(exact.count).toBe(1);
    const solved = solveLogically(regions5x5, 6);
    expect(solved.solved).toBe(true);
    expect(solved.solution).toEqual(exact.firstSolution);
  });
});
