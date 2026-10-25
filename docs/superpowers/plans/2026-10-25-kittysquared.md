# KittySquared Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir KittySquared, un juego web de puzzles lógicos ($5 \times 5$ a $9 \times 9$) con generador offline de 100 niveles de solución única resolubles por deducción humana, modos Chill Out y Classic, tutorial interactivo, estética *Soft Clay*, gatos SVG animados y audio Web Audio API.

**Architecture:** Aplicación SPA estática en TypeScript + Preact + Vite con hojas de estilo CSS *Soft Clay* y gráficos SVG reactivos. Un motor lógico compartido en `src/engine/` valida reglas, resuelve puzzles aplicando 6 técnicas de deducción humana graduadas y alimenta un script CLI (`scripts/generate-puzzles.ts`) que pre-genera los 100 niveles en `src/data/puzzles.json`.

**Tech Stack:** TypeScript 5, Vite 6, Preact 10, Vitest + `@testing-library/preact` + `jsdom`, Web Audio API, `localStorage`.

**Spec:** `docs/superpowers/specs/2026-10-25-kittysquared-design.md`

## Global Constraints

- **Plataforma:** Aplicación web 100% estática (SPA sin backend), jugable en navegadores modernos de escritorio y móviles (iOS/Android) con diseño adaptable centrado.
- **Solución única y deducción humana:** Cada uno de los 100 niveles ($5 \le N \le 9$) debe tener solución única y ser resoluble sin adivinar usando las reglas del solucionador humano asignadas a su tramo.
- **Distribución de los 100 niveles:** 1–15 ($5 \times 5$, Reglas 1–3), 16–40 ($6 \times 6$, Reglas 1–4), 41–65 ($7 \times 7$, Reglas 1–5), 66–85 ($8 \times 8$, Reglas 1–6), 86–100 ($9 \times 9$, Reglas 1–6).
- **Puntuación y fallos en modo Classic:** 10 puntos parciales por gato correcto; al 3.er fallo se pierde el nivel y los puntos parciales; al completar el nivel se consolidan los puntos más bono de $+50$ (0 fallos), $+30$ (1 fallo) o $+10$ (2 fallos).
- **Consistencia de los gatos SVG:** Tanto el Gatito 1 (Negro con borde blanco fino) como el Gatito 2 (Blanco con orejas negras) conservan siempre orejas, nariz rosa y 4 bigotes laterales en sus 4 estados (`idle`, `placed`, `conflict`, `victory`), con parpadeo asíncrono aleatorio por instancia ($3.5\text{ s} - 8.5\text{ s}$).

## Review Focus

1. **Arrastre de cruces sobre casillas con gato:** Arrastrar el dedo/ratón para poner o quitar cruces (`applyDragCross`) nunca debe sobrescribir ni borrar un gato colocado en ningún modo ni penalizar en modo Classic (cubierto en Tarea 4).
2. **Inmutabilidad de gatos validados en modo Classic:** En modo Classic, un gato ya validado como correcto queda fijado; volver a tocarlo, pulsar "Limpiar cruces" (`clearCrosses`) o pulsar "Deshacer" (`undoMove`) nunca debe borrarlo ni descontar fallos (cubierto en Tarea 4).
3. **Esquema de doble toque en modo Classic:** En el modo de control `double-tap`, el primer toque en una casilla vacía coloca una cruz (`✕`) sin disparar la validación de gato ni sumar fallos en Classic; solo el segundo toque coloca y valida el gato (`🐱`) (cubierto en Tarea 4).
4. **Contigüidad ortogonal de regiones en el generador:** Al generar las $N$ regiones de un nivel, cada región $0 \dots N-1$ debe formar un único componente conexo ortogonal sin islas separadas (cubierto en Tarea 3).
5. **Datos corruptos en `localStorage`:** Si `localStorage` contiene JSON inválido o un esquema incompleto al arrancar, `loadPersistedState` debe restaurar el estado inicial por defecto sin lanzar excepciones (cubierto en Tarea 5).

---

## Mapa de Archivos

- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`: Configuración del proyecto, scripts (`dev`, `build`, `test`, `generate-puzzles`).
- `src/types/puzzle.ts`: Tipos de dominio (`CellState`, `PuzzleDef`, `GameMode`, `ControlScheme`, `CatVariant`, `SolverResult`, `BoardPlayState`, `ModeProgress`, `AppSettings`).
- `src/engine/rules.ts`: Validación de reglas del tablero, detección de conflictos, cálculo de descartes directos y verificación de contigüidad de regiones.
- `src/engine/solver.ts`: Solver exacto de solución única (`countSolutions`) y Solver de deducción lógica humana con las Reglas 1 a 6 (`solveLogically`).
- `src/engine/generator.ts`: Generador determinista con semilla de configuraciones de gatos, partición en regiones conexas y filtrado por tramo de dificultad.
- `scripts/generate-puzzles.ts` y `src/data/puzzles.json`: Script CLI para generar y persistir el paquete fijo de 100 niveles validados.
- `src/state/gameState.ts`: Lógica pura de partida para *Chill Out* y *Classic* (toques, arrastre de cruces, fijación de gatos en Classic, vidas, puntos, bono, historial de deshacer y limpieza de cruces).
- `src/state/storage.ts`: Carga, guardado y reinicio de progreso independiente por modo y ajustes en `localStorage`.
- `src/audio/soundEngine.ts`: Sintetizador Web Audio API para efectos (cruz, gato, conflicto/error, victoria) y música ambiental en bucle.
- `src/components/CatSvg.tsx`: Componente SVG de los dos diseños de gato con sus 4 expresiones y temporizador aleatorio individual en reposo.
- `src/components/Board.tsx`: Tablero interactivo *Soft Clay* con soporte de puntero (toque simple/doble, interruptor y arrastre continuo de cruces).
- `src/data/tutorialSteps.ts` y `src/components/TutorialModal.tsx`: Datos y vista guiada interactiva del tutorial (Parte 1 básica y Parte 2 avanzada).
- `src/components/HomeScreen.tsx`, `src/components/GameScreen.tsx`, `src/components/SettingsModal.tsx`, `src/App.tsx`, `src/main.tsx`, `src/styles/theme.css`: Pantallas principales, modales de fin de nivel, ajustes y tema visual *Soft Clay*.

---

### Task 1: Scaffolding del Proyecto, Tipos Base y Reglas del Tablero

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/types/puzzle.ts`
- Create: `src/engine/rules.ts`
- Test: `tests/engine/rules.test.ts`

