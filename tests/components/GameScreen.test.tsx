// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameScreen } from '../../src/components/GameScreen';
import { createLevelSession, LevelSessionState } from '../../src/state/gameState';
import { getDefaultAppState, ModeProgress } from '../../src/state/storage';
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
    expect(getByText(/1 toque: ✕ Cruz • 2 toques:/i)).not.toBeNull();
    expect(getByText(/Gato/i)).not.toBeNull();
  });

  it('updates both origin cell and entered cell when dragging across cells', () => {
    let currentSession = createLevelSession(samplePuzzle);
    const onUpdateSession = vi.fn((next) => {
      currentSession = next;
    });
    const defaultState = getDefaultAppState();

    const { getByTestId } = render(
      <GameScreen
        puzzle={samplePuzzle}
        progress={defaultState.progress}
        settings={defaultState.settings}
        session={currentSession}
        onUpdateSession={onUpdateSession}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const cell00 = getByTestId('cell-0-0');
    const cell01 = getByTestId('cell-0-1');

    fireEvent.pointerDown(cell00, { button: 0 });
    fireEvent.pointerEnter(cell01);
    fireEvent.pointerUp(cell01);

    expect(onUpdateSession).toHaveBeenCalledTimes(2);
    expect(currentSession.board[0][0]).toBe('cross');
    expect(currentSession.board[0][1]).toBe('cross');
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

  it('clears heart-losing class 750ms after a mistake occurs', () => {
    vi.useFakeTimers();
    try {
      const session = createLevelSession(samplePuzzle);
      const defaultState = getDefaultAppState();

      const { getByTestId, rerender } = render(
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
          onOpenSettings={vi.fn()}
        />
      );

      expect(getByTestId('status-heart-2').classList.contains('heart-losing')).toBe(true);

      act(() => {
        vi.advanceTimersByTime(750);
      });

      expect(getByTestId('status-heart-2').classList.contains('heart-losing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders 1-star, 2-star, and 3-star Victory Modal states with 3rd-star confetti only on 3 stars, and calls onOpenLevels from Victory and Defeat modals', () => {
    const session = createLevelSession(samplePuzzle);
    session.status = 'won';
    session.mistakes = 0;
    session.levelBonus = 50;
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

    // 3 stars (0 mistakes) -> all 3 stars earned + 3rd star confetti present + detailed bonus & paw coin icon
    expect(getByTestId('victory-star-1').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-2').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-star-3').getAttribute('data-earned')).toBe('true');
    expect(getByTestId('victory-third-star-confetti')).toBeTruthy();
    expect(getByTestId('victory-paw-coin-icon')).toBeTruthy();
    expect(getByTestId('victory-score-card').textContent).toContain('Bono 3★ (0 fallos): +50');

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

  it('Review Focus #5: displays victory-unlocked-breed-banner when level win crosses a star milestone and allows one-tap equipping', () => {
    const onSelectCatVariant = vi.fn();
    const defaultState = getDefaultAppState();
    // 8 levels with 3 stars = 24 stars. Winning level 9 with 0 mistakes (+3★ -> 27★) crosses 25★ (Naranjito)
    const levelStars = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 1, 3 as const]));
    const progress: ModeProgress = {
      currentLevelId: 9,
      totalScore: 800,
      activeSnapshot: null,
      levelStars,
    };
    const wonSession: LevelSessionState = {
      ...createLevelSession(samplePuzzle),
      puzzle: { ...samplePuzzle, id: 9 },
      status: 'won',
      mistakes: 0,
      partialScore: 40,
      levelBonus: 60,
    };

    const { getByTestId, rerender } = render(
      <GameScreen
        puzzle={wonSession.puzzle}
        progress={progress}
        settings={defaultState.settings}
        session={wonSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
        onSelectCatVariant={onSelectCatVariant}
      />
    );

    const banner = getByTestId('victory-unlocked-breed-banner');
    expect(banner.textContent).toContain('¡Nuevo gatito desbloqueado!');
    expect(banner.textContent).toContain('Naranjito');

    const equipBtn = getByTestId('victory-equip-breed-btn');
    expect(equipBtn.textContent).toBe('Equipar');
    fireEvent.click(equipBtn);
    expect(onSelectCatVariant).toHaveBeenCalledWith('orange');

    // Once equipped, button shows ¡Equipado! and is disabled
    rerender(
      <GameScreen
        puzzle={wonSession.puzzle}
        progress={progress}
        settings={{ ...defaultState.settings, catVariant: 'orange' }}
        session={wonSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
        onSelectCatVariant={onSelectCatVariant}
      />
    );
    expect(getByTestId('victory-equip-breed-btn').textContent).toBe('¡Equipado!');
    expect((getByTestId('victory-equip-breed-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not display victory-unlocked-breed-banner on a replay that does not cross a star threshold', () => {
    const defaultState = getDefaultAppState();
    // Already has 27 stars (level 9 already has 3★)
    const levelStars = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, 3 as const]));
    const progress: ModeProgress = {
      currentLevelId: 10,
      totalScore: 900,
      activeSnapshot: null,
      levelStars,
    };
    const wonReplaySession: LevelSessionState = {
      ...createLevelSession(samplePuzzle),
      puzzle: { ...samplePuzzle, id: 9 },
      status: 'won',
      mistakes: 0,
      partialScore: 40,
      levelBonus: 60,
    };

    const { queryByTestId } = render(
      <GameScreen
        puzzle={wonReplaySession.puzzle}
        progress={progress}
        settings={defaultState.settings}
        session={wonReplaySession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(queryByTestId('victory-unlocked-breed-banner')).toBeNull();
  });
});
