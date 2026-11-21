import fs from 'fs';
import path from 'path';
import os from 'os';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { createRng, generate10x10Waves, generateAll100Puzzles } from '../src/engine/generator';
import { PuzzleDef } from '../src/types/puzzle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.resolve(__dirname, '../src/data/puzzles.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

if (process.argv.includes('--worker')) {
  process.on('message', (msg: { waveIndex: number; seed: number; startId: number; initialSignatures: string[] }) => {
    try {
      const rng = createRng(msg.seed);
      const seenSignatures = new Set<string>(msg.initialSignatures);
      const wavePuzzles = generate10x10Waves(msg.startId, 1, rng, undefined, seenSignatures);
      process.send?.({ type: 'success', waveIndex: msg.waveIndex, wavePuzzles });
    } catch (err) {
      process.send?.({ type: 'error', waveIndex: msg.waveIndex, error: String(err) });
    }
  });
} else {
  runMain().catch((err) => {
    console.error('Fatal error generating puzzles:', err);
    process.exit(1);
  });
}

async function runMain(): Promise<void> {
  console.log('Generating 300 KittySquared levels (5x5 to 10x10)...');
  const start = Date.now();

  // 1. Preserve existing campaign levels 1 to 100 verbatim if present
  let puzzles1To100: PuzzleDef[];
  if (fs.existsSync(outPath)) {
    const existing: PuzzleDef[] = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    if (existing.length >= 100) {
      puzzles1To100 = existing.slice(0, 100);
      console.log(`[Puzzles 1-100 preserved from existing dataset] in ${Date.now() - start}ms`);
    } else {
      puzzles1To100 = generateAll100Puzzles(20261025);
      console.log(`[Puzzles 1-100 generated] in ${Date.now() - start}ms`);
    }
  } else {
    puzzles1To100 = generateAll100Puzzles(20261025);
    console.log(`[Puzzles 1-100 generated] in ${Date.now() - start}ms`);
  }

  const initialSignatures: string[] = puzzles1To100.map((p) => p.regions.map((row) => row.join(',')).join(';'));

  // 2. 10x10 Waves (101-300): 10 waves of 20 levels each
  const totalWaves = 10;
  const availableCpus = os.cpus().length || 1;
  const numWorkers = Math.min(totalWaves, availableCpus);

  console.log(`Generating 10 waves across ${numWorkers} worker processes...`);

  const waveQueue: { waveIndex: number; startId: number; seed: number; initialSignatures: string[] }[] = [];
  for (let w = 0; w < totalWaves; w++) {
    waveQueue.push({
      waveIndex: w,
      startId: 101 + w * 20,
      seed: 20261025 + (w + 1) * 104729,
      initialSignatures,
    });
  }

  const completedWaves: Map<number, PuzzleDef[]> = new Map();

  await new Promise<void>((resolve, reject) => {
    let activeWorkers = numWorkers;
    for (let i = 0; i < numWorkers; i++) {
      const worker = fork(__filename, ['--worker'], {
        execArgv: process.execArgv,
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      });

      const sendNext = () => {
        if (waveQueue.length === 0) {
          worker.kill();
          activeWorkers--;
          if (activeWorkers === 0) {
            resolve();
          }
          return;
        }
        const task = waveQueue.shift()!;
        worker.send(task);
      };

      worker.on('message', (msg: { type: string; waveIndex: number; wavePuzzles?: PuzzleDef[]; error?: string }) => {
        if (msg.type === 'success' && msg.wavePuzzles) {
          completedWaves.set(msg.waveIndex, msg.wavePuzzles);
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(
            `[Wave ${msg.waveIndex + 1}/${totalWaves} complete] Levels ${msg.wavePuzzles[0].id}-${
              msg.wavePuzzles[msg.wavePuzzles.length - 1].id
            } generated (${completedWaves.size}/${totalWaves} waves, elapsed: ${elapsed}s)`
          );
          sendNext();
        } else {
          reject(new Error(msg.error || 'Unknown worker error'));
        }
      });

      worker.on('error', (err) => {
        reject(err);
      });

      sendNext();
    }
  });

  // Assemble waves in order
  const wavesPuzzles: PuzzleDef[] = [];
  for (let w = 0; w < totalWaves; w++) {
    const wave = completedWaves.get(w);
    if (!wave || wave.length !== 20) {
      throw new Error(`Wave ${w} was incomplete or missing`);
    }
    wavesPuzzles.push(...wave);
  }

  // Deduplication verification across the entire 300 levels
  const all300: PuzzleDef[] = [...puzzles1To100, ...wavesPuzzles];
  const duplicateIds: number[] = [];
  const globalSeen = new Set<string>();
  for (const p of all300) {
    const sig = p.regions.map((row) => row.join(',')).join(';');
    if (globalSeen.has(sig)) {
      duplicateIds.push(p.id);
    } else {
      globalSeen.add(sig);
    }
  }

  if (duplicateIds.length > 0) {
    throw new Error(`Found unexpected duplicates at level IDs: ${duplicateIds.join(', ')}`);
  }

  fs.writeFileSync(outPath, JSON.stringify(all300, null, 2), 'utf-8');
  console.log(`\nSuccessfully wrote all ${all300.length} distinct puzzles to ${outPath} in ${Date.now() - start}ms`);
}
