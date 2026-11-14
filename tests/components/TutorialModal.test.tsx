// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TutorialModal } from '../../src/components/TutorialModal';
import { TUTORIAL_STEPS } from '../../src/data/tutorialSteps';
import { I18nProvider } from '../../src/i18n';

describe('components/TutorialModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('includes both basic rules/controls and advanced deduction strategies', () => {
    const basic = TUTORIAL_STEPS.filter((s) => s.part === 'basic');
    const advanced = TUTORIAL_STEPS.filter((s) => s.part === 'advanced');
    expect(basic.length).toBe(5);
    expect(advanced.length).toBe(4);
    expect(TUTORIAL_STEPS.length).toBe(9);
  });

  it('all tutorial steps define valid puzzles obeying non-touching cats and 1 cat per region rules', () => {
    for (const step of TUTORIAL_STEPS) {
      const { size, solution, regions } = step.puzzle;
      expect(solution.length).toBe(size);

      // Verify no two cats touch orthogonally or diagonally
      for (let r1 = 0; r1 < size; r1++) {
        for (let r2 = r1 + 1; r2 < size; r2++) {
          const c1 = solution[r1];
          const c2 = solution[r2];
          const touchRow = Math.abs(r1 - r2) <= 1;
          const touchCol = Math.abs(c1 - c2) <= 1;
          expect(touchRow && touchCol).toBe(false);
        }
      }

      // Verify exactly 1 cat per region
      const regionCounts = new Map<number, number>();
      for (let r = 0; r < size; r++) {
        const c = solution[r];
        const reg = regions[r][c];
        regionCounts.set(reg, (regionCounts.get(reg) || 0) + 1);
      }
      for (let regId = 0; regId < size; regId++) {
        expect(regionCounts.get(regId)).toBe(1);
      }
    }
  });

  it('guides the player through interactive steps via double-click and enables next', () => {
    const onClose = vi.fn();
    const { getByText, getByTestId } = render(<TutorialModal catVariant="black" onClose={onClose} />);
    const firstStep = TUTORIAL_STEPS[0];
    expect(getByText(firstStep.title)).toBeTruthy();

    const nextBtn = getByTestId('tutorial-next-btn') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);

    // Double-tap the target cell (2, 0) to place cat and complete step 1
    const target = getByTestId('cell-2-0');
    fireEvent.click(target);
    fireEvent.click(target);

    expect(nextBtn.disabled).toBe(false);
    fireEvent.click(nextBtn);
    expect(getByText(TUTORIAL_STEPS[1].title)).toBeTruthy();
  });

  it('Step 2: without green cat at (2, 0), verifies non-touching rule by placing cat at (1, 3)', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText } = render(<TutorialModal catVariant="black" onClose={onClose} />);

    // Complete step 1
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // Step 2 title
    expect(getByText(/2\. Los gatos no pueden tocarse/i)).toBeTruthy();

    // Verify cell (2, 0) does not contain a cat
    expect(getByTestId('cell-2-0').querySelector('.board-cat-wrapper')).toBeNull();

    // Double-click (1, 3) places cat and unlocks next
    const cell13 = getByTestId('cell-1-3');
    fireEvent.click(cell13);
    fireEvent.click(cell13);
    expect(cell13.querySelector('.board-cat-wrapper')).not.toBeNull();
    expect((getByTestId('tutorial-next-btn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders region assist indicators (textures, glyphs, numbers) on tutorial board cells when regionAssist is provided', () => {
    const { container: glyContainer, unmount: unmountGly } = render(
      <TutorialModal catVariant="black" regionAssist="glyphs" onClose={() => {}} />
    );
    expect(glyContainer.querySelector('.region-glyph-badge')).not.toBeNull();
    unmountGly();

    const { container: texContainer } = render(
      <TutorialModal catVariant="black" regionAssist="textures" onClose={() => {}} />
    );
    expect(texContainer.querySelector('.region-pattern')).not.toBeNull();
  });

  it('Step 3: requires placing crosses on ALL target cells in row 0 before enabling next', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <TutorialModal catVariant="black" onClose={onClose} doubleTapTimeoutMs={500} />
    );

    // Pass step 1
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // Pass step 2
    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // In step 3
    const nextBtn = getByTestId('tutorial-next-btn') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);

    const c00 = getByTestId('cell-0-0');
    const c02 = getByTestId('cell-0-2');
    const c03 = getByTestId('cell-0-3');

    fireEvent.click(c00);
    expect(nextBtn.disabled).toBe(true);

    fireEvent.click(c02);
    expect(nextBtn.disabled).toBe(true);

    fireEvent.click(c03);
    expect(nextBtn.disabled).toBe(false);
  });

  it('Step 4: double clicking invalid cell marks red error cross, drops life, and completes step', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText } = render(
      <TutorialModal catVariant="black" onClose={onClose} doubleTapTimeoutMs={500} />
    );

    // Pass steps 1-3
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    fireEvent.click(getByTestId('cell-0-0'));
    fireEvent.click(getByTestId('cell-0-2'));
    fireEvent.click(getByTestId('cell-0-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // Step 4
    expect(getByText(/4\. Fallos y vidas/i)).toBeTruthy();
    expect(getByTestId('tutorial-heart-0').getAttribute('data-state')).toBe('full');
    expect(getByTestId('tutorial-heart-1').getAttribute('data-state')).toBe('full');
    expect(getByTestId('tutorial-heart-2').getAttribute('data-state')).toBe('full');

    const cell02 = getByTestId('cell-0-2');
    fireEvent.click(cell02);
    fireEvent.click(cell02);

    expect(cell02.querySelector('.cross-mark-error')).not.toBeNull();
    expect(getByTestId('tutorial-heart-0').getAttribute('data-state')).toBe('full');
    expect(getByTestId('tutorial-heart-1').getAttribute('data-state')).toBe('full');
    expect(getByTestId('tutorial-heart-2').getAttribute('data-state')).toBe('empty');
    expect((getByTestId('tutorial-next-btn') as HTMLButtonElement).disabled).toBe(false);

    // Clicking the locked red error cross does not toggle or remove it
    fireEvent.click(cell02);
    expect(cell02.querySelector('.cross-mark-error')).not.toBeNull();
    fireEvent.click(cell02);
    expect(cell02.querySelector('.cross-mark-error')).not.toBeNull();
  });

  it('Step 5: single clicking existing cross removes it and completes step', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText } = render(
      <TutorialModal catVariant="black" onClose={onClose} doubleTapTimeoutMs={500} />
    );

    // Pass steps 1-4
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('cell-2-0'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('cell-1-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    fireEvent.click(getByTestId('cell-0-0'));
    fireEvent.click(getByTestId('cell-0-2'));
    fireEvent.click(getByTestId('cell-0-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    fireEvent.click(getByTestId('cell-0-2'));
    fireEvent.click(getByTestId('cell-0-2'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // Step 5
    expect(getByText(/5\. Quitar cruces/i)).toBeTruthy();
    const cell12 = getByTestId('cell-1-2');
    expect(cell12.querySelector('.cross-mark')).not.toBeNull();

    fireEvent.click(cell12);
    expect(cell12.querySelector('.cross-mark')).toBeNull();
    expect((getByTestId('tutorial-next-btn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('allows jumping between Reglas y Controles and Estrategias tabs', () => {
    const onClose = vi.fn();
    const { getByTestId, getByText } = render(
      <TutorialModal catVariant="black" onClose={onClose} doubleTapTimeoutMs={500} />
    );

    expect(getByText(/1\. Fila, columna y región/i)).toBeTruthy();

    fireEvent.click(getByTestId('tab-btn-advanced'));
    expect(getByText(/6\. Región de una sola casilla/i)).toBeTruthy();

    fireEvent.click(getByTestId('tab-btn-basic'));
    expect(getByText(/1\. Fila, columna y región/i)).toBeTruthy();
  });

  describe('Bilingual i18n support in TutorialModal', () => {
    it('renders English tabs, step counter, step title, explanation, and hint when wrapped in <I18nProvider lang="en">', () => {
      const onClose = vi.fn();
      const { getByTestId, getByText } = render(
        <I18nProvider lang="en">
          <TutorialModal catVariant="black" onClose={onClose} />
        </I18nProvider>
      );

      // Tabs
      expect(getByTestId('tab-btn-basic').textContent).toBe('1. Rules & Controls');
      expect(getByTestId('tab-btn-advanced').textContent).toBe('2. Strategies');

      // Step counter
      expect(getByText('Step 1 of 9')).toBeDefined();

      // Step 1 content
      expect(getByText('1. Row, Column and Region (Double Tap)')).toBeDefined();
      expect(
        getByText(/Each row, column, and colored region must contain exactly 1 cat/i)
      ).toBeDefined();
      expect(getByText('Double tap cell (2, 0) to place the cat.')).toBeDefined();

      // Action button
      const nextBtn = getByTestId('tutorial-next-btn') as HTMLButtonElement;
      expect(nextBtn.textContent).toBe('Next ▶');
      expect(nextBtn.disabled).toBe(true);
    });

    it('displays English success hint and enables Next button upon completing step', () => {
      const onClose = vi.fn();
      const { getByTestId, getByText } = render(
        <I18nProvider lang="en">
          <TutorialModal catVariant="black" onClose={onClose} />
        </I18nProvider>
      );

      const target = getByTestId('cell-2-0');
      fireEvent.click(target);
      fireEvent.click(target);

      expect(getByText('Excellent! Deduction complete.')).toBeDefined();
      const nextBtn = getByTestId('tutorial-next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);
    });

    it('renders English finish button on the final step ("Start Playing! ▶")', () => {
      const onClose = vi.fn();
      const { getByTestId, getByText } = render(
        <I18nProvider lang="en">
          <TutorialModal catVariant="black" onClose={onClose} />
        </I18nProvider>
      );

      // Jump to Strategies (step 6)
      fireEvent.click(getByTestId('tab-btn-advanced'));
      expect(getByText('6. Single-Cell Region')).toBeDefined();

      // Step 6: place cat at (2, 0)
      fireEvent.click(getByTestId('cell-2-0'));
      fireEvent.click(getByTestId('cell-2-0'));
      fireEvent.click(getByTestId('tutorial-next-btn'));

      // Step 7: place crosses at (0, 2) and (0, 3)
      fireEvent.click(getByTestId('cell-0-2'));
      fireEvent.click(getByTestId('cell-0-3'));
      fireEvent.click(getByTestId('tutorial-next-btn'));

      // Step 8: place crosses at (0, 4) and (1, 4)
      fireEvent.click(getByTestId('cell-0-4'));
      fireEvent.click(getByTestId('cell-1-4'));
      fireEvent.click(getByTestId('tutorial-next-btn'));

      // Step 9 (final step):
      expect(getByText('Step 9 of 9')).toBeDefined();
      expect(getByText('9. 1-Step Lookahead Bottleneck')).toBeDefined();

      const finishBtn = getByTestId('tutorial-next-btn') as HTMLButtonElement;
      expect(finishBtn.textContent).toBe('Start Playing! ▶');
      expect(finishBtn.disabled).toBe(true);

      // Complete step 9 by placing cross at (1, 3)
      fireEvent.click(getByTestId('cell-1-3'));
      expect(finishBtn.disabled).toBe(false);
      expect(getByText('Excellent! Deduction complete.')).toBeDefined();

      fireEvent.click(finishBtn);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
