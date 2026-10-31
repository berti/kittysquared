// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { ScreenTransitionOverlay } from '../../src/components/ScreenTransitionOverlay';

describe('ScreenTransitionOverlay', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isTransitioning is false or phase is idle', () => {
    const { container } = render(
      <ScreenTransitionOverlay isTransitioning={false} direction="forward" phase="idle" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders input shield and curtain with covering transform for forward direction', () => {
    const { getByTestId } = render(
      <ScreenTransitionOverlay isTransitioning={true} direction="forward" phase="covering" />
    );
    const shield = getByTestId('screen-transition-shield');
    const curtain = getByTestId('screen-wipe-curtain');

    expect(shield).toBeTruthy();
    expect(curtain).toBeTruthy();
    expect(curtain.className).toContain('screen-wipe-curtain');
    // Forward covering: should be at 0% after entering from 100%
    expect(curtain.style.transform).toBe('translateX(0%)');
  });

  it('renders curtain with uncovering transform for forward direction', () => {
    const { getByTestId } = render(
      <ScreenTransitionOverlay isTransitioning={true} direction="forward" phase="uncovering" />
    );
    const curtain = getByTestId('screen-wipe-curtain');
    // Forward uncovering: exits to the left (-100%)
    expect(curtain.style.transform).toBe('translateX(-100%)');
  });

  it('renders curtain with uncovering transform for backward direction', () => {
    const { getByTestId } = render(
      <ScreenTransitionOverlay isTransitioning={true} direction="backward" phase="uncovering" />
    );
    const curtain = getByTestId('screen-wipe-curtain');
    // Backward uncovering: exits to the right (100%)
    expect(curtain.style.transform).toBe('translateX(100%)');
  });
});
