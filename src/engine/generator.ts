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

export interface GeneratePuzzleOptions {
  minRuleRequired?: number;
  giftSingleton?: boolean;
}

export function generatePuzzle(
  id: number,
  size: number,
  maxAllowedRule: number,
  rng: () => number,
  _minRulePreferred: number = 1,
  options?: GeneratePuzzleOptions
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

    const useSmallCap = size >= 10 || options?.giftSingleton;
    const smallReg = useSmallCap ? Math.floor(rng() * size) : -1;
    const smallCap = options?.giftSingleton ? 1 : 1 + Math.floor(rng() * 3);
    let smallCells = 1;

    for (let r = 0; r < size; r++) {
      const c = catPlacement[r];
      regions[r][c] = r;
      if (r !== smallReg || smallCap > 1) {
        front.push({ r, c, reg: r });
      }
    }

    let unassigned = size * size - size;
    while (unassigned > 0 && front.length > 0) {
      const idx = Math.floor(rng() * front.length);
      const cell = front[idx];
      if (cell.reg === smallReg && smallCells >= smallCap) {
        front.splice(idx, 1);
        continue;
      }

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
        if (cell.reg === smallReg) {
          smallCells++;
        }
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

    // 5. Check minimum rule constraint if specified
    if (options?.minRuleRequired && logic.maxRuleUsed < options.minRuleRequired) {
      continue;
    }

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

export function generate10x10Waves(
  startId: number = 101,
  waveCount: number = 10,
  rng: () => number,
  onWaveComplete?: (waveIndex: number, wavePuzzles: PuzzleDef[]) => void
): PuzzleDef[] {
  const result: PuzzleDef[] = [];

  for (let w = 0; w < waveCount; w++) {
    const waveStartId = startId + w * 20;

    // 1. Generate 3 gifts for slots 2, 5, 13 (maxAllowedRule: 5 so gifts are true breathers, never Rule 6)
    const gifts: PuzzleDef[] = [];
    for (let g = 0; g < 3; g++) {
      gifts.push(generatePuzzle(0, 10, 5, rng, 1, { giftSingleton: true }));
    }

    // 2. Generate 17 standard 10x10 puzzles
    const standards: PuzzleDef[] = [];
    for (let s = 0; s < 17; s++) {
      standards.push(generatePuzzle(0, 10, 6, rng, 1));
    }

    // 3. Sort standards by difficultyScore
    standards.sort((a, b) => a.difficultyScore - b.difficultyScore);

    // 10 moderate (warm-up, ramp-up, cooldown)
    const moderate = standards.slice(0, 10);
    // 7 peak challenges
    const peaks = standards.slice(10);

    // 4. Assemble the wave according to the target rhythm:
    // Slots 0, 1: Moderate warm-up
    // Slot 2: Gift 1
    // Slots 3, 4: Moderate warm-up
    // Slot 5: Gift 2
    // Slots 6, 7, 8, 9: Moderate ramp-up
    // Slots 10, 11, 12: Peak Cluster 1 (3 levels)
    // Slot 13: Mid-Peak Breather / Gift 3 (Breaks consecutive peak streak)
    // Slots 14, 15, 16, 17: Peak Cluster 2 (4 levels)
    // Slots 18, 19: Moderate cooldown
    const wavePuzzles: PuzzleDef[] = [
      moderate[0],
      moderate[1],
      gifts[0],
      moderate[2],
      moderate[3],
      gifts[1],
      moderate[4],
      moderate[5],
      moderate[6],
      moderate[7],
      peaks[0],
      peaks[1],
      peaks[2],
      gifts[2],
      peaks[3],
      peaks[4],
      peaks[5],
      peaks[6],
      moderate[8],
      moderate[9],
    ];

    // Ensure no consecutive streak of Rule 6 peaks exceeds 4
    let consecutivePeaks = 0;
    for (let i = 0; i < 20; i++) {
      if (wavePuzzles[i].maxRuleUsed >= 6) {
        consecutivePeaks++;
        if (consecutivePeaks > 4) {
          // Find an earlier moderate slot that has maxRuleUsed < 6 and swap
          for (let j = 0; j < i - 4; j++) {
            if (wavePuzzles[j].maxRuleUsed < 6 && j !== 2 && j !== 5 && j !== 13) {
              const temp = wavePuzzles[i];
              wavePuzzles[i] = wavePuzzles[j];
              wavePuzzles[j] = temp;
              break;
            }
          }
          consecutivePeaks = 1;
        }
      } else {
        consecutivePeaks = 0;
      }
    }

    for (let slot = 0; slot < 20; slot++) {
      wavePuzzles[slot].id = waveStartId + slot;
      result.push(wavePuzzles[slot]);
    }

    if (onWaveComplete) {
      onWaveComplete(w, wavePuzzles);
    }
  }

  return result;
}

export function generateAll300Puzzles(
  seed: number = 20261025,
  onWaveComplete?: (waveIndex: number, wavePuzzles: PuzzleDef[]) => void
): PuzzleDef[] {
  const existing100 = generateAll100Puzzles(seed);
  const rng10x10 = createRng(seed + 100);
  const new200 = generate10x10Waves(101, 10, rng10x10, onWaveComplete);
  return [...existing100, ...new200];
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
