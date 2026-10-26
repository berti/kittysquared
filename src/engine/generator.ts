import { PuzzleDef } from '../types/puzzle';
import { areRegionsContiguous } from './rules';
import { countSolutions, solveLogically } from './solver';

export interface LevelTierSpec {
  startId: number;
  count: number;
  size: number;
  maxAllowedRule: number;
  minRulePreferred: number;
}

export const LEVEL_TIERS: LevelTierSpec[] = [
  { startId: 1, count: 15, size: 5, maxAllowedRule: 3, minRulePreferred: 1 },
  { startId: 16, count: 25, size: 6, maxAllowedRule: 4, minRulePreferred: 2 },
  { startId: 41, count: 25, size: 7, maxAllowedRule: 5, minRulePreferred: 3 },
  { startId: 66, count: 20, size: 8, maxAllowedRule: 6, minRulePreferred: 4 },
  { startId: 86, count: 15, size: 9, maxAllowedRule: 6, minRulePreferred: 5 },
];

export function createRng(seed: number): () => number {
  let s = seed;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePuzzle(
  id: number,
  size: number,
  maxAllowedRule: number,
  rng: () => number,
  _minRulePreferred: number = 1
): PuzzleDef {
  while (true) {
    // 1. Backtracking search to pick a random valid placement of `size` non-adjacent cats
    const cols = Array.from({ length: size }, (_, i) => i);
    const catPlacement: number[] = [];

    function findCatPlacement(row: number): boolean {
      if (row === size) return true;

      // Shuffle available cols
      const shuffled = [...cols].sort(() => rng() - 0.5);
      for (const c of shuffled) {
        if (catPlacement.includes(c)) continue;
        if (row > 0 && Math.abs(catPlacement[row - 1] - c) <= 1) continue;

        catPlacement.push(c);
        if (findCatPlacement(row + 1)) return true;
        catPlacement.pop();
      }
      return false;
    }

    if (!findCatPlacement(0)) continue;

    // 2. Grow contiguous regions around each cat
    const regions: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
    const front: { r: number; c: number; reg: number }[] = [];

    for (let r = 0; r < size; r++) {
      const c = catPlacement[r];
      regions[r][c] = r;
      front.push({ r, c, reg: r });
    }

    let unassigned = size * size - size;
    while (unassigned > 0 && front.length > 0) {
      const idx = Math.floor(rng() * front.length);
      const cell = front[idx];
      const neighbors = [
        [cell.r - 1, cell.c],
        [cell.r + 1, cell.c],
        [cell.r, cell.c - 1],
        [cell.r, cell.c + 1],
      ];
      const validNbrs = neighbors.filter(
        ([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1
      );

      if (validNbrs.length === 0) {
        front.splice(idx, 1);
      } else {
        const [nr, nc] = validNbrs[Math.floor(rng() * validNbrs.length)];
        regions[nr][nc] = cell.reg;
        front.push({ r: nr, c: nc, reg: cell.reg });
        unassigned--;
      }
    }

    if (unassigned !== 0 || !areRegionsContiguous(regions)) continue;

    // 3. Check uniqueness
    const exact = countSolutions(regions, 2);
    if (exact.count !== 1) continue;

    // 4. Check human solvability
    const logic = solveLogically(regions, maxAllowedRule);
    if (!logic.solved) continue;

    return {
      id,
      size,
      regions,
      solution: exact.firstSolution!,
      maxRuleUsed: logic.maxRuleUsed,
      difficultyScore: logic.difficultyScore,
    };
  }
}

export function generateAll100Puzzles(seed: number = 20261025): PuzzleDef[] {
  const rng = createRng(seed);
  const allPuzzles: PuzzleDef[] = [];

  for (const tier of LEVEL_TIERS) {
    const tierPuzzles: PuzzleDef[] = [];
    for (let i = 0; i < tier.count; i++) {
      const p = generatePuzzle(tier.startId + i, tier.size, tier.maxAllowedRule, rng, tier.minRulePreferred);
      tierPuzzles.push(p);
    }
    // Sort tier puzzles by difficultyScore
    tierPuzzles.sort((a, b) => a.difficultyScore - b.difficultyScore);
    for (let i = 0; i < tierPuzzles.length; i++) {
      tierPuzzles[i].id = tier.startId + i;
      allPuzzles.push(tierPuzzles[i]);
    }
  }

  return allPuzzles;
}
