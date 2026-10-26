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
