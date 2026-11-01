// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/preact';
import { Board, REGION_GLYPHS } from '../../src/components/Board';
import { CellState } from '../../src/types/puzzle';

describe('Board Region 9 (10th Region) theme & glyphs', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const regions10: number[][] = Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => (r === 9 && c === 9 ? 9 : 0))
  );
  const emptyBoard10: CellState[][] = Array.from({ length: 10 }, () =>
    Array(10).fill('empty')
  );
  const locked10: boolean[][] = Array.from({ length: 10 }, () =>
    Array(10).fill(false)
  );

  const defaultProps = {
    size: 10,
    regions: regions10,
    board: emptyBoard10,
    lockedCats: locked10,
    conflictingKeys: new Set<string>(),
    lastPlacedCat: null,
    lastErrorCell: null,
    isVictory: false,
    catVariant: 'black' as const,
    onCellTap: () => {},
    onDragCross: () => {},
  };

  it('includes 🥛 in REGION_GLYPHS at index 9', () => {
    expect(REGION_GLYPHS).toHaveLength(10);
    expect(REGION_GLYPHS[9]).toBe('🥛');
  });

  it('renders cell in region 9 with reg-9 class and not reg-0', () => {
    const { getByTestId } = render(
      <Board {...defaultProps} regionAssist="off" />
    );

    const cell99 = getByTestId('cell-9-9');
    expect(cell99.classList.contains('reg-9')).toBe(true);
    expect(cell99.classList.contains('reg-0')).toBe(false);
  });

  it('renders pat-9 pattern on region 9 in textures assist mode', () => {
    const { getByTestId } = render(
      <Board {...defaultProps} regionAssist="textures" />
    );

    const cell99 = getByTestId('cell-9-9');
    const patternEl = cell99.querySelector('.region-pattern');
    expect(patternEl).not.toBeNull();
    expect(patternEl?.classList.contains('pat-9')).toBe(true);
    expect(patternEl?.classList.contains('pat-0')).toBe(false);
  });

  it('renders 🥛 glyph badge on region 9 in glyphs assist mode', () => {
    const { getByTestId } = render(
      <Board {...defaultProps} regionAssist="glyphs" />
    );

    const cell99 = getByTestId('cell-9-9');
    const badge = cell99.querySelector('.region-glyph-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('🥛');
  });

  it('renders 10 number badge on region 9 in numbers assist mode', () => {
    const { getByTestId } = render(
      <Board {...defaultProps} regionAssist="numbers" />
    );

    const cell99 = getByTestId('cell-9-9');
    const badge = cell99.querySelector('.region-number-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('10');
  });
});
