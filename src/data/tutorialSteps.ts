import { CellState } from '../types/puzzle';

export interface TutorialStep {
  id: string;
  part: 'basic' | 'advanced';
  title: string;
  explanation: string;
  size: number;
  regions: number[][];
  initialBoard: CellState[][];
  targetCell: { row: number; col: number };
  expectedAction: 'cat' | 'cross';
  hintText: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // 1. Región de 1 casilla
  {
    id: 'step-1',
    part: 'basic',
    title: '1. Región de una sola casilla',
    explanation:
      'Cada región de color debe contener exactamente 1 gato. ¡Si una región solo tiene una casilla libre, el gato va forzosamente ahí!',
    size: 4,
    regions: [
      [0, 1, 1, 1],
      [2, 2, 3, 1],
      [2, 3, 3, 1],
      [2, 2, 3, 3],
    ],
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    targetCell: { row: 0, col: 0 },
    expectedAction: 'cat',
    hintText: 'Toca la casilla (0, 0) de color amarillo para colocar el gato.',
  },

  // 2. Descarte alrededor de un gato
  {
    id: 'step-2',
    part: 'basic',
    title: '2. Descarte tras colocar un gato',
    explanation:
      'Ningún gato puede tener otro gato en su misma fila, columna, región, ni en sus 8 casillas vecinas (tampoco en diagonal). ¡Colocar cruces ayuda a despejar el camino!',
    size: 4,
    regions: [
      [0, 1, 1, 1],
      [2, 2, 3, 1],
      [2, 3, 3, 1],
      [2, 2, 3, 3],
    ],
    initialBoard: [
      ['cat', 'cross', 'cross', 'cross'],
      ['cross', 'empty', 'empty', 'empty'],
      ['cross', 'empty', 'empty', 'empty'],
      ['cross', 'empty', 'empty', 'empty'],
    ],
    targetCell: { row: 1, col: 1 },
    expectedAction: 'cross',
    hintText: 'Toca la casilla vecina diagonal (1, 1) para marcar una cruz.',
  },

  // 3. Región contenida en una fila
  {
    id: 'step-3',
    part: 'basic',
    title: '3. Región contenida en una fila',
    explanation:
      'Si todas las casillas libres de una región están dentro de la misma fila, el gato de esa fila estará en esa región. Por tanto, ninguna otra casilla de esa fila puede tener gato.',
    size: 4,
    regions: [
      [0, 0, 1, 1],
      [2, 2, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ],
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    targetCell: { row: 0, col: 2 },
    expectedAction: 'cross',
    hintText: 'Toca la casilla (0, 2) de la región azul para descartarla con una cruz.',
  },

  // 4. Parejas de regiones y filas
  {
    id: 'step-4',
    part: 'advanced',
    title: '4. Parejas de regiones y líneas',
    explanation:
      'Si 2 regiones solo tienen casillas libres dentro de las mismas 2 filas, sus 2 gatos llenarán esas 2 filas. Cualquier otra región en esas dos filas queda descartada.',
    size: 5,
    regions: [
      [0, 0, 1, 1, 2],
      [0, 0, 1, 1, 2],
      [3, 3, 4, 2, 2],
      [3, 3, 4, 4, 4],
      [3, 4, 4, 4, 4],
    ],
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
    ],
    targetCell: { row: 0, col: 4 },
    expectedAction: 'cross',
    hintText: 'Toca la casilla (0, 4) de la región morada para tacharla con una cruz.',
  },

  // 5. Asfixia de una región vecina (1 salto de anticipación)
  {
    id: 'step-5',
    part: 'advanced',
    title: '5. Asfixia a 1 salto de anticipación',
    explanation:
      'Si al imaginar un gato en una casilla, sus 8 casillas vecinas taparan TODAS las casillas libres de una región pequeña cercana, esa casilla es imposible.',
    size: 5,
    regions: [
      [0, 0, 1, 2, 2],
      [0, 0, 1, 2, 2],
      [3, 3, 4, 2, 2],
      [3, 3, 4, 4, 4],
      [3, 4, 4, 4, 4],
    ],
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
    ],
    targetCell: { row: 0, col: 2 },
    expectedAction: 'cross',
    hintText: 'Toca la casilla (0, 2) que asfixiaría a la región vecina para marcar una cruz.',
  },
];