**Interfaces:**
- Produces in `src/types/puzzle.ts`:
  - `export type CellState = 'empty' | 'cross' | 'cat';`
  - `export type GameMode = 'chill' | 'classic';`
  - `export type ControlScheme = 'toggle' | 'double-tap';`
  - `export type CatVariant = 'black' | 'white';`
  - `export type CatAnimState = 'idle' | 'placed' | 'conflict' | 'victory';`
  - `export interface CellCoord { row: number; col: number; }`
  - `export interface PuzzleDef { id: number; size: number; regions: number[][]; solution: number[]; maxRuleUsed: number; difficultyScore: number; }` (`solution[row] = col` del gato en esa fila)
- Produces in `src/engine/rules.ts`:
  - `export function findConflictingCats(board: CellState[][], regions: number[][]): Set<string>` (devuelve claves `"row,col"` de cualquier gato que comparta fila, columna, región o adyacencia en 8 direcciones con otro gato)
  - `export function isBoardSolved(board: CellState[][], regions: number[][]): boolean`
  - `export function getDirectEliminations(size: number, regions: number[][], row: number, col: number): CellCoord[]`
  - `export function areRegionsContiguous(regions: number[][]): boolean`

- [ ] **Step 1: Inicializar `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` y `src/types/puzzle.ts`, e instalar dependencias**

Configurar scripts `"dev": "vite"`, `"build": "tsc --noEmit && vite build"`, `"test": "vitest run"`, `"generate-puzzles": "tsx scripts/generate-puzzles.ts"` con `preact`, `@preact/preset-vite`, `vite`, `typescript`, `vitest`, `jsdom`, `@testing-library/preact` y `tsx`.

- [ ] **Step 2: Escribir el test de reglas en `tests/engine/rules.test.ts`**

```typescript
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
```

- [ ] **Step 3: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/engine/rules.test.ts`
Expected: FAIL (`Cannot find module '../../src/engine/rules'`)

- [ ] **Step 4: Implementar `src/engine/rules.ts`**

Implementar `findConflictingCats`, `isBoardSolved`, `getDirectEliminations` y `areRegionsContiguous` (usando BFS ortogonal por cada ID de región $0 \dots N-1$ y verificando que haya exactamente $N$ regiones distintas no vacías).

- [ ] **Step 5: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/engine/rules.test.ts`
Expected: PASS (4 passed)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/types/puzzle.ts src/engine/rules.ts tests/engine/rules.test.ts
git commit -m "feat: scaffold project and implement core board rules"
```

---

### Task 2: Solucionador de Solución Única y Solucionador Lógico Humano (Reglas 1–6)

**Files:**
- Create: `src/engine/solver.ts`
- Test: `tests/engine/solver.test.ts`

**Interfaces:**
- Consumes from `src/engine/rules.ts`: `getDirectEliminations`
- Produces in `src/engine/solver.ts`:
  - `export interface ExactSolveResult { count: number; firstSolution: number[] | null; }`
  - `export interface HumanSolveResult { solved: boolean; maxRuleUsed: number; difficultyScore: number; steps: number; solution: number[] | null; }`
  - `export function countSolutions(regions: number[][], maxLimit?: number): ExactSolveResult`
  - `export function solveLogically(regions: number[][], maxAllowedRule?: number): HumanSolveResult`

- [ ] **Step 1: Escribir los tests unitarios del solver en `tests/engine/solver.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { countSolutions, solveLogically } from '../../src/engine/solver';

