// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../../src/components/Board';
import { CellState } from '../../src/types/puzzle';

describe('Board touch drag pointer capture', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('releases pointer capture on pointerdown for mobile touch drag support', () => {
    const onDragCross = vi.fn();
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const board: CellState[][] = [
      ['empty', 'empty'],
      ['empty', 'empty'],
    ];
    const locked = [
      [false, false],
      [false, false],
    ];

    const { getByTestId } = render(
      <Board
        size={2}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={null}
        lastErrorCell={null}
        isVictory={false}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={onDragCross}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    let releasedCaptureId: number | null = null;
    (cell00 as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture = (id: number) => {
      releasedCaptureId = id;
    };

    const evt = new Event('pointerdown', { bubbles: true });
    Object.assign(evt, { button: 0, pointerId: 42 });
    fireEvent(cell00, evt);

    expect(releasedCaptureId).toBe(42);
  });

  it('supports mobile touch drag across cells via pointermove and document.elementFromPoint', () => {
    const onDragCross = vi.fn();
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const board: CellState[][] = [
      ['empty', 'empty'],
      ['empty', 'empty'],
    ];
    const locked = [
      [false, false],
      [false, false],
    ];

    const { getByTestId, container } = render(
      <Board
        size={2}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={null}
        lastErrorCell={null}
        isVictory={false}
        catVariant="black"
        onCellTap={vi.fn()}
        onDragCross={onDragCross}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    const cell01 = getByTestId('cell-0-1');
    const grid = container.querySelector('.board-grid') as HTMLElement;

    const originalEFP = document.elementFromPoint;
    document.elementFromPoint = (x: number, _y: number) => {
      if (x >= 50) return cell01;
      return cell00;
    };

    try {
      const evtDown = new Event('pointerdown', { bubbles: true });
      Object.assign(evtDown, { button: 0, clientX: 10, clientY: 10, pointerId: 1 });
      fireEvent(cell00, evtDown);

      const evtMove = new Event('pointermove', { bubbles: true });
      Object.assign(evtMove, { clientX: 60, clientY: 10, pointerId: 1 });
      fireEvent(grid, evtMove);

      const evtUp = new Event('pointerup', { bubbles: true });
      Object.assign(evtUp, { pointerId: 1 });
      fireEvent(grid, evtUp);

      expect(onDragCross).toHaveBeenCalledTimes(2);
      expect(onDragCross).toHaveBeenNthCalledWith(1, 0, 0, 'cross');
      expect(onDragCross).toHaveBeenNthCalledWith(2, 0, 1, 'cross');
    } finally {
      document.elementFromPoint = originalEFP;
    }
  });
});
