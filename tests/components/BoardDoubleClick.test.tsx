// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Board } from '../../src/components/Board';
import { CellState } from '../../src/types/puzzle';

describe('Board double-click / double-tap timing behavior', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  it('passes single tap on first click, and flags double tap if second click is on the same cell within timeout threshold', () => {
    const onCellTap = vi.fn();
    const regions = [
      [0, 1],
      [0, 1],
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
        onCellTap={onCellTap}
        onDragCross={vi.fn()}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    const cell01 = getByTestId('cell-0-1');

    // 1. Click cell (0,0) -> first click
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenCalledTimes(1);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: false });

    // 2. Click cell (0,0) again within 400ms -> should be isDoubleTap: true
    vi.advanceTimersByTime(400);
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenCalledTimes(2);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: true });

    // 3. Click cell (0,0) after more than 1000ms -> should reset, isDoubleTap: false
    vi.advanceTimersByTime(1200);
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenCalledTimes(3);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: false });

    // 4. Click cell A, then cell B, then cell A within 300ms -> clicking B resets timer for A
    vi.advanceTimersByTime(100);
    fireEvent.click(cell01);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 1, { isDoubleTap: false });

    vi.advanceTimersByTime(100);
    fireEvent.click(cell00);
    // Even though cell00 was clicked 200ms ago earlier, the click on cell01 reset it
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: false });
  });

  it('respects custom doubleTapTimeoutMs prop', () => {
    const onCellTap = vi.fn();
    const regions = [
      [0, 1],
      [0, 1],
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
        doubleTapTimeoutMs={300}
        onCellTap={onCellTap}
        onDragCross={vi.fn()}
      />
    );

    const cell00 = getByTestId('cell-0-0');

    // First click
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: false });

    // Second click after 350ms (exceeds 300ms timeout) -> should NOT be double tap
    vi.advanceTimersByTime(350);
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: false });

    // Third click after 200ms (within 300ms timeout) -> should BE double tap
    vi.advanceTimersByTime(200);
    fireEvent.click(cell00);
    expect(onCellTap).toHaveBeenLastCalledWith(0, 0, { isDoubleTap: true });
  });
});
