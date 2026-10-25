import { CellCoord, CellState } from '../types/puzzle';

export function findConflictingCats(board: CellState[][], regions: number[][]): Set<string> {
  const size = board.length;
  const conflicts = new Set<string>();
  const catCoords: CellCoord[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 'cat') {
        catCoords.push({ row: r, col: c });
      }
    }
  }

  for (let i = 0; i < catCoords.length; i++) {
    for (let j = i + 1; j < catCoords.length; j++) {
      const a = catCoords[i];
      const b = catCoords[j];

      const sameRow = a.row === b.row;
      const sameCol = a.col === b.col;
      const sameRegion = regions[a.row][a.col] === regions[b.row][b.col];
      const isNeighbor = Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;

      if (sameRow || sameCol || sameRegion || isNeighbor) {
        conflicts.add(`${a.row},${a.col}`);
        conflicts.add(`${b.row},${b.col}`);
      }
    }
  }

  return conflicts;
}

export function isBoardSolved(board: CellState[][], regions: number[][]): boolean {
  const size = board.length;
  let catCount = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 'cat') {
        catCount++;
      }
    }
  }

  if (catCount !== size) {
    return false;
  }

  const conflicts = findConflictingCats(board, regions);
  return conflicts.size === 0;
}

export function getDirectEliminations(size: number, regions: number[][], row: number, col: number): CellCoord[] {
  const eliminated: CellCoord[] = [];
  const targetRegion = regions[row][col];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === row && c === col) continue;

      const sameRow = r === row;
      const sameCol = c === col;
      const sameRegion = regions[r][c] === targetRegion;
      const isNeighbor = Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1;

      if (sameRow || sameCol || sameRegion || isNeighbor) {
        eliminated.push({ row: r, col: c });
      }
    }
  }

  return eliminated;
}

export function areRegionsContiguous(regions: number[][]): boolean {
  const size = regions.length;
  const regionCells: Map<number, CellCoord[]> = new Map();

  for (let r = 0; r < size; r++) {
    if (regions[r].length !== size) return false;
    for (let c = 0; c < size; c++) {
      const regId = regions[r][c];
      if (!regionCells.has(regId)) {
        regionCells.set(regId, []);
      }
      regionCells.get(regId)!.push({ row: r, col: c });
    }
  }

  // Must have exactly `size` regions (0 to size-1)
  if (regionCells.size !== size) return false;
  for (let i = 0; i < size; i++) {
    if (!regionCells.has(i)) return false;
  }

  // Verify orthogonal connectivity for each region via BFS
  for (const [_, cells] of regionCells) {
    if (cells.length === 0) return false;

    const visited = new Set<string>();
    const queue: CellCoord[] = [cells[0]];
    visited.add(`${cells[0].row},${cells[0].col}`);

    const cellSet = new Set<string>(cells.map((c) => `${c.row},${c.col}`));

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors: [number, number][] = [
        [curr.row - 1, curr.col],
        [curr.row + 1, curr.col],
        [curr.row, curr.col - 1],
        [curr.row, curr.col + 1],
      ];

      for (const [nr, nc] of neighbors) {
        const key = `${nr},${nc}`;
        if (cellSet.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push({ row: nr, col: nc });
        }
      }
    }

    if (visited.size !== cells.length) {
      return false;
    }
  }

  return true;
}
