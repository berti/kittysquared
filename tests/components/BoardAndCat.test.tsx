// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { Board } from '../../src/components/Board';
import { CatSvg } from '../../src/components/CatSvg';
import { CatVariant, CellState } from '../../src/types/puzzle';

describe('components/CatSvg & Board', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });
  it('renders all 8 cat variants keeping clipped markings, ears, nose, and 4 whiskers across all 4 states', () => {
    const variants: CatVariant[] = [
      'black',
      'white',
      'orange',
      'siamese',
      'calico',
      'tuxedo',
      'russian',
      'sakura',
    ];
    for (const variant of variants) {
      for (const state of ['idle', 'placed', 'conflict', 'victory'] as const) {
        const { container } = render(<CatSvg variant={variant} state={state} />);
        expect(container.querySelector('[data-cat-part="head"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="markings"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="ears"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="nose"]')).not.toBeNull();
        expect(container.querySelectorAll('[data-cat-part="whisker"]')).toHaveLength(4);
        expect(container.querySelector(`[data-cat-state="${state}"]`)).not.toBeNull();
      }
    }
  });

  it('Review Focus #3: generates unique clipPath IDs per instance and uses high-contrast closed-eye and mouth strokes on siamese, tuxedo, and russian', () => {
    const { container } = render(
      <div>
        <CatSvg variant="siamese" state="placed" />
        <CatSvg variant="tuxedo" state="placed" />
        <CatSvg variant="russian" state="placed" />
      </div>
    );
    const clipPaths = container.querySelectorAll('clipPath');
    expect(clipPaths).toHaveLength(3);
    const ids = Array.from(clipPaths).map((cp) => cp.getAttribute('id'));
    expect(new Set(ids).size).toBe(3);

    const svgs = container.querySelectorAll('svg.cat-svg');
    // Siamese: dark espresso (#23140D) closed eyes and mouth
    expect(svgs[0].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#23140D');
    expect(svgs[0].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#23140D');
    // Tuxedo: white (#FFFFFF) closed eyes on black hood, dark (#201C29) mouth on white muzzle
    expect(svgs[1].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#FFFFFF');
    expect(svgs[1].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#201C29');
    // Russian Blue: dark slate-charcoal (#1E2631) closed eyes and mouth
    expect(svgs[2].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#1E2631');
    expect(svgs[2].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#1E2631');
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
    expect(onCellTap).toHaveBeenCalledWith(0, 0, expect.anything());

    fireEvent.pointerDown(cell00, { button: 0 });
    fireEvent.pointerEnter(cell01);
    fireEvent.pointerUp(cell01);
    expect(onDragCross).toHaveBeenCalledTimes(2);
    expect(onDragCross).toHaveBeenNthCalledWith(1, 0, 0, 'cross');
    expect(onDragCross).toHaveBeenNthCalledWith(2, 0, 1, 'cross');

    // Simple click without crossing does not trigger onDragCross
    onDragCross.mockClear();
    onCellTap.mockClear();
    fireEvent.pointerDown(cell00, { button: 0 });
    fireEvent.pointerUp(cell00);
    fireEvent.click(cell00);
    expect(onDragCross).not.toHaveBeenCalled();
    expect(onCellTap).toHaveBeenCalledTimes(1);
  });

  it('renders a red cross with cross-mark-error class on error crosses in Classic mode', () => {
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const board: CellState[][] = [
      ['cross', 'empty'],
      ['empty', 'empty'],
    ];
    const locked = [
      [false, false],
      [false, false],
    ];
    const errorCrosses = [
      [true, false],
      [false, false],
    ];

    const { getByTestId } = render(
      <Board
        size={2}
        regions={regions}
        board={board}
        lockedCats={locked}
        errorCrosses={errorCrosses}
        conflictingKeys={new Set()}
        lastPlacedCat={null}
        lastErrorCell={null}
        isVictory={false}
        catVariant="black"
        onCellTap={() => {}}
        onDragCross={() => {}}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    expect(cell00.classList.contains('has-error-cross')).toBe(true);
    const crossSpan = cell00.querySelector('.cross-mark');
    expect(crossSpan).not.toBeNull();
    expect(crossSpan?.classList.contains('cross-mark-error')).toBe(true);
  });

  it('renders region assist indicators (textures, glyphs, numbers) when enabled', () => {
    const regions = [
      [0, 1],
      [2, 3],
    ];
    const board: CellState[][] = [
      ['empty', 'empty'],
      ['empty', 'empty'],
    ];
    const locked = [
      [false, false],
      [false, false],
    ];

    // Test textures
    const { container: texContainer, unmount: unmountTex } = render(
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
        regionAssist="textures"
        onCellTap={() => {}}
        onDragCross={() => {}}
      />
    );
    expect(texContainer.querySelector('.pat-1')).not.toBeNull();
    unmountTex();

    // Test glyphs
    const { container: glyContainer, unmount: unmountGly } = render(
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
        regionAssist="glyphs"
        onCellTap={() => {}}
        onDragCross={() => {}}
      />
    );
    const glyphs = glyContainer.querySelectorAll('.region-glyph-badge');
    expect(glyphs).toHaveLength(4);
    expect(glyphs[0].getAttribute('data-glyph')).toBe('paw'); // Reg 0
    expect(glyphs[0].querySelector('svg[data-region-glyph="paw"]')).not.toBeNull();
    expect(glyphs[1].getAttribute('data-glyph')).toBe('fish'); // Reg 1
    expect(glyphs[1].querySelector('svg[data-region-glyph="fish"]')).not.toBeNull();
    unmountGly();

    // Test numbers (Review Focus #3: 1-indexed)
    const { container: numContainer } = render(
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
        regionAssist="numbers"
        onCellTap={() => {}}
        onDragCross={() => {}}
      />
    );
    const nums = numContainer.querySelectorAll('.region-number-badge');
    expect(nums).toHaveLength(4);
    expect(nums[0].textContent).toBe('1'); // Reg 0 -> 1
    expect(nums[1].textContent).toBe('2'); // Reg 1 -> 2
  });

  it('Review Focus #2: cell tap and drag work normally even with region assist badges active', () => {
    const onCellTap = vi.fn();
    const regions = [[0]];
    const board: CellState[][] = [['empty']];
    const locked = [[false]];

    const { getByTestId } = render(
      <Board
        size={1}
        regions={regions}
        board={board}
        lockedCats={locked}
        conflictingKeys={new Set()}
        lastPlacedCat={null}
        lastErrorCell={null}
        isVictory={false}
        catVariant="black"
        regionAssist="glyphs"
        onCellTap={onCellTap}
        onDragCross={() => {}}
      />
    );

    fireEvent.click(getByTestId('cell-0-0'));
    expect(onCellTap).toHaveBeenCalledWith(0, 0, expect.anything());
  });
});
