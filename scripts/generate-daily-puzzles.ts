import fs from 'fs';
import path from 'path';
import os from 'os';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { createRng, generatePuzzle } from '../src/engine/generator';
import { countSolutions, solveLogically } from '../src/engine/solver';
import { PuzzleDef } from '../src/types/puzzle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.resolve(__dirname, '../src/data/dailyPuzzles.json');

const BASE_SEED = 20261108;
const START_ID = 1001;
const TOTAL_COUNT = 365;
const END_ID = START_ID + TOTAL_COUNT - 1; // 1365

/**
 * Deterministically generates and validates a single 10x10 daily puzzle.
 */
export function generateDailyPuzzle(id: number): PuzzleDef {
  const rng = createRng(BASE_SEED + id);
  const puzzle = generatePuzzle(id, 10, 6, rng, 1, { minRuleRequired: 4 });

  // Verification step before saving
  const exact = countSolutions(puzzle.regions, 2);
  if (exact.count !== 1) {
    throw new Error(`Puzzle ${id} failed uniqueness check (count=${exact.count})`);
  }

  const logic = solveLogically(puzzle.regions, 6);
  if (!logic.solved) {
    throw new Error(`Puzzle ${id} failed logical solvability check`);
  }

  return puzzle;
}

// Worker mode
if (process.argv.includes('--worker')) {
  process.on('message', (msg: { id: number }) => {
    try {
      const puzzle = generateDailyPuzzle(msg.id);
      process.send?.({ type: 'success', puzzle });
    } catch (err) {
      process.send?.({ type: 'error', id: msg.id, error: String(err) });
    }
  });
} else {
  // Main coordinator
  runMain().catch((err) => {
    console.error('Fatal error generating daily puzzles:', err);
    process.exit(1);
  });
}

async function runMain(): Promise<void> {
  console.log(`Starting generation of ${TOTAL_COUNT} 10x10 daily puzzles (IDs ${START_ID}..${END_ID})...`);
  const startTime = Date.now();

  const isSingleThread = process.argv.includes('--single-thread');
  const availableCpus = os.cpus().length || 1;
  const numWorkers = isSingleThread ? 1 : Math.min(8, availableCpus);

  console.log(`Using ${numWorkers} worker process(es)...`);

  const puzzles: PuzzleDef[] = [];

  if (numWorkers <= 1) {
    // Sequential generation
    for (let id = START_ID; id <= END_ID; id++) {
      const p = generateDailyPuzzle(id);
      puzzles.push(p);

      if (puzzles.length % 25 === 0 || puzzles.length === TOTAL_COUNT) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Progress] Generated ${puzzles.length}/${TOTAL_COUNT} puzzles (ID ${id}, Rule ${p.maxRuleUsed}, elapsed: ${elapsed}s)`);
      }
    }
  } else {
    // Parallel generation with worker processes
    const queue: number[] = [];
    for (let id = START_ID; id <= END_ID; id++) {
      queue.push(id);
    }

    await new Promise<void>((resolve, reject) => {
      let activeWorkers = numWorkers;
      const workers: ReturnType<typeof fork>[] = [];

      for (let i = 0; i < numWorkers; i++) {
        const worker = fork(__filename, ['--worker'], {
          execArgv: process.execArgv,
          stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        });

        const sendNext = () => {
          if (queue.length === 0) {
            worker.kill();
            activeWorkers--;
            if (activeWorkers === 0) {
              resolve();
            }
            return;
          }
          const nextId = queue.shift()!;
          worker.send({ id: nextId });
        };

        worker.on('message', (msg: { type: string; puzzle?: PuzzleDef; error?: string }) => {
          if (msg.type === 'success' && msg.puzzle) {
            puzzles.push(msg.puzzle);

            if (puzzles.length % 25 === 0 || puzzles.length === TOTAL_COUNT) {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
              console.log(
                `[Progress] Generated ${puzzles.length}/${TOTAL_COUNT} puzzles (latest ID ${msg.puzzle.id}, Rule ${msg.puzzle.maxRuleUsed}, elapsed: ${elapsed}s)`
              );
            }

            sendNext();
          } else {
            reject(new Error(msg.error || 'Unknown worker error'));
          }
        });

        worker.on('error', (err) => {
          reject(err);
        });

        workers.push(worker);
        sendNext();
      }
    });
  }

  // Sort puzzles ascending by id
  puzzles.sort((a, b) => a.id - b.id);

  if (puzzles.length !== TOTAL_COUNT) {
    throw new Error(`Expected ${TOTAL_COUNT} puzzles, but collected ${puzzles.length}`);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2), 'utf-8');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nSuccessfully saved ${puzzles.length} daily puzzles to ${outPath} in ${totalTime}s.`);
}
