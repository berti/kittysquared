export interface ScreenTransitionOverlayProps {
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
  phase: 'idle' | 'covering' | 'uncovering';
}

export function ScreenTransitionOverlay({
  isTransitioning,
  direction,
  phase,
}: ScreenTransitionOverlayProps) {
  if (!isTransitioning || phase === 'idle') {
    return null;
  }

  const animationClass =
    direction === 'forward'
      ? phase === 'covering'
        ? 'screen-wipe-forward-cover'
        : 'screen-wipe-forward-uncover'
      : phase === 'covering'
        ? 'screen-wipe-backward-cover'
        : 'screen-wipe-backward-uncover';

  return (
    <>
      <div
        data-testid="screen-transition-shield"
        class="screen-transition-shield"
      />
      <div
        data-testid="screen-wipe-curtain"
        class={`screen-wipe-curtain ${animationClass}`}
      />
    </>
  );
}

