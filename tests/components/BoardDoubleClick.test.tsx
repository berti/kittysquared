// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { useState } from 'preact/hooks';
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

  describe('translucent cross while double-tap is pending', () => {
    function InteractiveTestBoard({
      timeoutMs = 500,
      initialBoard,
    }: {
      timeoutMs?: number;
      initialBoard?: CellState[][];
    }) {
      const [board, setBoard] = useState<CellState[][]>(
        initialBoard || [
          ['empty', 'empty'],
          ['empty', 'empty'],
        ]
      );

      const handleCellTap = (r: number, c: number, options?: { isDoubleTap?: boolean }) => {
        setBoard((prev) => {
          const next = prev.map((row) => [...row]);
          if (options?.isDoubleTap) {
            next[r][c] = next[r][c] === 'cat' ? 'empty' : 'cat';
          } else {
            next[r][c] = next[r][c] === 'cross' ? 'empty' : 'cross';
          }
          return next;
        });
      };

      const handleDragCross = (r: number, c: number, targetState: 'cross' | 'empty') => {
        setBoard((prev) => {
          const next = prev.map((row) => [...row]);
          next[r][c] = targetState;
          return next;
        });
      };

      return (
        <Board
          size={2}
          regions={[
            [0, 1],
            [0, 1],
          ]}
          board={board}
          lockedCats={[
            [false, false],
            [false, false],
          ]}
          conflictingKeys={new Set()}
          lastPlacedCat={null}
          lastErrorCell={null}
          isVictory={false}
          catVariant="black"
          doubleTapTimeoutMs={timeoutMs}
          onCellTap={handleCellTap}
          onDragCross={handleDragCross}
        />
      );
    }

    it('displays a translucent cross on single tap and turns completely white when timer expires', () => {
      const { getByTestId } = render(<InteractiveTestBoard timeoutMs={500} />);
      const cell00 = getByTestId('cell-0-0');

      // Tap cell (0, 0) -> cross is placed
      fireEvent.click(cell00);
      const cross = cell00.querySelector('.cross-mark') as SVGElement;
      expect(cross).not.toBeNull();
      expect(cross.classList.contains('cross-mark-translucent')).toBe(true);
      expect(cross.style.opacity).toBe('0.45');

      // Advance timer by 499ms -> cross still translucent
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(cross.classList.contains('cross-mark-translucent')).toBe(true);
      expect(cross.style.opacity).toBe('0.45');

      // Advance timer 1ms (500ms total) -> timer expires, cross becomes solid white
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(cross.classList.contains('cross-mark-translucent')).toBe(false);
      expect(cross.style.opacity).not.toBe('0.45');
    });

    it('turns previous translucent cross completely white when another cell is tapped', () => {
      const { getByTestId } = render(<InteractiveTestBoard timeoutMs={500} />);
      const cell00 = getByTestId('cell-0-0');
      const cell01 = getByTestId('cell-0-1');

      // Tap cell (0, 0)
      fireEvent.click(cell00);
      const cross00 = cell00.querySelector('.cross-mark') as SVGElement;
      expect(cross00.classList.contains('cross-mark-translucent')).toBe(true);

      // Advance only 200ms (timer not expired), then tap cell (0, 1)
      act(() => {
        vi.advanceTimersByTime(200);
      });
      fireEvent.click(cell01);

      // Cell (0, 0) cross immediately becomes solid white
      expect(cross00.classList.contains('cross-mark-translucent')).toBe(false);
      expect(cross00.style.opacity).not.toBe('0.45');

      // Cell (0, 1) cross is now translucent
      const cross01 = cell01.querySelector('.cross-mark') as SVGElement;
      expect(cross01).not.toBeNull();
      expect(cross01.classList.contains('cross-mark-translucent')).toBe(true);
      expect(cross01.style.opacity).toBe('0.45');
    });

    it('replaces translucent cross with cat upon double-tap within timeout threshold', () => {
      const { getByTestId } = render(<InteractiveTestBoard timeoutMs={500} />);
      const cell00 = getByTestId('cell-0-0');

      // 1st tap -> translucent cross
      fireEvent.click(cell00);
      expect(cell00.querySelector('.cross-mark-translucent')).not.toBeNull();

      // 2nd tap after 150ms -> double tap registered, cat placed
      act(() => {
        vi.advanceTimersByTime(150);
      });
      fireEvent.click(cell00);

      expect(cell00.querySelector('.cross-mark')).toBeNull();
      expect(cell00.querySelector('.cat-svg')).not.toBeNull();
    });

    it('cancels pending translucent cross when a drag action across cells occurs', () => {
      const { getByTestId } = render(<InteractiveTestBoard timeoutMs={500} />);
      const cell00 = getByTestId('cell-0-0');
      const cell01 = getByTestId('cell-0-1');
      const cell11 = getByTestId('cell-1-1');

      // Single tap on (0, 0) -> translucent cross
      fireEvent.click(cell00);
      const cross00 = cell00.querySelector('.cross-mark') as SVGElement;
      expect(cross00.classList.contains('cross-mark-translucent')).toBe(true);

      // Drag across cells (0, 1) -> (1, 1)
      fireEvent.pointerDown(cell01, { button: 0 });
      fireEvent.pointerEnter(cell11);
      fireEvent.pointerUp(cell11);

      // Previous translucent cross at (0, 0) is now solid white
      expect(cross00.classList.contains('cross-mark-translucent')).toBe(false);
      expect(cross00.style.opacity).not.toBe('0.45');
    });
  });
});
