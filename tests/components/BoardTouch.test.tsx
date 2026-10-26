// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Board } from '../../src/components/Board';
import { CellState } from '../../src/types/puzzle';

describe('Board touch drag pointer capture', () => {
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
});
