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
    expect(getByTestId('score-paw-coin-icon')).toBeDefined();
    expect(statusBar.textContent).not.toContain('⭐');
    expect(statusBar.style.fontSize).toBe('16.5px');
  });

  it('hides partial cat score badge during a replay and shows only bonus improvement on win', () => {
    const session = createLevelSession(samplePuzzle);
    session.partialScore = 20;
    const defaultState = getDefaultAppState();
    // Level 42 already completed with 2 stars (+30 bonus)
    defaultState.progress.currentLevelId = 50;
    defaultState.progress.totalScore = 500;
    defaultState.progress.levelStars = { 42: 2 };

    const { getByTestId, rerender, getByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
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

    // While playing a replay, no (+20) badge is shown in status bar
    expect(getByTestId('game-status-bar').textContent).not.toContain('(+');

    // When won with 0 mistakes (3 stars -> +50 bonus vs previous +30 -> +20 improvement)
    session.status = 'won';
    session.partialScore = 40;
    session.levelBonus = 50;
    session.mistakes = 0;

    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={{ ...session }}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(getByTestId('game-status-bar').textContent).toContain('(+20)');
    expect(getByText(/Nuevo total: 520 pts/i)).toBeTruthy();
  });

  it('renders regular victory modal when not on the final level', () => {
    const session = createLevelSession(samplePuzzle);
    session.status = 'won';
    const defaultState = getDefaultAppState();

    const { getByText, queryByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
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

    expect(getByText('¡Nivel 42 superado!')).toBeDefined();
    expect(getByText(/Siguiente Nivel ▶/i)).toBeDefined();
    expect(queryByText('¡Juego completado!')).toBeNull();
  });

  it('renders endgame victory modal and "Volver al Menú Principal" when beating the final level', () => {
    const session = createLevelSession(samplePuzzle);
    session.status = 'won';
    const defaultState = getDefaultAppState();

    const { getByText, queryByText } = render(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={42}
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

    expect(getByText('¡Juego completado!')).toBeDefined();
    expect(getByText(/Volver al Menú Principal/i)).toBeDefined();
    expect(queryByText(/Siguiente Nivel ▶/i)).toBeNull();
  });
});
