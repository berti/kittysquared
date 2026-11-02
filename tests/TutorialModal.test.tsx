// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS } from '../src/data/tutorialSteps';

describe('TUTORIAL_STEPS configuration', () => {
  it('has 9 total steps partitioned into basic (rules) and advanced (strategies)', () => {
    expect(TUTORIAL_STEPS.length).toBe(9);
    const basicSteps = TUTORIAL_STEPS.filter((s) => s.part === 'basic');
    const advancedSteps = TUTORIAL_STEPS.filter((s) => s.part === 'advanced');
    expect(basicSteps.length).toBe(5);
    expect(advancedSteps.length).toBe(4);
  });

  it('step 1 (Regla fundamental) requires double-tap cat placement', () => {
    const s1 = TUTORIAL_STEPS[0];
    expect(s1.id).toBe('step-1');
    expect(s1.puzzle).toBeDefined();
    expect(s1.puzzle.size).toBe(4);
  });
});
