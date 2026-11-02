// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from '../../src/components/HomeScreen';

describe('HomeScreen component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  const defaultProgress = {
    currentLevelId: 4,
    totalScore: 125,
    activeSnapshot: null,
  };

  it('renders Home screen without subtitle and without emojis in buttons', () => {
    render(
      <HomeScreen
        progress={defaultProgress}
        catVariant="black"
        onPlay={vi.fn()}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    // Subtitle must be removed
    expect(screen.queryByText(/300 puzzles de lógica felina/i)).toBeNull();

    // Single unified play button with right-aligned level/points and NO emoji
    const playBtn = screen.getByTestId('start-game-btn');
    expect(playBtn).toBeDefined();
    expect(playBtn.textContent).toContain('Jugar');
    expect(playBtn.textContent).not.toContain('🎮');
    expect(playBtn.textContent).toContain('Nivel 4 / 300 • 125 pts');

    // Tutorial and Settings buttons without emojis
    const tutorialBtn = screen.getByTestId('open-tutorial-btn');
    expect(tutorialBtn.textContent?.trim()).toBe('Tutorial');
    expect(tutorialBtn.textContent).not.toContain('📖');

    const settingsBtn = screen.getByTestId('open-settings-btn');
    expect(settingsBtn.textContent?.trim()).toBe('Ajustes');
    expect(settingsBtn.textContent).not.toContain('⚙️');
  });

  it('triggers onPlay, onOpenTutorial, and onOpenSettings handlers', () => {
    const onPlay = vi.fn();
    const onOpenTutorial = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <HomeScreen
        progress={defaultProgress}
        catVariant="black"
        onPlay={onPlay}
        onOpenTutorial={onOpenTutorial}
        onOpenSettings={onOpenSettings}
      />
    );

    fireEvent.click(screen.getByTestId('start-game-btn'));
    expect(onPlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('open-tutorial-btn'));
    expect(onOpenTutorial).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('open-settings-btn'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('renders start-game-btn as a focusable button element accessible to keyboard navigation', () => {
    render(
      <HomeScreen
        progress={defaultProgress}
        catVariant="black"
        onPlay={vi.fn()}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const playBtn = screen.getByTestId('start-game-btn');
    expect(playBtn.tagName.toLowerCase()).toBe('button');
  });

  it('renders completed state on Play button and opens PostGameModal when currentLevelId > totalLevels', () => {
    const completedProgress = {
      currentLevelId: 301,
      totalScore: 16500,
      activeSnapshot: null,
    };
    const onPlay = vi.fn();
    const onReplay = vi.fn();
    const onReset = vi.fn();

    render(
      <HomeScreen
        progress={completedProgress}
        totalLevels={300}
        catVariant="black"
        onPlay={onPlay}
        onReplayLastLevel={onReplay}
        onResetProgress={onReset}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const playBtn = screen.getByTestId('start-game-btn');
    expect(playBtn.textContent).toContain('¡Juego completado!');
    expect(playBtn.textContent).toContain('300 / 300 • 16500 pts');

    // Clicking Play button opens PostGameModal
    fireEvent.click(playBtn);
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByTestId('post-game-modal-backdrop')).toBeDefined();

    // Replay button triggers onReplayLastLevel
    fireEvent.click(screen.getByTestId('replay-last-level-btn'));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('renders bottom reset progress button and opens ConfirmDialog', () => {
    const onReset = vi.fn();
    render(
      <HomeScreen
        progress={defaultProgress}
        catVariant="black"
        onPlay={vi.fn()}
        onResetProgress={onReset}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const resetBtn = screen.getByTestId('home-reset-progress-btn');
    expect(resetBtn).toBeDefined();
    expect(resetBtn.textContent).toContain('Reiniciar');

    // Clicking it opens ConfirmDialog
    fireEvent.click(resetBtn);
    expect(screen.getByTestId('confirm-dialog-confirm-btn')).toBeDefined();
    expect(onReset).not.toHaveBeenCalled();

    // Clicking cancel closes dialog without calling onReset
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel-btn'));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-dialog-confirm-btn')).toBeNull();

    // Clicking it again and confirming calls onReset
    fireEvent.click(resetBtn);
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm-btn'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
