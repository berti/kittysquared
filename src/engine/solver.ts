import { getDirectEliminations } from './rules';

export interface ExactSolveResult {
  count: number;
  firstSolution: number[] | null;
}

export interface HumanSolveResult {
  solved: boolean;
  maxRuleUsed: number;
  difficultyScore: number;
  steps: number;
  solution: number[] | null;
}

export function countSolutions(regions: number[][], maxLimit: number = 2): ExactSolveResult {
  const size = regions.length;
  let count = 0;
  let firstSolution: number[] | null = null;

  // colPlacement[row] = col
  const colPlacement: number[] = Array(size).fill(-1);
  const usedCols = Array(size).fill(false);
  const usedRegions = Array(size).fill(false);

  function backtrack(row: number): boolean {
    if (row === size) {
      count++;
      if (firstSolution === null) {
        firstSolution = [...colPlacement];
      }
      return count >= maxLimit;
    }

    for (let c = 0; c < size; c++) {
      if (usedCols[c]) continue;
      const reg = regions[row][c];
      if (usedRegions[reg]) continue;

      // Diagonal / 8-neighbor adjacency check with previous rows
      if (row > 0) {
        const prevCol = colPlacement[row - 1];
        if (Math.abs(prevCol - c) <= 1) continue;
      }

      // Valid placement at (row, c)
      colPlacement[row] = c;
      usedCols[c] = true;
      usedRegions[reg] = true;

      const stop = backtrack(row + 1);

      usedCols[c] = false;
      usedRegions[reg] = false;
      colPlacement[row] = -1;

      if (stop) return true;
    }

    return false;
  }

  backtrack(0);

  return {
    count,
    firstSolution,
  };
}

