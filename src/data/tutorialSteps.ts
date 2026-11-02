import { CellState, PuzzleDef } from '../types/puzzle';
import { LevelSessionState } from '../state/gameState';

export interface TutorialStep {
  id: string;
  part: 'basic' | 'advanced';
  title: string;
  explanation: string;
  size: number;
  puzzle: PuzzleDef;
  initialBoard: CellState[][];
  initialLockedCats?: boolean[][];
  initialErrorCrosses?: boolean[][];
  initialMistakes?: number;
  targetHighlightCells?: { row: number; col: number }[];
  hintText: string;
  isComplete: (session: LevelSessionState, initialSession: LevelSessionState) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // 1. Regla fundamental y Doble toque
  {
    id: 'step-1',
    part: 'basic',
    title: '1. Fila, columna y región (Doble toque)',
    explanation:
      'Cada fila, columna y región de color debe contener exactamente 1 gato. En este tablero solo falta el gato de la tercera fila. ¡Haz doble toque en la única casilla libre posible para colocarlo!',
    size: 4,
    puzzle: {
      id: 1001,
      size: 4,
      difficulty: 'easy',
      solution: [1, 3, 0, 2],
      regions: [
        [0, 0, 1, 1],
        [0, 2, 1, 1],
        [3, 2, 2, 1],
        [3, 3, 2, 2],
      ],
    },
    initialBoard: [
      ['empty', 'cat', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'cat'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'cat', 'empty'],
    ],
    initialLockedCats: [
      [false, true, false, false],
      [false, false, false, true],
      [false, false, false, false],
      [false, false, true, false],
    ],
    targetHighlightCells: [{ row: 2, col: 0 }],
    hintText: 'Haz doble toque en la casilla (2, 0) para colocar el gato.',
    isComplete: (session) => session.board[2][0] === 'cat',
  },

