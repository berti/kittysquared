import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRng, generate10x10Waves, generateAll100Puzzles } from '../src/engine/generator';
import { PuzzleDef } from '../src/types/puzzle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.resolve(__dirname, '../src/data/puzzles.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

console.log('Generating 300 KittySquared levels (5x5 to 10x10)...');
const start = Date.now();

// 1. Existing 100 levels
const puzzles: PuzzleDef[] = generateAll100Puzzles(20261025);
fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2), 'utf-8');
console.log(`[Puzzles 1-100 ready] in ${Date.now() - start}ms`);

// 2. 10x10 Waves (101-300) with incremental saves and progress logs
const rng10x10 = createRng(20261025 + 100);
let lastWaveTime = Date.now();

generate10x10Waves(101, 10, rng10x10, (waveIndex, wavePuzzles) => {
  puzzles.push(...wavePuzzles);
  fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2), 'utf-8');
  const now = Date.now();
  const waveDuration = ((now - lastWaveTime) / 1000).toFixed(1);
  const totalElapsed = ((now - start) / 1000).toFixed(1);
  console.log(
    `[Wave ${waveIndex + 1}/10 complete in ${waveDuration}s] Saved up to level ${
      wavePuzzles[wavePuzzles.length - 1].id
    } (${puzzles.length}/300 puzzles, total: ${totalElapsed}s)`
  );
  lastWaveTime = now;
});

console.log(`\nSuccessfully wrote all ${puzzles.length} puzzles to ${outPath} in ${Date.now() - start}ms`);
