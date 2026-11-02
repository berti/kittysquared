// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { SettingsModal } from '../../src/components/SettingsModal';
import { TutorialModal } from '../../src/components/TutorialModal';
import { GameScreen } from '../../src/components/GameScreen';
import { createLevelSession } from '../../src/state/gameState';
import { PuzzleDef } from '../../src/types/puzzle';

const dummyPuzzle: PuzzleDef = {
  id: 1,
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
    [2, 2, 3, 3],
    [2, 2, 3, 3],
  ],
  solution: [0, 1, 2, 3],
  maxRuleUsed: 1,
  difficultyScore: 10,
};


describe('ModalTransitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('ConfirmDialog applies animation classes and blocks backdrop click dismissal during 300ms entrance', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    const { getByTestId } = render(
      <ConfirmDialog
        isOpen={true}
        title="Test Modal"
        description="Testing entrance"
        guardBackdropMs={300}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    const backdrop = getByTestId('confirm-dialog-backdrop');
    const card = getByTestId('confirm-dialog-card');

    expect(backdrop.className).toContain('modal-backdrop-anim');
    expect(card.className).toContain('modal-card-flyin');

    // Clicking backdrop at 100ms (during fly-in) should NOT dismiss
    act(() => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.click(backdrop);
    expect(onCancel).not.toHaveBeenCalled();

    // Advance beyond 300ms entrance
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Clicking backdrop now dismisses
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });


  it('SettingsModal applies animation classes to backdrop and card', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: false,
          sfxMuted: false,
          tutorialSeen: true,
          musicVolume: 0.75,
          sfxVolume: 0.75,
          musicTrack: 'auto',
        }}
        onUpdateSettings={vi.fn()}
        onResetProgress={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const backdrop = getByTestId('settings-modal-backdrop');
    const card = getByTestId('settings-modal-card');

    expect(backdrop.className).toContain('modal-backdrop-anim');
    expect(card.className).toContain('modal-card-flyin');
  });

  it('TutorialModal applies animation classes to backdrop and card', () => {
    const { getByTestId } = render(
      <TutorialModal catVariant="black" onClose={vi.fn()} />
    );

    const backdrop = getByTestId('tutorial-modal-backdrop');
    const card = getByTestId('tutorial-modal-card');

    expect(backdrop.className).toContain('modal-backdrop-anim');
    expect(card.className).toContain('modal-card-flyin');
  });

  it('GameScreen won and lost modals apply animation classes to backdrop and card', () => {
    const wonSession = createLevelSession(dummyPuzzle);
    wonSession.status = 'won';

    const { getByTestId, rerender } = render(
      <GameScreen
        puzzle={dummyPuzzle}
        progress={{ currentLevelId: 1, totalScore: 0, activeSnapshot: null }}
        settings={{
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
          musicVolume: 0.75,
          sfxVolume: 0.75,
          musicTrack: 'auto',
        }}
        session={wonSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const wonBackdrop = getByTestId('victory-modal-backdrop');
    const wonCard = getByTestId('victory-modal-card');
    expect(wonBackdrop.className).toContain('modal-backdrop-anim');
    expect(wonCard.className).toContain('modal-card-flyin');

    const lostSession = createLevelSession(dummyPuzzle);
    lostSession.status = 'lost';

    rerender(
      <GameScreen
        puzzle={dummyPuzzle}
        progress={{ currentLevelId: 1, totalScore: 0, activeSnapshot: null }}
        settings={{
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
          musicVolume: 0.75,
          sfxVolume: 0.75,
          musicTrack: 'auto',
        }}
        session={lostSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const lostBackdrop = getByTestId('defeat-modal-backdrop');
    const lostCard = getByTestId('defeat-modal-card');
    expect(lostBackdrop.className).toContain('modal-backdrop-anim');
    expect(lostCard.className).toContain('modal-card-flyin');
  });
});