  // 2. Los gatos no se tocan
  {
    id: 'step-2',
    part: 'basic',
    title: '2. Los gatos no pueden tocarse',
    explanation:
      'Ningún gato puede estar en las 8 casillas vecinas de otro gato (ni en horizontal, vertical ni diagonal). En la región naranja de la derecha, una casilla toca al gato en diagonal y la otra no. ¡Haz doble toque en la casilla válida!',
    size: 4,
    puzzle: {
      id: 1002,
      size: 4,
      difficulty: 'easy',
      solution: [1, 3, 0, 2],
      regions: [
        [0, 0, 1, 1],
        [0, 2, 1, 1],
        [3, 2, 2, 1],
        [3, 3, 2, 2],
      ],
    },
    initialBoard: [
      ['empty', 'cat', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['cat', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'cat', 'empty'],
    ],
    initialLockedCats: [
      [false, true, false, false],
      [false, false, false, false],
      [true, false, false, false],
      [false, false, true, false],
    ],
    targetHighlightCells: [{ row: 1, col: 3 }],
    hintText: 'Haz doble toque en la casilla (1, 3), la única que no toca a ningún gato.',
    isComplete: (session) => session.board[1][3] === 'cat',
  },

  // 3. Cruces y descartes múltiples (1 toque)
  {
    id: 'step-3',
    part: 'basic',
    title: '3. Cruces y descartes (1 toque)',
    explanation:
      'Al colocar un gato, ninguna otra casilla de su misma fila puede tener gato. Las cruces te permiten descartarlas con 1 solo toque. ¡Marca con cruz todas las casillas vacías de la primera fila!',
    size: 4,
    puzzle: {
      id: 1003,
      size: 4,
      difficulty: 'easy',
      solution: [0, 2, 3, 1],
      regions: [
        [0, 1, 1, 1],
        [0, 2, 2, 1],
        [0, 2, 3, 3],
        [0, 2, 3, 3],
      ],
    },
    initialBoard: [
      ['cat', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    initialLockedCats: [
      [true, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ],
    targetHighlightCells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
    hintText: 'Toca las casillas (0, 1), (0, 2) y (0, 3) para ponerles una cruz.',
    isComplete: (session) =>
      session.board[0][1] === 'cross' &&
      session.board[0][2] === 'cross' &&
      session.board[0][3] === 'cross',
  },

  // 4. Fallos y vidas (Cruces rojas)
  {
    id: 'step-4',
    part: 'basic',
    title: '4. Fallos y vidas (Cruces rojas)',
    explanation:
      'Tienes 3 vidas. Si colocas un gato en una casilla incorrecta, cometes un fallo, pierdes una vida y la casilla se bloquea con una cruz roja. ¡Haz doble toque en la casilla resaltada para ver qué ocurre!',
    size: 4,
    puzzle: {
      id: 1004,
      size: 4,
      difficulty: 'easy',
      solution: [1, 3, 0, 2],
      regions: [
        [0, 0, 1, 1],
        [0, 2, 1, 1],
        [3, 2, 2, 1],
        [3, 3, 2, 2],
      ],
    },
    initialBoard: [
      ['empty', 'cat', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    initialLockedCats: [
      [false, true, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ],
    initialMistakes: 0,
    targetHighlightCells: [{ row: 0, col: 2 }],
    hintText: 'Haz doble toque en la casilla resaltada (0, 2) para provocar el fallo.',
    isComplete: (session, initial) =>
      session.mistakes > (initial.mistakes || 0) && (session.errorCrosses?.[0]?.[2] ?? false),
  },

  // 5. Quitar cruces
  {
    id: 'step-5',
    part: 'basic',
    title: '5. Quitar cruces',
    explanation:
      'A diferencia de las cruces rojas de fallo, las cruces normales son notas que puedes borrar cuando quieras. ¡Toca la cruz de la casilla resaltada para quitarla y dejarla vacía!',
    size: 4,
    puzzle: {
      id: 1005,
      size: 4,
      difficulty: 'easy',
      solution: [1, 3, 0, 2],
      regions: [
        [0, 0, 1, 1],
        [0, 2, 1, 1],
        [3, 2, 2, 1],
        [3, 3, 2, 2],
      ],
    },
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'cross', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    targetHighlightCells: [{ row: 1, col: 2 }],
    hintText: 'Haz 1 toque en la casilla (1, 2) para quitar la cruz.',
    isComplete: (session) => session.board[1][2] === 'empty',
  },

  // 6. Región de 1 casilla
  {
    id: 'step-6',
    part: 'advanced',
    title: '6. Región de una sola casilla',
    explanation:
      'Cada región de color debe contener exactamente 1 gato. ¡Si una región solo tiene una casilla libre, el gato va forzosamente ahí!',
    size: 4,
    puzzle: {
      id: 1006,
      size: 4,
      difficulty: 'easy',
      solution: [0, 2, 3, 1],
      regions: [
        [0, 1, 1, 1],
        [2, 2, 3, 1],
        [2, 3, 3, 1],
        [2, 2, 3, 3],
      ],
    },
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    targetHighlightCells: [{ row: 0, col: 0 }],
    hintText: 'Haz doble toque en la casilla (0, 0) de color amarillo para colocar el gato.',
    isComplete: (session) => session.board[0][0] === 'cat',
  },

  // 7. Región contenida en una fila
  {
    id: 'step-7',
    part: 'advanced',
    title: '7. Región contenida en una fila',
    explanation:
      'Si todas las casillas libres de una región están dentro de la misma fila, el gato de esa fila estará en esa región. Por tanto, ninguna otra casilla de esa fila puede tener gato. ¡Coloca cruces en las casillas exteriores de la fila superior!',
    size: 4,
    puzzle: {
      id: 1007,
      size: 4,
      difficulty: 'easy',
      solution: [1, 3, 0, 2],
      regions: [
        [0, 0, 1, 1],
        [2, 2, 1, 1],
        [2, 2, 3, 3],
        [2, 2, 3, 3],
      ],
    },
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty'],
    ],
    targetHighlightCells: [
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
    hintText: 'Toca las casillas (0, 2) y (0, 3) de la región azul para descartarlas con cruz.',
    isComplete: (session) =>
      session.board[0][2] === 'cross' && session.board[0][3] === 'cross',
  },

  // 8. Parejas de regiones y filas
  {
    id: 'step-8',
    part: 'advanced',
    title: '8. Parejas de regiones y líneas',
    explanation:
      'Si 2 regiones solo tienen casillas libres dentro de las mismas 2 filas, sus 2 gatos llenarán esas 2 filas. Cualquier otra casilla en esas dos filas queda descartada con cruz.',
    size: 5,
    puzzle: {
      id: 1008,
      size: 5,
      difficulty: 'medium',
      solution: [0, 2, 4, 1, 3],
      regions: [
        [0, 0, 1, 1, 2],
        [0, 0, 1, 1, 2],
        [3, 3, 4, 2, 2],
        [3, 3, 4, 4, 4],
        [3, 4, 4, 4, 4],
      ],
    },
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
    ],
    targetHighlightCells: [
      { row: 0, col: 4 },
      { row: 1, col: 4 },
    ],
    hintText: 'Toca las casillas (0, 4) y (1, 4) para descartarlas con cruces.',
    isComplete: (session) =>
      session.board[0][4] === 'cross' && session.board[1][4] === 'cross',
  },

  // 9. Asfixia a 1 salto de anticipación
  {
    id: 'step-9',
    part: 'advanced',
    title: '9. Asfixia a 1 salto de anticipación',
    explanation:
      'Si al imaginar un gato en una casilla, sus vecinas taparan TODAS las casillas libres de una región vecina, esa casilla es imposible. ¡Tacha con una cruz la casilla que asfixiaría a la región vecina!',
    size: 5,
    puzzle: {
      id: 1009,
      size: 5,
      difficulty: 'medium',
      solution: [0, 3, 1, 4, 2],
      regions: [
        [0, 0, 1, 2, 2],
        [0, 0, 1, 2, 2],
        [3, 3, 4, 2, 2],
        [3, 3, 4, 4, 4],
        [3, 4, 4, 4, 4],
      ],
    },
    initialBoard: [
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
      ['empty', 'empty', 'empty', 'empty', 'empty'],
    ],
    targetHighlightCells: [{ row: 0, col: 2 }],
    hintText: 'Toca la casilla (0, 2) que asfixiaría a la región vecina para marcar una cruz.',
    isComplete: (session) => session.board[0][2] === 'cross',
  },
];
