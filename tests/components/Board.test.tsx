// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../../src/components/Board';
import { CellState } from '../../src/types/puzzle';

describe('Board autoCross wave animation', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const regions = [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
    [2, 2, 3, 3],
    [2, 2, 3, 3],
  ];

  it('applies cross-wave class and staggered animation-delay based on distance from placed cat', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('empty'));
    const locked = Array.from({ length: 4 }, () => Array(4).fill(false));

    // Cat at (1, 1)
    board[1][1] = 'cat';
    locked[1][1] = true;

    // Auto crosses at (1, 0) [dist 1], (1, 2) [dist 1], (1, 3) [dist 2]
    board[1][0] = 'cross';
    board[1][2] = 'cross';
    board[1][3] = 'cross';

    const autoCrossCells = [
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ];

    const { getByTestId } = render(
      <Board
        size={4}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={{ row: 1, col: 1 }}
        lastErrorCell={null}
        autoCrossCells={autoCrossCells}
        isVictory={false}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={vi.fn()}
      />
    );

    const cell10 = getByTestId('cell-1-0').querySelector('.cross-mark');
    const cell12 = getByTestId('cell-1-2').querySelector('.cross-mark');
    const cell13 = getByTestId('cell-1-3').querySelector('.cross-mark');

    // All auto-crossed cells should have the cross-wave class
    expect(cell10?.classList.contains('cross-wave')).toBe(true);
    expect(cell12?.classList.contains('cross-wave')).toBe(true);
    expect(cell13?.classList.contains('cross-wave')).toBe(true);

    // Distance 1: max(|1-1|, |0-1|) = 1 -> 35ms
    expect((cell10 as HTMLElement)?.style.animationDelay).toBe('35ms');
    expect((cell12 as HTMLElement)?.style.animationDelay).toBe('35ms');

    // Distance 2: max(|1-1|, |3-1|) = 2 -> 70ms
    expect((cell13 as HTMLElement)?.style.animationDelay).toBe('70ms');
  });

  it('does not apply cross-wave to manual crosses not in autoCrossCells', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('empty'));
    const locked = Array.from({ length: 4 }, () => Array(4).fill(false));

    board[0][0] = 'cross'; // manual cross

    const { getByTestId } = render(
      <Board
        size={4}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={{ row: 2, col: 2 }}
        lastErrorCell={null}
        autoCrossCells={[]} // no auto crosses
        isVictory={false}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={vi.fn()}
      />
    );

    const cell00 = getByTestId('cell-0-0').querySelector('.cross-mark');
    expect(cell00?.classList.contains('cross-wave')).toBe(false);
  });

  it('renders staggered victory glow and per-cat confetti burst on cat cells when isVictory is true', () => {
    const board: CellState[][] = Array.from({ length: 4 }, () => Array(4).fill('cross'));
    const locked = Array.from({ length: 4 }, () => Array(4).fill(false));
    board[0][1] = 'cat';
    board[2][3] = 'cat';

    const { getByTestId, queryByTestId } = render(
      <Board
        size={4}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={{ row: 2, col: 3 }}
        lastErrorCell={null}
        autoCrossCells={[]}
        isVictory={true}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={vi.fn()}
      />
    );

    const catCell0 = getByTestId('cell-0-1');
    const catCell2 = getByTestId('cell-2-3');
    expect(catCell0.classList.contains('board-cell-victory-glow')).toBe(true);
    expect(catCell2.classList.contains('board-cell-victory-glow')).toBe(true);

    const confetti0 = getByTestId('cat-confetti-0-1');
    const confetti2 = getByTestId('cat-confetti-2-3');
    expect(confetti0.querySelectorAll('.cat-confetti-piece').length).toBe(6);
    expect(confetti2.querySelectorAll('.cat-confetti-piece').length).toBe(6);

    // Non-cat cells do not render cat confetti
    expect(queryByTestId('cat-confetti-0-0')).toBeNull();
  });

  it('scales cat victory wave stagger on 10x10 boards so row 9 starts well before the 1400ms modal timeout', () => {
    const size = 10;
    const regions10 = Array.from({ length: size }, (_, r) => Array(size).fill(r));
    const board10: CellState[][] = Array.from({ length: size }, () => Array(size).fill('cross'));
    const locked10 = Array.from({ length: size }, () => Array(size).fill(false));
    board10[9][4] = 'cat';

    const { getByTestId } = render(
      <Board
        size={size}
        regions={regions10}
        board={board10}
        lockedCats={locked10}
        conflictingKeys={new Set()}
        lastPlacedCat={{ row: 9, col: 4 }}
        lastErrorCell={null}
        autoCrossCells={[]}
        isVictory={true}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={vi.fn()}
      />
    );

    const catCell9 = getByTestId('cell-9-4');
    const delayStr = catCell9.style.getPropertyValue('--cat-wave-delay');
    const delayMs = parseInt(delayStr, 10);
    expect(delayMs).toBeLessThanOrEqual(900);
  });
});

describe('Board adaptive sizing for 4x4, 8x8, and 10x10 boards', () => {
  const createBoardProps = (size: number) => ({
    size,
    regions: Array.from({ length: size }, () => Array(size).fill(0)),
    board: Array.from({ length: size }, () => Array(size).fill('empty') as CellState[]),
    lockedCats: Array.from({ length: size }, () => Array(size).fill(false)),
    conflictingKeys: new Set<string>(),
    lastPlacedCat: null,
    lastErrorCell: null,
    isVictory: false,
    catVariant: 'black' as const,
    onCellTap: vi.fn(),
    onDragCross: vi.fn(),
  });

  it('renders size 4 board with 6px gap, 8px padding, 10px radius', () => {
    const { container } = render(<Board {...createBoardProps(4)} />);
    const grid = container.querySelector('.board-grid') as HTMLElement;
    expect(grid.getAttribute('data-board-size')).toBe('4');
    expect(grid.style.getPropertyValue('--board-gap')).toBe('6px');
    expect(grid.style.getPropertyValue('--board-padding')).toBe('8px');
    expect(grid.style.getPropertyValue('--cell-radius')).toBe('10px');
  });

  it('renders size 8 board with 4px gap, 7px padding, 8px radius', () => {
    const { container } = render(<Board {...createBoardProps(8)} />);
    const grid = container.querySelector('.board-grid') as HTMLElement;
    expect(grid.getAttribute('data-board-size')).toBe('8');
    expect(grid.style.getPropertyValue('--board-gap')).toBe('4px');
    expect(grid.style.getPropertyValue('--board-padding')).toBe('7px');
    expect(grid.style.getPropertyValue('--cell-radius')).toBe('8px');
  });

  it('renders size 10 board with 3px gap, 6px padding, 6px radius and scaled glyph icon size 10', () => {
    const { container } = render(
      <Board {...createBoardProps(10)} regionAssist="glyphs" />
    );
    const grid = container.querySelector('.board-grid') as HTMLElement;
    expect(grid.getAttribute('data-board-size')).toBe('10');
    expect(grid.style.getPropertyValue('--board-gap')).toBe('3px');
    expect(grid.style.getPropertyValue('--board-padding')).toBe('6px');
    expect(grid.style.getPropertyValue('--cell-radius')).toBe('6px');

    const glyphSvg = container.querySelector('svg[data-region-glyph]');
    expect(glyphSvg?.getAttribute('width')).toBe('10');
  });
});
