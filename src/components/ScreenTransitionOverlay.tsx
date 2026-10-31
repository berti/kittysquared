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

  let transform = 'translateX(0%)';
  if (phase === 'covering') {
    transform = 'translateX(0%)';
  } else if (phase === 'uncovering') {
    transform = direction === 'forward' ? 'translateX(-100%)' : 'translateX(100%)';
  }

  return (
    <>
      <div
        data-testid="screen-transition-shield"
        class="screen-transition-shield"
      />
      <div
        data-testid="screen-wipe-curtain"
        class="screen-wipe-curtain"
        style={{
          transform,
          transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </>
  );
}
