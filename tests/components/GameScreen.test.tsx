// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameScreen } from '../../src/components/GameScreen';
import { createLevelSession } from '../../src/state/gameState';
import { getDefaultAppState } from '../../src/state/storage';
import { PuzzleDef } from '../../src/types/puzzle';

const samplePuzzle: PuzzleDef = {
  id: 42,
  size: 4,
  regions: [
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [2, 3, 3, 3],
    [2, 2, 3, 3],
  ],
  solution: [1, 3, 0, 2],
  maxRuleUsed: 2,
  difficultyScore: 10,
};

describe('GameScreen component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('Review Focus #5: always displays gesture hint text and never renders tool-toggle-switch', () => {
    const session = createLevelSession(samplePuzzle);
    const defaultState = getDefaultAppState();

    const { queryByTestId, getByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={session}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(queryByTestId('tool-toggle-switch')).toBeNull();
    expect(getByText(/1 toque: ✕ Cruz • 2 toques: 🐱 Gato/i)).not.toBeNull();
  });

  it('renders top bar buttons and enlarged status bar with cats, lives, and score', () => {
    const session = createLevelSession(samplePuzzle);
    const defaultState = getDefaultAppState();

    const { getByTestId, getByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={session}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    // Top bar elements
    expect(getByText('← Menú')).toBeDefined();
    expect(getByText('Nivel 42')).toBeDefined();
    expect(getByTestId('restart-level-btn')).toBeDefined();
    expect(getByTestId('open-settings-btn')).toBeDefined();

    // Status bar contents and style
    const statusBar = getByTestId('game-status-bar');
    expect(statusBar.textContent).toContain('0 / 4');
    expect(statusBar.textContent).toContain('❤️ ❤️ ❤️');
    expect(statusBar.textContent).toContain('⭐ 0');
    expect(statusBar.style.fontSize).toBe('16.5px');
  });
});