export function solveLogically(regions: number[][], maxAllowedRule: number = 6): HumanSolveResult {
  const size = regions.length;
  // 1 = candidate, 0 = eliminated, 2 = cat placed
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(1));
  const catInRow: (number | null)[] = Array(size).fill(null);

  let steps = 0;
  let maxRuleUsed = 0;
  let progress = true;

  function placeCat(r: number, c: number, rule: number) {
    grid[r][c] = 2;
    catInRow[r] = c;
    maxRuleUsed = Math.max(maxRuleUsed, rule);
    steps++;

    // Apply Rule 2 (Direct elimination)
    const elim = getDirectEliminations(size, regions, r, c);
    for (const pos of elim) {
      if (grid[pos.row][pos.col] === 1) {
        grid[pos.row][pos.col] = 0;
      }
    }
  }

  // Pre-filter: if any region has only 1 cell, that cell must be a cat
  while (progress) {
    progress = false;

    // Check if fully solved
    let placedCount = 0;
    for (let r = 0; r < size; r++) {
      if (catInRow[r] !== null) placedCount++;
    }
    if (placedCount === size) {
      break;
    }

    // --- Rule 1: Last remaining candidate in Row, Col, or Region ---
    // Rows
    for (let r = 0; r < size; r++) {
      if (catInRow[r] !== null) continue;
      const candidates: number[] = [];
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 1) candidates.push(c);
      }
      if (candidates.length === 1) {
        placeCat(r, candidates[0], 1);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    // Cols
    for (let c = 0; c < size; c++) {
      let alreadyHasCat = false;
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 2) alreadyHasCat = true;
      }
      if (alreadyHasCat) continue;

      const candidates: number[] = [];
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 1) candidates.push(r);
      }
      if (candidates.length === 1) {
        placeCat(candidates[0], c, 1);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    // Regions
    for (let reg = 0; reg < size; reg++) {
      let alreadyHasCat = false;
      const candidates: { r: number; c: number }[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (grid[r][c] === 2) alreadyHasCat = true;
            else if (grid[r][c] === 1) candidates.push({ r, c });
          }
        }
      }
      if (alreadyHasCat) continue;
      if (candidates.length === 1) {
        placeCat(candidates[0].r, candidates[0].c, 1);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    if (maxAllowedRule < 3) break;

    // --- Rule 3: Intersection of 1 Line & 1 Region ---
    // All candidates of a Region are in 1 Row or 1 Col
    for (let reg = 0; reg < size; reg++) {
      const candidates: { r: number; c: number }[] = [];
      let hasCat = false;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (grid[r][c] === 2) hasCat = true;
            else if (grid[r][c] === 1) candidates.push({ r, c });
          }
        }
      }
      if (hasCat || candidates.length === 0) continue;

      const sameRow = candidates.every((cand) => cand.r === candidates[0].r);
      if (sameRow) {
        const targetRow = candidates[0].r;
        for (let c = 0; c < size; c++) {
          if (regions[targetRow][c] !== reg && grid[targetRow][c] === 1) {
            grid[targetRow][c] = 0;
            progress = true;
            maxRuleUsed = Math.max(maxRuleUsed, 3);
          }
        }
      }
      if (progress) break;

      const sameCol = candidates.every((cand) => cand.c === candidates[0].c);
      if (sameCol) {
        const targetCol = candidates[0].c;
        for (let r = 0; r < size; r++) {
          if (regions[r][targetCol] !== reg && grid[r][targetCol] === 1) {
            grid[r][targetCol] = 0;
            progress = true;
            maxRuleUsed = Math.max(maxRuleUsed, 3);
          }
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    // Dual: All candidates of a Row belong to 1 Region
    for (let r = 0; r < size; r++) {
      if (catInRow[r] !== null) continue;
      const candidates: { r: number; c: number }[] = [];
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 1) candidates.push({ r, c });
      }
      if (candidates.length === 0) continue;

      const targetReg = regions[r][candidates[0].c];
      const allSameReg = candidates.every((cand) => regions[r][cand.c] === targetReg);
      if (allSameReg) {
        for (let row = 0; row < size; row++) {
          if (row === r) continue;
          for (let col = 0; col < size; col++) {
            if (regions[row][col] === targetReg && grid[row][col] === 1) {
              grid[row][col] = 0;
              progress = true;
              maxRuleUsed = Math.max(maxRuleUsed, 3);
            }
          }
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    // Dual: All candidates of a Col belong to 1 Region
    for (let c = 0; c < size; c++) {
      let alreadyHasCat = false;
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 2) alreadyHasCat = true;
      }
      if (alreadyHasCat) continue;

      const candidates: { r: number; c: number }[] = [];
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 1) candidates.push({ r, c });
      }
      if (candidates.length === 0) continue;

      const targetReg = regions[candidates[0].r][c];
      const allSameReg = candidates.every((cand) => regions[cand.r][c] === targetReg);
      if (allSameReg) {
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (col === c) continue;
            if (regions[row][col] === targetReg && grid[row][col] === 1) {
              grid[row][col] = 0;
              progress = true;
              maxRuleUsed = Math.max(maxRuleUsed, 3);
            }
          }
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    if (maxAllowedRule < 4) break;

    // --- Rule 4: Common adjacency neighborhood ---
    // If every candidate of a region/line is adjacent to cell X, cell X cannot have a cat
    for (let reg = 0; reg < size; reg++) {
      const candidates: { r: number; c: number }[] = [];
      let hasCat = false;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (grid[r][c] === 2) hasCat = true;
            else if (grid[r][c] === 1) candidates.push({ r, c });
          }
        }
      }
      if (hasCat || candidates.length === 0) continue;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] !== 1) continue;
          if (candidates.some((cand) => cand.r === r && cand.c === c)) continue;

          // Check if all candidates are within 8-neighbor distance of (r, c)
          const allTouch = candidates.every((cand) => Math.abs(cand.r - r) <= 1 && Math.abs(cand.c - c) <= 1);
          if (allTouch) {
            grid[r][c] = 0;
            progress = true;
            maxRuleUsed = Math.max(maxRuleUsed, 4);
          }
        }
      }
      if (progress) break;
    }
    if (progress) continue;

    if (maxAllowedRule < 5) break;

    // --- Rule 5: Subsets of K regions / lines (K in {2, 3}) ---
    // K regions whose candidate cells are strictly contained within K rows
    const activeRegions: { reg: number; rows: Set<number>; cols: Set<number> }[] = [];
    for (let reg = 0; reg < size; reg++) {
      let hasCat = false;
      const rows = new Set<number>();
      const cols = new Set<number>();
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (regions[r][c] === reg) {
            if (grid[r][c] === 2) hasCat = true;
            else if (grid[r][c] === 1) {
              rows.add(r);
              cols.add(c);
            }
          }
        }
      }
      if (!hasCat && rows.size > 0) {
        activeRegions.push({ reg, rows, cols });
      }
    }

    for (let k = 2; k <= Math.min(3, activeRegions.length); k++) {
      // Find combinations of k regions
      const combinations: (typeof activeRegions)[] = [];
      function getCombs(start: number, current: typeof activeRegions) {
        if (current.length === k) {
          combinations.push([...current]);
          return;
        }
        for (let i = start; i < activeRegions.length; i++) {
          current.push(activeRegions[i]);
          getCombs(i + 1, current);
          current.pop();
        }
      }
      getCombs(0, []);

      for (const comb of combinations) {
        const unionRows = new Set<number>();
        for (const item of comb) {
          item.rows.forEach((r) => unionRows.add(r));
        }

        if (unionRows.size === k) {
          const combRegs = new Set(comb.map((item) => item.reg));
          for (const targetRow of unionRows) {
            for (let c = 0; c < size; c++) {
              if (grid[targetRow][c] === 1 && !combRegs.has(regions[targetRow][c])) {
                grid[targetRow][c] = 0;
                progress = true;
                maxRuleUsed = Math.max(maxRuleUsed, 5);
              }
            }
          }
        }
        if (progress) break;

        const unionCols = new Set<number>();
        for (const item of comb) {
          item.cols.forEach((c) => unionCols.add(c));
        }
        if (unionCols.size === k) {
          const combRegs = new Set(comb.map((item) => item.reg));
          for (const targetCol of unionCols) {
            for (let r = 0; r < size; r++) {
              if (grid[r][targetCol] === 1 && !combRegs.has(regions[r][targetCol])) {
                grid[r][targetCol] = 0;
                progress = true;
                maxRuleUsed = Math.max(maxRuleUsed, 5);
              }
            }
          }
        }
        if (progress) break;
      }
      if (progress) break;
    }
    if (progress) continue;

    if (maxAllowedRule < 6) break;

    // --- Rule 6: 1-step lookahead asphyxiation ---
    // If placing a cat at (r, c) eliminates all candidates in any unsolved row, col, or region -> eliminate (r, c)
    for (let r = 0; r < size; r++) {
      if (catInRow[r] !== null) continue;
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 1) continue;

        const simulatedElim = getDirectEliminations(size, regions, r, c);
        const elimSet = new Set(simulatedElim.map((p) => `${p.row},${p.col}`));

        // Check if any other row has 0 remaining candidates
        let causesAsphyxiation = false;
        for (let otherRow = 0; otherRow < size; otherRow++) {
          if (otherRow === r || catInRow[otherRow] !== null) continue;
          let remaining = 0;
          for (let col = 0; col < size; col++) {
            if (grid[otherRow][col] === 1 && !elimSet.has(`${otherRow},${col}`)) {
              remaining++;
            }
          }
          if (remaining === 0) {
            causesAsphyxiation = true;
            break;
          }
        }

        if (!causesAsphyxiation) {
          for (let otherCol = 0; otherCol < size; otherCol++) {
            if (otherCol === c) continue;
            let colHasCat = false;
            for (let row = 0; row < size; row++) {
              if (grid[row][otherCol] === 2) colHasCat = true;
            }
            if (colHasCat) continue;

            let remaining = 0;
            for (let row = 0; row < size; row++) {
              if (grid[row][otherCol] === 1 && !elimSet.has(`${row},${otherCol}`)) {
                remaining++;
              }
            }
            if (remaining === 0) {
              causesAsphyxiation = true;
              break;
            }
          }
        }

        if (!causesAsphyxiation) {
          for (let reg = 0; reg < size; reg++) {
            if (reg === regions[r][c]) continue;
            let regHasCat = false;
            for (let row = 0; row < size; row++) {
              for (let col = 0; col < size; col++) {
                if (regions[row][col] === reg && grid[row][col] === 2) {
                  regHasCat = true;
                }
              }
            }
            if (regHasCat) continue;

            let remaining = 0;
            for (let row = 0; row < size; row++) {
              for (let col = 0; col < size; col++) {
                if (regions[row][col] === reg && grid[row][col] === 1 && !elimSet.has(`${row},${col}`)) {
                  remaining++;
                }
              }
            }
            if (remaining === 0) {
              causesAsphyxiation = true;
              break;
            }
          }
        }

        if (causesAsphyxiation) {
          grid[r][c] = 0;
          progress = true;
          maxRuleUsed = Math.max(maxRuleUsed, 6);
          break;
        }
      }
      if (progress) break;
    }
  }

  let solved = true;
  for (let r = 0; r < size; r++) {
    if (catInRow[r] === null) {
      solved = false;
      break;
    }
  }

  const solution = solved ? (catInRow as number[]) : null;
  const difficultyScore = steps * 2 + maxRuleUsed * 10;

  return {
    solved,
    maxRuleUsed,
    difficultyScore,
    steps,
    solution,
  };
}
