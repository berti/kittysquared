// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
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
    expect(getByTestId('status-hearts-group')).toBeDefined();
    expect(getByTestId('status-heart-0').getAttribute('data-state')).toBe('full');
    expect(getByTestId('status-heart-1').getAttribute('data-state')).toBe('full');
    expect(getByTestId('status-heart-2').getAttribute('data-state')).toBe('full');
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
    expect(getByText(/\+20 pts \(mejora de récord\)/i)).toBeTruthy();
    expect(getByText(/Nuevo total: 520 pts/i)).toBeTruthy();

    // When replayed with 1 mistake (2 stars -> +0 improvement)
    session.mistakes = 1;
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
    expect(getByText(/\+0 pts \(ya completado\)/i)).toBeTruthy();
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

  it('animates cracking SVG heart on mistake and pops floating +10 badge on non-replay cat score gain', () => {
    const session = createLevelSession(samplePuzzle);
    const defaultState = getDefaultAppState();
    defaultState.progress.currentLevelId = 42;

    const { getByTestId, queryByTestId, rerender } = render(
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

    expect(queryByTestId('score-float-pop')).toBeNull();

    // Simulate mistake increment (0 -> 1): status-heart-2 becomes empty and has heart-losing class
    const afterMistake = { ...session, mistakes: 1 };
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={afterMistake}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const heart2 = getByTestId('status-heart-2');
    expect(heart2.getAttribute('data-state')).toBe('empty');
    expect(heart2.classList.contains('heart-losing')).toBe(true);

    // Simulate valid cat placement increasing partialScore (0 -> 10)
    const afterCatScore = { ...afterMistake, partialScore: 10 };
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={afterCatScore}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(getByTestId('score-float-pop').textContent).toBe('+10');
  });

  it('renders 1-star, 2-star, and 3-star Victory Modal states with 3rd-star confetti only on 3 stars, and calls onOpenLevels from Victory and Defeat modals', () => {
    const session = createLevelSession(samplePuzzle);
    session.status = 'won';
    session.mistakes = 0;
    const defaultState = getDefaultAppState();
    const onOpenLevels = vi.fn();

    const { getByTestId, queryByTestId, rerender } = render(
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
        onOpenLevels={onOpenLevels}
        onOpenSettings={vi.fn()}
      />
    );

    // 3 stars (0 mistakes) -> all 3 stars earned + 3rd star confetti present
    expect(getByTestId('victory-star-1').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-2').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-3').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-third-star-confetti')).toBeTruthy();

    fireEvent.click(getByTestId('victory-levels-btn'));
    expect(onOpenLevels).toHaveBeenCalledTimes(1);

    // 2 stars (1 mistake) -> stars 1 & 2 earned, star 3 empty, no 3rd star confetti
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={{ ...session, mistakes: 1 }}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenLevels={onOpenLevels}
        onOpenSettings={vi.fn()}
      />
    );
    expect(getByTestId('victory-star-1').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-2').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-3').getAttribute('data-earned')).toBe('false');
    expect(queryByTestId('victory-third-star-confetti')).toBeNull();

    // 1 star (2 mistakes) -> star 1 earned, stars 2 & 3 empty, no 3rd star confetti
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={{ ...session, mistakes: 2 }}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenLevels={onOpenLevels}
        onOpenSettings={vi.fn()}
      />
    );
    expect(getByTestId('victory-star-1').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-2').getAttribute('data-earned')).toBe('false');
    expect(getByTestId('victory-star-3').getAttribute('data-earned')).toBe('false');
    expect(queryByTestId('victory-third-star-confetti')).toBeNull();

    // Defeat modal -> renders 3 broken hearts arch and Niveles button
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={{ ...session, status: 'lost', mistakes: 3 }}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenLevels={onOpenLevels}
        onOpenSettings={vi.fn()}
      />
    );
    expect(getByTestId('defeat-hearts-arch')).toBeTruthy();
    fireEvent.click(getByTestId('defeat-levels-btn'));
    expect(onOpenLevels).toHaveBeenCalledTimes(2);
  });

  it('starts 2-phase on-board celebration when winning cat is tapped and allows tap-to-skip to Victory Modal', () => {
    const session = createLevelSession(samplePuzzle);
    // Place first 3 cats of solution [1, 3, 0, 2]
    session.board[0][1] = 'cat';
    session.lockedCats[0][1] = true;
    session.board[1][3] = 'cat';
    session.lockedCats[1][3] = true;
    session.board[2][0] = 'cat';
    session.lockedCats[2][0] = true;

    const defaultState = getDefaultAppState();
    let currentSession = session;

    const { getByTestId, queryByTestId, rerender } = render(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={currentSession}
        onUpdateSession={(next) => {
          currentSession = next;
        }}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    // Double-tap final winning cat at (3, 2)
    const winCell = getByTestId('cell-3-2');
    fireEvent.click(winCell);
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={currentSession}
        onUpdateSession={(next) => {
          currentSession = next;
        }}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    fireEvent.click(winCell);
    rerender(
      <GameScreen
        puzzle={samplePuzzle}
        totalLevels={100}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={currentSession}
        onUpdateSession={(next) => {
          currentSession = next;
        }}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(currentSession.status).toBe('won');
    // Phase 1: celebration overlay is visible, Victory Modal is NOT yet open
    expect(getByTestId('victory-celebration-overlay')).toBeTruthy();
    expect(queryByTestId('victory-modal-backdrop')).toBeNull();

    // Tap celebration overlay to skip delay -> Victory Modal opens immediately
    fireEvent.click(getByTestId('victory-celebration-overlay'));
    expect(queryByTestId('victory-celebration-overlay')).toBeNull();
    expect(getByTestId('victory-modal-backdrop')).toBeTruthy();
  });
});
