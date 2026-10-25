import { describe, expect, it } from 'vitest';
import { areRegionsContiguous, findConflictingCats, getDirectEliminations, isBoardSolved } from '../../src/engine/rules';
import { CellState } from '../../src/types/puzzle';

const sample4x4Regions = [
  [0, 0, 1, 1],
  [0, 2, 1, 1],
  [2, 2, 3, 3],
  [2, 3, 3, 3],
];

describe('engine/rules', () => {
  it('detects row, column, region, and diagonal-adjacency conflicts', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('empty'));
    board[0][1] = 'cat';
    board[1][2] = 'cat'; // diagonal neighbor to (0,1)
    expect(findConflictingCats(board, sample4x4Regions)).toEqual(new Set(['0,1', '1,2']));
  });

  it('recognizes a valid 4x4 solution with 4 non-conflicting cats', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('empty'));
    // Valid 4x4 placement: (0,1), (1,3), (2,0), (3,2)
    board[0][1] = 'cat';
    board[1][3] = 'cat';
    board[2][0] = 'cat';
    board[3][2] = 'cat';
    expect(findConflictingCats(board, sample4x4Regions).size).toBe(0);
    expect(isBoardSolved(board, sample4x4Regions)).toBe(true);
  });

  it('returns all cells in same row, col, region, and 8 neighbors for getDirectEliminations', () => {
    const elim = getDirectEliminations(4, sample4x4Regions, 0, 1);
    const keys = new Set(elim.map((c) => `${c.row},${c.col}`));
    expect(keys.has('0,1')).toBe(false);
    expect(keys.has('0,0')).toBe(true); // same row & region
    expect(keys.has('1,0')).toBe(true); // same region & diagonal
    expect(keys.has('1,2')).toBe(true); // diagonal neighbor
    expect(keys.has('3,1')).toBe(true); // same col
  });

  it('validates orthogonal contiguity of regions and rejects split islands', () => {
    expect(areRegionsContiguous(sample4x4Regions)).toBe(true);
    const disconnected = [
      [0, 1, 0, 1],
      [1, 1, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];
    expect(areRegionsContiguous(disconnected)).toBe(false);
  });
});
