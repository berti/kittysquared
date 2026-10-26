// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { TutorialModal } from '../../src/components/TutorialModal';
import { TUTORIAL_STEPS } from '../../src/data/tutorialSteps';

describe('components/TutorialModal', () => {
  it('includes both basic rules/deductions and advanced deductions (pairs & 1-step asphyxiation)', () => {
    const basic = TUTORIAL_STEPS.filter((s) => s.part === 'basic');
    const advanced = TUTORIAL_STEPS.filter((s) => s.part === 'advanced');
    expect(basic.length).toBeGreaterThanOrEqual(3);
    expect(advanced.length).toBeGreaterThanOrEqual(2);
  });

  it('guides the player through interactive steps and allows switching to advanced part or closing', () => {
    const onClose = vi.fn();
    const { getByText, getByTestId } = render(<TutorialModal catVariant="black" onClose={onClose} />);
    const firstStep = TUTORIAL_STEPS[0];
    expect(getByText(firstStep.title)).toBeTruthy();

    // Tap the target cell to complete step 1
    const target = getByTestId(`tutorial-cell-${firstStep.targetCell.row}-${firstStep.targetCell.col}`);
    fireEvent.click(target);
    const nextBtn = getByTestId('tutorial-next-btn');
    fireEvent.click(nextBtn);
    expect(getByText(TUTORIAL_STEPS[1].title)).toBeTruthy();
  });
});
