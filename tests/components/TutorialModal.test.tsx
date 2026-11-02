// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TutorialModal } from '../../src/components/TutorialModal';
import { TUTORIAL_STEPS } from '../../src/data/tutorialSteps';

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

    const c01 = getByTestId('cell-0-1');
    const c02 = getByTestId('cell-0-2');
    const c03 = getByTestId('cell-0-3');

    fireEvent.click(c01);
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

    fireEvent.click(getByTestId('cell-0-1'));
    fireEvent.click(getByTestId('cell-0-2'));
    fireEvent.click(getByTestId('cell-0-3'));
    fireEvent.click(getByTestId('tutorial-next-btn'));

    // Step 4
    expect(getByText(/4\. Fallos y vidas/i)).toBeTruthy();
    expect(getByText('❤️ ❤️ ❤️')).toBeTruthy();

    const cell02 = getByTestId('cell-0-2');
    fireEvent.click(cell02);
    fireEvent.click(cell02);

    expect(cell02.querySelector('.cross-mark-error')).not.toBeNull();
    expect(getByText('🤍 ❤️ ❤️')).toBeTruthy();
    expect((getByTestId('tutorial-next-btn') as HTMLButtonElement).disabled).toBe(false);
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

    fireEvent.click(getByTestId('cell-0-1'));
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
});
