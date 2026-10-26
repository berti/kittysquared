import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAll100Puzzles } from '../src/engine/generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating 100 KittySquared levels (5x5 to 9x9)...');
const start = Date.now();
const puzzles = generateAll100Puzzles(20261025);
const outPath = path.resolve(__dirname, '../src/data/puzzles.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2), 'utf-8');
console.log(`Successfully wrote ${puzzles.length} puzzles to ${outPath} in ${Date.now() - start}ms`);