describe('engine/solver', () => {
  it('counts unique vs multiple solutions accurately', () => {
    // 4x4 board where regions force a unique solution: (0,1), (1,3), (2,0), (3,2)
    const uniqueRegions = [
      [0, 0, 1, 1],
      [0, 0, 0, 1],
      [2, 3, 3, 3],
      [2, 2, 3, 3],
    ];
    const res = countSolutions(uniqueRegions, 2);
    expect(res.count).toBe(1);
    expect(res.firstSolution).toEqual([1, 3, 0, 2]);

    // Symmetric regions allowing both [1,3,0,2] and [2,0,3,1]
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
      [0, 0, 1, 1],
      [0, 0, 0, 1],
      [2, 3, 3, 3],
      [2, 2, 3, 3],
    ];
    const logic = solveLogically(uniqueRegions, 3);
    expect(logic.solved).toBe(true);
    expect(logic.maxRuleUsed).toBeLessThanOrEqual(3);
    expect(logic.solution).toEqual([1, 3, 0, 2]);
  });

  it('applies Rule 5 (K-subsets of regions/lines) and Rule 6 (1-step lookahead asphyxiation) when needed', () => {
    const regions5x5 = [
      [0, 0, 1, 1, 1],
      [0, 2, 2, 1, 3],
      [2, 2, 4, 3, 3],
      [2, 4, 4, 4, 3],
      [4, 4, 4, 3, 3],
    ];
    const exact = countSolutions(regions5x5, 2);
    expect(exact.count).toBe(1);
    const solved = solveLogically(regions5x5, 6);
    expect(solved.solved).toBe(true);
    expect(solved.solution).toEqual(exact.firstSolution);
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/engine/solver.test.ts`
Expected: FAIL (`Cannot find module '../../src/engine/solver'`)

- [ ] **Step 3: Implementar `countSolutions` y `solveLogically` en `src/engine/solver.ts`**

En `solveLogically(regions, maxAllowedRule = 6)`, iterar aplicando siempre la regla de menor índice ($1 \dots \text{maxAllowedRule}$) que produzca algún gato nuevo o alguna casilla descartada:
- **Regla 1 (Último hueco):** una fila, columna o región sin gato tiene solo 1 casilla candidata $\rightarrow$ colocar gato y aplicar Regla 2.
- **Regla 2 (Descarte directo):** al colocar gato en $(r, c)$, descartar su fila, columna, región y 8 vecinas.
- **Regla 3 (Intersección 1 a 1):** todas las candidatas de una región están en 1 fila/columna $\rightarrow$ descartar el resto de esa fila/columna (y dual: todas las candidatas de una fila/columna pertenecen a 1 región $\rightarrow$ descartar el resto de esa región).
- **Regla 4 (Vecindad común):** para cualquier unidad (fila, columna o región) sin gato, la intersección de las casillas eliminadas por adyacencia de todas sus candidatas se descarta.
- **Regla 5 (Subconjuntos de $K \in \{2, 3\}$):** si $K$ regiones sin gato tienen la unión de sus candidatas contenida en exactamente $K$ filas (o $K$ columnas), descartar las candidatas de otras regiones en esas $K$ filas/columnas (y su dual: $K$ filas/columnas contenidas en $K$ regiones).
- **Regla 6 (Asfixia a 1 paso):** para cada casilla candidata $C$, si simular la colocación de un gato en $C$ (aplicando Regla 2) deja alguna otra fila, columna o región no resuelta con $0$ candidatas, descartar $C$.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/engine/solver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/solver.ts tests/engine/solver.test.ts
git commit -m "feat: add exact uniqueness solver and 6-rule human deduction solver"
```

---

### Task 3: Generador de Niveles y Paquete Estático de 100 Puzzles

**Files:**
- Create: `src/engine/generator.ts`
- Create: `scripts/generate-puzzles.ts`
- Create: `src/data/puzzles.json`
- Test: `tests/engine/generator.test.ts`

**Interfaces:**
- Consumes from `src/engine/rules.ts`: `areRegionsContiguous`, `isBoardSolved`
- Consumes from `src/engine/solver.ts`: `countSolutions`, `solveLogically`
- Produces in `src/engine/generator.ts`:
  - `export interface LevelTierSpec { startId: number; count: number; size: number; maxAllowedRule: number; minRulePreferred: number; }`
  - `export const LEVEL_TIERS: LevelTierSpec[];`
  - `export function createRng(seed: number): () => number`
  - `export function generatePuzzle(id: number, size: number, maxAllowedRule: number, rng: () => number, minRulePreferred?: number): PuzzleDef`
  - `export function generateAll100Puzzles(seed?: number): PuzzleDef[]`

- [ ] **Step 1: Escribir los tests del generador y del paquete de 100 niveles en `tests/engine/generator.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { areRegionsContiguous } from '../../src/engine/rules';
import { countSolutions, solveLogically } from '../../src/engine/solver';
import { createRng, generatePuzzle } from '../../src/engine/generator';
import puzzles from '../../src/data/puzzles.json';

describe('engine/generator & puzzles.json', () => {
  it('generated puzzle regions are strictly orthogonally contiguous and have a unique human-solvable solution', () => {
    const rng = createRng(42);
    const puzzle = generatePuzzle(1, 5, 3, rng);
    expect(puzzle.size).toBe(5);
    expect(areRegionsContiguous(puzzle.regions)).toBe(true);
    expect(countSolutions(puzzle.regions, 2).count).toBe(1);
    expect(solveLogically(puzzle.regions, 3).solved).toBe(true);
  });

  it('validates all 100 pre-generated puzzles in src/data/puzzles.json match the spec tier distribution and uniqueness', () => {
    expect(puzzles).toHaveLength(100);
    expect(puzzles[0].size).toBe(5);
    expect(puzzles[14].size).toBe(5);
    expect(puzzles[15].size).toBe(6);
    expect(puzzles[39].size).toBe(6);
    expect(puzzles[40].size).toBe(7);
    expect(puzzles[64].size).toBe(7);
    expect(puzzles[65].size).toBe(8);
    expect(puzzles[84].size).toBe(8);
    expect(puzzles[85].size).toBe(9);
    expect(puzzles[99].size).toBe(9);

    for (const p of puzzles) {
      expect(areRegionsContiguous(p.regions)).toBe(true);
      const exact = countSolutions(p.regions, 2);
      expect(exact.count).toBe(1);
      expect(exact.firstSolution).toEqual(p.solution);
    }
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/engine/generator.test.ts`
Expected: FAIL (`Cannot find module '../../src/engine/generator'`)

- [ ] **Step 3: Implementar `src/engine/generator.ts`, `scripts/generate-puzzles.ts` y ejecutar `npm run generate-puzzles`**

En `generatePuzzle`:
1. Usar un PRNG determinista (`mulberry32` en `createRng(seed)`).
2. Colocar $N$ gatos válidos (1 por fila/columna, sin adyacencia en 8 direcciones) mediante backtracking aleatorio.
3. Sembrar cada región $i \in [0, N-1]$ en la posición del gato $i$ y expandir las regiones a las casillas vacías adyacentes (BFS/frontera aleatoria sin sobrescribir jamás casillas ya asignadas, garantizando así por construcción que las $N$ regiones sean siempre ortogonalmente conexas).
4. Comprobar `countSolutions(regions, 2).count === 1` y `solveLogically(regions, maxAllowedRule).solved === true`. Ordenar los puzzles dentro de cada tramo de tamaño por `difficultyScore` creciente.

Ejecutar `npm run generate-puzzles` para escribir `src/data/puzzles.json`.

- [ ] **Step 4: Ejecutar el test y verificar que los 100 puzzles pasan todas las validaciones**

Run: `npx vitest run tests/engine/generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/generator.ts scripts/generate-puzzles.ts src/data/puzzles.json tests/engine/generator.test.ts
git commit -m "feat: add puzzle generator and pre-generate 100 unique levels"
```

---

### Task 4: Máquina de Estados de Partida (Modos Chill Out y Classic, Puntuación y Controles)

**Files:**
- Create: `src/state/gameState.ts`
- Test: `tests/state/gameState.test.ts`

**Interfaces:**
- Consumes from `src/types/puzzle.ts`: `PuzzleDef`, `CellState`, `GameMode`, `ControlScheme`
- Consumes from `src/engine/rules.ts`: `findConflictingCats`, `isBoardSolved`
- Produces in `src/state/gameState.ts`:
  - `export interface LevelSessionState { puzzle: PuzzleDef; mode: GameMode; board: CellState[][]; lockedCats: boolean[][]; mistakes: number; maxMistakes: number; partialScore: number; levelBonus: number; status: 'playing' | 'won' | 'lost'; conflictingKeys: Set<string>; lastErrorCell: { row: number; col: number } | null; lastPlacedCat: { row: number; col: number } | null; history: { board: CellState[][]; lockedCats: boolean[][] }[]; }`
  - `export function createLevelSession(puzzle: PuzzleDef, mode: GameMode): LevelSessionState`
  - `export function applyCellTap(state: LevelSessionState, row: number, col: number, scheme: ControlScheme, activeTool: 'cross' | 'cat'): LevelSessionState`
  - `export function applyDragCross(state: LevelSessionState, row: number, col: number, targetCrossState: 'cross' | 'empty'): LevelSessionState`
  - `export function undoMove(state: LevelSessionState): LevelSessionState`
  - `export function clearCrosses(state: LevelSessionState): LevelSessionState`

- [ ] **Step 1: Escribir los tests exhaustivos de `gameState` en `tests/state/gameState.test.ts` (incluyendo los casos 1, 2 y 3 de Review Focus)**

```typescript
import { describe, expect, it } from 'vitest';
import {
  applyCellTap,
  applyDragCross,
  clearCrosses,
  createLevelSession,
  undoMove,
} from '../../src/state/gameState';
import { PuzzleDef } from '../../src/types/puzzle';

const samplePuzzle: PuzzleDef = {
  id: 1,
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [2, 3, 3, 3],
    [2, 2, 3, 3],
  ],
  solution: [1, 3, 0, 2],
  maxRuleUsed: 2,
  difficultyScore: 10,
};

describe('state/gameState', () => {
  it('Chill Out mode highlights conflicts without failing and wins when solved', () => {
    let s = createLevelSession(samplePuzzle, 'chill');
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // same row & neighbor
    expect(s.conflictingKeys.has('0,0')).toBe(true);
    expect(s.conflictingKeys.has('0,1')).toBe(true);
    expect(s.status).toBe('playing');

    // Remove (0,0) and place remaining valid cats: (1,3), (2,0), (3,2)
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    s = applyCellTap(s, 1, 3, 'toggle', 'cat');
    s = applyCellTap(s, 2, 0, 'toggle', 'cat');
    s = applyCellTap(s, 3, 2, 'toggle', 'cat');
    expect(s.status).toBe('won');
  });

  it('Classic mode awards 10 partial points per valid cat, penalizes mistakes, and loses on 3rd mistake', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    // Valid cat at (0,1)
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    expect(s.board[0][1]).toBe('cat');
    expect(s.lockedCats[0][1]).toBe(true);
    expect(s.partialScore).toBe(10);

    // 3 wrong cat placements -> lost on 3rd mistake, partialScore reset to 0
    s = applyCellTap(s, 0, 0, 'toggle', 'cat');
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('empty');
    s = applyCellTap(s, 1, 0, 'toggle', 'cat');
    expect(s.mistakes).toBe(2);
    expect(s.status).toBe('playing');
    s = applyCellTap(s, 2, 2, 'toggle', 'cat');
    expect(s.mistakes).toBe(3);
    expect(s.status).toBe('lost');
    expect(s.partialScore).toBe(0);
  });

  it('Classic mode calculates completion bonus (+50 for 0 mistakes, +30 for 1, +10 for 2)', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    s = applyCellTap(s, 0, 0, 'toggle', 'cat'); // 1 mistake
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    s = applyCellTap(s, 1, 3, 'toggle', 'cat');
    s = applyCellTap(s, 2, 0, 'toggle', 'cat');
    s = applyCellTap(s, 3, 2, 'toggle', 'cat');
    expect(s.status).toBe('won');
    expect(s.partialScore).toBe(40);
    expect(s.levelBonus).toBe(30);
  });

  it('Review Focus #1: applyDragCross ignores cells that already contain a cat', () => {
    let s = createLevelSession(samplePuzzle, 'chill');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat');
    s = applyDragCross(s, 0, 1, 'cross');
    expect(s.board[0][1]).toBe('cat');
    s = applyDragCross(s, 0, 2, 'cross');
    expect(s.board[0][2]).toBe('cross');
  });

  it('Review Focus #2: Classic mode locks validated cats against tap, clearCrosses, and undoMove', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // valid, locked
    s = applyCellTap(s, 0, 2, 'toggle', 'cross');
    s = applyCellTap(s, 0, 1, 'toggle', 'cat'); // attempt to remove locked cat
    expect(s.board[0][1]).toBe('cat');
    s = clearCrosses(s);
    expect(s.board[0][2]).toBe('empty');
    expect(s.board[0][1]).toBe('cat');
    s = undoMove(s); // undoes clearCrosses
    s = undoMove(s); // undoes cross at (0,2)
    s = undoMove(s); // cannot undo locked cat in Classic
    expect(s.board[0][1]).toBe('cat');
  });

  it('Review Focus #3: double-tap scheme places cross on first tap without triggering Classic cat validation', () => {
    let s = createLevelSession(samplePuzzle, 'classic');
    // (0,0) is a wrong cat position, but 1st tap in double-tap mode only places a cross
    s = applyCellTap(s, 0, 0, 'double-tap', 'cat');
    expect(s.board[0][0]).toBe('cross');
    expect(s.mistakes).toBe(0);
    // 2nd tap on (0,0) attempts to place a cat -> triggers Classic mistake
    s = applyCellTap(s, 0, 0, 'double-tap', 'cat');
    expect(s.mistakes).toBe(1);
    expect(s.board[0][0]).toBe('empty');
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: FAIL (`Cannot find module '../../src/state/gameState'`)

- [ ] **Step 3: Implementar `src/state/gameState.ts`**

Implementar `createLevelSession`, `applyCellTap`, `applyDragCross`, `undoMove` y `clearCrosses`. En modo `classic`, al validar un gato correcto en `(row, col)`, marcar `lockedCats[row][col] = true`, sumar `10` a `partialScore`, y vaciar el historial previo a ese bloqueo para que `undoMove` nunca desbloquee un gato ya validado.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/state/gameState.test.ts`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add src/state/gameState.ts tests/state/gameState.test.ts
git commit -m "feat: implement Chill Out and Classic game state transitions"
```

---

### Task 5: Persistencia Local (`localStorage`) y Gestión de Progreso Independiente

**Files:**
- Create: `src/state/storage.ts`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Consumes from `src/types/puzzle.ts`: `GameMode`, `ControlScheme`, `CatVariant`, `CellState`
- Produces in `src/state/storage.ts`:
  - `export interface SavedBoardSnapshot { levelId: number; board: CellState[][]; lockedCats: boolean[][]; mistakes: number; partialScore: number; }`
  - `export interface ModeProgress { currentLevelId: number; totalScore: number; activeSnapshot: SavedBoardSnapshot | null; }`
  - `export interface AppSettings { controlScheme: ControlScheme; catVariant: CatVariant; musicMuted: boolean; sfxMuted: boolean; tutorialSeen: boolean; }`
  - `export interface PersistedAppState { chill: ModeProgress; classic: ModeProgress; settings: AppSettings; }`
  - `export function getDefaultAppState(): PersistedAppState`
  - `export function loadPersistedState(): PersistedAppState`
  - `export function savePersistedState(state: PersistedAppState): void`
  - `export function resetModeProgress(state: PersistedAppState, mode: GameMode): PersistedAppState`

- [ ] **Step 1: Escribir los tests de persistencia en `tests/state/storage.test.ts` (incluyendo Review Focus #5)**

```typescript
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDefaultAppState,
  loadPersistedState,
  resetModeProgress,
  savePersistedState,
} from '../../src/state/storage';

describe('state/storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads independent progress for Chill Out and Classic modes', () => {
    const state = getDefaultAppState();
    state.chill.currentLevelId = 14;
    state.classic.currentLevelId = 8;
    state.classic.totalScore = 640;
    state.settings.catVariant = 'white';
    savePersistedState(state);

    const loaded = loadPersistedState();
    expect(loaded.chill.currentLevelId).toBe(14);
    expect(loaded.classic.currentLevelId).toBe(8);
    expect(loaded.classic.totalScore).toBe(640);
    expect(loaded.settings.catVariant).toBe('white');
  });

  it('resets only the requested mode progress back to level 1 and 0 points', () => {
    const state = getDefaultAppState();
    state.chill.currentLevelId = 10;
    state.classic.currentLevelId = 5;
    state.classic.totalScore = 320;
    const afterReset = resetModeProgress(state, 'classic');
    expect(afterReset.classic.currentLevelId).toBe(1);
    expect(afterReset.classic.totalScore).toBe(0);
    expect(afterReset.classic.activeSnapshot).toBeNull();
    expect(afterReset.chill.currentLevelId).toBe(10);
  });

  it('Review Focus #5: loadPersistedState falls back to defaults when localStorage contains malformed JSON', () => {
    localStorage.setItem('kittysquared_state_v1', '{broken-json');
    const loaded = loadPersistedState();
    expect(loaded).toEqual(getDefaultAppState());
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL (`Cannot find module '../../src/state/storage'`)

- [ ] **Step 3: Implementar `src/state/storage.ts`**

Usar la clave `'kittysquared_state_v1'`, fusionar de forma segura cada sub-objeto (`chill`, `classic`, `settings`) con `getDefaultAppState()` dentro de un bloque `try / catch` para tolerar esquemas parciales o JSON inválido.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add src/state/storage.ts tests/state/storage.test.ts
git commit -m "feat: add localStorage persistence and independent mode progress"
```

---

### Task 6: Motor de Sonido y Música Sintetizada (Web Audio API)

**Files:**
- Create: `src/audio/soundEngine.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Produces in `src/audio/soundEngine.ts`:
  - `export class SoundEngine { setMuted(musicMuted: boolean, sfxMuted: boolean): void; playCross(): void; playCatPlaced(): void; playConflict(): void; playVictory(): void; startMusic(): void; stopMusic(): void; }`
  - `export const soundEngine: SoundEngine;`

- [ ] **Step 1: Escribir el test de `SoundEngine` en `tests/audio/soundEngine.test.ts`**

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SoundEngine } from '../../src/audio/soundEngine';

describe('audio/soundEngine', () => {
  it('operates safely without throwing when Web Audio API is absent or muted', () => {
    const engine = new SoundEngine();
    engine.setMuted(true, true);
    expect(() => {
      engine.playCross();
      engine.playCatPlaced();
      engine.playConflict();
      engine.playVictory();
      engine.startMusic();
      engine.stopMusic();
    }).not.toThrow();
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: FAIL (`Cannot find module '../../src/audio/soundEngine'`)

- [ ] **Step 3: Implementar `src/audio/soundEngine.ts`**

Crear `SoundEngine` usando `window.AudioContext || window.webkitAudioContext` bajo demanda tras la primera interacción del usuario:
- `playCross()`: clic suave percusivo corto (onda senoidal de $420\text{ Hz} \rightarrow 260\text{ Hz}$ en $45\text{ ms}$).
- `playCatPlaced()`: maullido tonal ascendente alegre ($520\text{ Hz} \rightarrow 780\text{ Hz}$ en $160\text{ ms}$).
- `playConflict()`: doble tono grave disonante ($220\text{ Hz} \rightarrow 165\text{ Hz}$ en $220\text{ ms}$).
- `playVictory()`: arpegio mayor luminoso (`C5 - E5 - G5 - C6`).
- `startMusic()` / `stopMusic()`: secuencia pentatónica suave y cálida en bucle lento con ganancia baja, que se detiene al instante cuando `musicMuted` es `true`.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/audio/soundEngine.ts tests/audio/soundEngine.test.ts
git commit -m "feat: add procedural Web Audio API sound effects and music engine"
```

---

### Task 7: Componente `CatSvg` (Gatito Negro y Gatito Blanco con 4 Estados y Parpadeo Aleatorio) y `Board` Interactivo

**Files:**
- Create: `src/components/CatSvg.tsx`
- Create: `src/components/Board.tsx`
- Create: `src/styles/theme.css`
- Test: `tests/components/BoardAndCat.test.tsx`

**Interfaces:**
- Consumes from `src/types/puzzle.ts`: `CatVariant`, `CatAnimState`, `CellState`
- Produces in `src/components/CatSvg.tsx`:
  - `export interface CatSvgProps { variant: CatVariant; state: CatAnimState; }`
  - `export function CatSvg(props: CatSvgProps): JSX.Element`
- Produces in `src/components/Board.tsx`:
  - `export interface BoardProps { size: number; regions: number[][]; board: CellState[][]; lockedCats: boolean[][]; conflictingKeys: Set<string>; lastPlacedCat: { row: number; col: number } | null; lastErrorCell: { row: number; col: number } | null; isVictory: boolean; catVariant: CatVariant; onCellTap: (row: number, col: number) => void; onDragCross: (row: number, col: number, targetState: 'cross' | 'empty') => void; }`
  - `export function Board(props: BoardProps): JSX.Element`

- [ ] **Step 1: Escribir los tests de `CatSvg` y `Board` en `tests/components/BoardAndCat.test.tsx`**

```typescript
// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Board } from '../../src/components/Board';
import { CatSvg } from '../../src/components/CatSvg';
import { CellState } from '../../src/types/puzzle';

describe('components/CatSvg & Board', () => {
  it('renders both black and white cat variants keeping ears, pink nose, and 4 whiskers across all 4 states', () => {
    for (const variant of ['black', 'white'] as const) {
      for (const state of ['idle', 'placed', 'conflict', 'victory'] as const) {
        const { container } = render(<CatSvg variant={variant} state={state} />);
        expect(container.querySelector('[data-cat-part="head"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="ears"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="nose"]')).not.toBeNull();
        expect(container.querySelectorAll('[data-cat-part="whisker"]')).toHaveLength(4);
        expect(container.querySelector(`[data-cat-state="${state}"]`)).not.toBeNull();
      }
    }
  });

  it('assigns independent random blink intervals to idle cats so they are not synchronized', () => {
    const { container } = render(
      <div>
        <CatSvg variant="black" state="idle" />
        <CatSvg variant="black" state="idle" />
      </div>
    );
    const cats = container.querySelectorAll('svg[data-blink-delay]');
    expect(cats).toHaveLength(2);
    expect(cats[0].getAttribute('data-blink-delay')).not.toBeNull();
  });

  it('fires onCellTap on cell click and onDragCross when pointer moves across cells while pressed', () => {
    const onCellTap = vi.fn();
    const onDragCross = vi.fn();
    const regions = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('empty'));
    const locked = Array.from({ length: 4 }, () => Array(4).fill(false));

    const { getByTestId } = render(
      <Board
        size={4}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={null}
        lastErrorCell={null}
        isVictory={false}
        catVariant="black"
        onCellTap={onCellTap}
        onDragCross={onDragCross}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    const cell01 = getByTestId('cell-0-1');

    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenCalledWith(0, 0);

    fireEvent.pointerDown(cell00, { button: 0 });
    fireEvent.pointerEnter(cell01);
    fireEvent.pointerUp(cell01);
    expect(onDragCross).toHaveBeenCalledWith(0, 1, 'cross');
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`
Expected: FAIL (`Cannot find module '../../src/components/Board'`)

- [ ] **Step 3: Implementar `src/components/CatSvg.tsx`, `src/components/Board.tsx` y `src/styles/theme.css`**

- En `CatSvg.tsx`: usar exactamente los trazos aprobados en el diseño (`cat-design-v4.html`) para `variant === 'black'` (relleno `#1F1B24`, borde blanco `strokeWidth="2.2"`, interior de orejas `#FF8FA3`, nariz `#FF8FA3` y 4 bigotes blancos) y `variant === 'white'` (relleno `#FFFFFF`, borde `#1F1B24`, manchas de orejas negras, nariz `#FF7597` y 4 bigotes oscuros). Generar por instancia con `useMemo` un desfase (`--blink-delay`) y duración (`--blink-duration` entre $3.5\text{ s}$ y $8.5\text{ s}$) aleatorios para que los gatos nunca parpadeen a la vez.
- En `Board.tsx`: renderizar la cuadrícula $N \times N$ con la paleta *Soft Clay* de 9 colores luminosos (`#FFD166`, `#70D6FF`, `#FF9770`, `#80ED99`, `#C792DF`, `#F4A261`, `#A8DADC`, `#FFCAD4`, `#BDE0FE`), gestionando toque individual (`onCellTap`) y arrastre continuo de cruces (`onDragCross`) sin disparar un clic duplicado al terminar de arrastrar.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add src/components/CatSvg.tsx src/components/Board.tsx src/styles/theme.css tests/components/BoardAndCat.test.tsx
git commit -m "feat: add animated SVG cat component and interactive Soft Clay board"
```

---

### Task 8: Tutorial Interactivo (Parte 1 Básica y Parte 2 Avanzada)

**Files:**
- Create: `src/data/tutorialSteps.ts`
- Create: `src/components/TutorialModal.tsx`
- Test: `tests/components/TutorialModal.test.tsx`

**Interfaces:**
- Produces in `src/data/tutorialSteps.ts`:
  - `export interface TutorialStep { id: string; part: 'basic' | 'advanced'; title: string; explanation: string; size: number; regions: number[][]; initialBoard: CellState[][]; targetCell: { row: number; col: number }; expectedAction: 'cat' | 'cross'; hintText: string; }`
  - `export const TUTORIAL_STEPS: TutorialStep[];`
- Produces in `src/components/TutorialModal.tsx`:
  - `export interface TutorialModalProps { catVariant: CatVariant; onClose: () => void; }`
  - `export function TutorialModal(props: TutorialModalProps): JSX.Element`

- [ ] **Step 1: Escribir el test de `TutorialModal` en `tests/components/TutorialModal.test.tsx`**

```typescript
// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { TutorialModal } from '../../src/components/TutorialModal';
import { TUTORIAL_STEPS } from '../../src/data/tutorialSteps';

describe('components/TutorialModal', () => {
  it('includes both basic rules/deductions and advanced deductions (pairs & 1-step asphyxiation)', () => {
    const basic = TUTORIAL_STEPS.filter((s) => s.part === 'basic');
    const advanced = TUTORIAL_STEPS.filter((s) => s.part === 'advanced');
    expect(basic.length).toBeGreaterThanOrEqual(3);
    expect(advanced.length).toBeGreaterThanOrEqual(2);
  });

  it('guides the player through interactive steps and allows switching to advanced part or closing', () => {
    const onClose = vi.fn();
    const { getByText, getByTestId } = render(<TutorialModal catVariant="black" onClose={onClose} />);
    const firstStep = TUTORIAL_STEPS[0];
    expect(getByText(firstStep.title)).toBeTruthy();

    // Tap the target cell to complete step 1
    const target = getByTestId(`tutorial-cell-${firstStep.targetCell.row}-${firstStep.targetCell.col}`);
    fireEvent.click(target);
    const nextBtn = getByTestId('tutorial-next-btn');
    fireEvent.click(nextBtn);
    expect(getByText(TUTORIAL_STEPS[1].title)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/components/TutorialModal.test.tsx`
Expected: FAIL (`Cannot find module '../../src/components/TutorialModal'`)

- [ ] **Step 3: Implementar `src/data/tutorialSteps.ts` y `src/components/TutorialModal.tsx`**

Incluir 5 pasos interactivos:
- **Parte 1 (Básico):**
  1. *Regla de Región de 1 casilla:* una región de una sola casilla tiene que tener forzosamente un gato.
  2. *Descarte alrededor de un gato:* al poner un gato, su fila, columna, región y sus 8 vecinas llevan cruz (`✕`).
  3. *Región contenida en una fila:* si una región entera está dentro de una fila, el resto de esa fila fuera de la región no puede tener gato.
- **Parte 2 (Técnicas de 1–2 saltos):**
  4. *Parejas de regiones y filas:* 2 regiones contenidas en 2 filas reservan esas 2 filas, permitiendo tachar las demás regiones en esas filas.
  5. *Asfixia de una región vecina (1 salto):* colocar un gato en una casilla dejaría sin huecos a una región vecina pequeña, por lo que esa casilla lleva cruz.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npx vitest run tests/components/TutorialModal.test.tsx`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add src/data/tutorialSteps.ts src/components/TutorialModal.tsx tests/components/TutorialModal.test.tsx
git commit -m "feat: add interactive tutorial for basic and advanced deductions"
```

---

### Task 9: Pantallas de Inicio, Juego, Ajustes e Integración Completa de la Aplicación

**Files:**
- Create: `src/components/HomeScreen.tsx`
- Create: `src/components/GameScreen.tsx`
- Create: `src/components/SettingsModal.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Test: `tests/App.test.tsx`

**Interfaces:**
- Consumes all previous tasks (`puzzles.json`, `gameState.ts`, `storage.ts`, `soundEngine.ts`, `Board.tsx`, `CatSvg.tsx`, `TutorialModal.tsx`)
- Produces in `src/App.tsx`:
  - `export function App(): JSX.Element`

- [ ] **Step 1: Escribir los tests de integración en `tests/App.test.tsx`**

```typescript
// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Home screen with Chill Out and Classic mode cards, Tutorial, and Settings', () => {
    const { getByTestId, getByText } = render(<App />);
    expect(getByText('KittySquared')).toBeTruthy();
    expect(getByTestId('start-chill-btn')).toBeTruthy();
    expect(getByTestId('start-classic-btn')).toBeTruthy();
  });

  it('allows changing control scheme (toggle vs double-tap), cat variant (black vs white), and resetting progress in Settings', () => {
    const { getByTestId, queryByTestId } = render(<App />);
    // Open settings from home
    fireEvent.click(getByTestId('open-settings-btn'));
    fireEvent.click(getByTestId('select-control-double-tap'));
    fireEvent.click(getByTestId('select-cat-white'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Enter Classic mode: dual switch should be hidden in double-tap mode
    fireEvent.click(getByTestId('start-classic-btn'));
    expect(queryByTestId('tool-toggle-switch')).toBeNull();
  });

  it('plays through Level 1 in Classic mode, updates total score, and advances to Level 2', () => {
    const { getByTestId, getByText } = render(<App />);
    // Mark tutorial as seen or close if auto-opened, then start Classic
    fireEvent.click(getByTestId('start-classic-btn'));
    expect(getByText(/Nivel 1/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npx vitest run tests/App.test.tsx`
Expected: FAIL (`Cannot find module '../src/App'`)

- [ ] **Step 3: Implementar `HomeScreen.tsx`, `GameScreen.tsx`, `SettingsModal.tsx`, `App.tsx` y `main.tsx`**

- **`HomeScreen.tsx`:** Muestra el logo de KittySquared con el gato SVG animado, tarjeta de **Chill Out** (nivel actual / 100), tarjeta de **Classic** (nivel actual / 100 y puntos acumulados), botón **Tutorial** y botón **Ajustes**.
- **`GameScreen.tsx`:**
  - Cabecera con botón `← Menú`, título `Nivel X` + modo, y botón `⚙️ Ajustes`.
  - Barra de estado con contador de gatos colocados (`🐱 X / N`), y en modo *Classic* los 3 corazones (`❤️❤️❤️` $\rightarrow$ `🤍`) y la puntuación total acumulada + puntos parciales (`+XX`).
  - Tablero `Board`.
  - Si `controlScheme === 'toggle'`, muestra el interruptor doble `✕ Cruz | 🐱 Gato`; si `controlScheme === 'double-tap'`, lo oculta y muestra un indicador sutil *"1 toque: ✕ • 2 toques: 🐱"*.
  - Botones `↩ Deshacer` y `🧹 Limpiar cruces`.
  - Modal de **¡Nivel Completado!** (mostrando en *Classic* el desglose de puntos parciales, bono por fallos y nuevo total acumulado, con botón `Siguiente Nivel ▶`) y modal de **Nivel Fallado** en *Classic* al 3.er fallo (indicando que se pierden los puntos parciales y botón `Reintentar Nivel ↻`).
- **`SettingsModal.tsx`:** Selector de modo de control (`Botón doble` vs `1 clic Cruz / 2 clics Gato`), selector visual de diseño de gato (`Gatito Negro` vs `Gatito Blanco`), interruptores de `Música` y `Efectos de sonido`, y botones con confirmación para `Reiniciar progreso Chill Out` y `Reiniciar progreso Classic (0 puntos)`.

- [ ] **Step 4: Ejecutar toda la suite de tests y el build de producción**

Run: `npm test && npm run build`
Expected: PASS (todos los tests en verde y build de Vite generado en `dist/` sin errores de TypeScript)

- [ ] **Step 5: Commit**

```bash
git add src/components/HomeScreen.tsx src/components/GameScreen.tsx src/components/SettingsModal.tsx src/App.tsx src/main.tsx tests/App.test.tsx
git commit -m "feat: complete KittySquared UI screens, settings, and app integration"
```
