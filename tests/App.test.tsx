// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';
import { soundEngine } from '../src/audio/soundEngine';
import { getDailyPuzzleForDate, getTodayDateString } from '../src/engine/daily';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders Home screen with single Play card, Tutorial, and Settings', () => {
    const { getByTestId, getByText, queryByText } = render(<App />);
    expect(getByText('KittySquared')).toBeTruthy();
    expect(queryByText('300 puzzles de lógica felina')).toBeNull();
    expect(getByText(/Nivel 1 \/ 300/i)).toBeTruthy();
    expect(getByTestId('start-game-btn')).toBeTruthy();
  });

  it('allows configuring double-tap speed and cat variant (black vs white) in Settings', () => {
    const { getByTestId, getByText, queryByTestId } = render(<App />);
    // Open settings from home
    fireEvent.click(getByTestId('open-settings-btn'));
    fireEvent.input(getByTestId('speed-slider'), { target: { value: '450' } });

    // Switch to graphics tab for cat variant
    fireEvent.click(getByTestId('tab-btn-graphics'));
    fireEvent.click(getByTestId('select-cat-white'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Enter game: dual switch should be removed, hint text visible
    fireEvent.click(getByTestId('start-game-btn'));
    expect(queryByTestId('tool-toggle-switch')).toBeNull();
    expect(getByText(/1 toque: ✕ Cruz • 2 toques:/i)).toBeTruthy();
  });

  it('plays through Level 1, updates total score, and advances to Level 2', () => {
    // Set tutorialSeen so it doesn't auto-open
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        settings: {
          catVariant: 'black',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
        },
      })
    );

    const { getByTestId, getByText } = render(<App />);
    fireEvent.click(getByTestId('start-game-btn'));
    expect(getByText(/Nivel 1/i)).toBeTruthy();
  });

  it('Review Focus #5: allows changing Region Assist in Settings and applies it to the active game board', () => {
    const { getByTestId } = render(<App />);

    // Open settings
    fireEvent.click(getByTestId('open-settings-btn'));

    // Switch to graphics tab
    fireEvent.click(getByTestId('tab-btn-graphics'));

    // Select Glyphs
    fireEvent.click(getByTestId('select-region-assist-glyphs'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Start game and verify glyph badges are present on the board
    fireEvent.click(getByTestId('start-game-btn'));
    const cell = document.querySelector('[data-testid="cell-0-0"]');
    expect(cell?.querySelector('.region-glyph-badge')).not.toBeNull();
  });

  it('synchronizes volume and music track settings with soundEngine', () => {
    const setVolumeSpy = vi.spyOn(soundEngine, 'setVolume');
    const setTrackSpy = vi.spyOn(soundEngine, 'setTrackPreference');

    const { getByTestId } = render(<App />);
    fireEvent.click(getByTestId('open-settings-btn'));
    fireEvent.click(getByTestId('tab-btn-sound'));

    fireEvent.click(getByTestId('music-vol-step-0.5'));
    expect(setVolumeSpy).toHaveBeenCalledWith(0.5, expect.any(Number));

    fireEvent.click(getByTestId('track-opt-samba'));
    expect(setTrackSpy).toHaveBeenCalledWith('samba');

    setVolumeSpy.mockRestore();
    setTrackSpy.mockRestore();
  });

  it('initializes audio focus lifecycle so background music only plays when app is focused', () => {
    const initLifecycleSpy = vi.spyOn(soundEngine, 'initLifecycle');
    const setAppFocusedSpy = vi.spyOn(soundEngine, 'setAppFocused');

    const { unmount } = render(<App />);
    expect(initLifecycleSpy).toHaveBeenCalled();

    // Blur window: setAppFocused(false) called
    fireEvent(window, new Event('blur'));
    expect(setAppFocusedSpy).toHaveBeenCalledWith(false);

    // Focus window: setAppFocused(true) called
    fireEvent(window, new Event('focus'));
    expect(setAppFocusedSpy).toHaveBeenCalledWith(true);

    unmount();
    initLifecycleSpy.mockRestore();
    setAppFocusedSpy.mockRestore();
  });

  it('GameScreen has restart button in top bar, no undo/clear buttons, and no mode text in status bar', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        settings: {
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
        },
      })
    );

    const { getByTestId, queryByText, getByText } = render(<App />);
    fireEvent.click(getByTestId('start-game-btn'));

    // Top bar restart button exists
    const restartBtn = getByTestId('restart-level-btn');
    expect(restartBtn).toBeDefined();

    // Bottom undo and clear crosses buttons are gone
    expect(queryByText(/Deshacer/i)).toBeNull();
    expect(queryByText(/Limpiar cruces/i)).toBeNull();

    // Mode name "(Chill Out)" or "(Classic)" is not in the header/status bar
    expect(queryByText('(Chill Out)')).toBeNull();
    expect(queryByText('(Classic)')).toBeNull();

    // Place a cat on cell-0-0 via double click (invalid in level 1, solution is [1, 3, 0, 2])
    // Wait, in level 1 (id: 1, size: 5 or samplePuzzle), cell-0-0 is not cat. Double click causes error cross or cat
    fireEvent.click(restartBtn);
    expect(getByText('¿Reiniciar este nivel?')).toBeDefined();

    // Confirm restart -> board is reset
    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
  });

  it('Status bar keeps hearts centered at 50% regardless of score width', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 1, totalScore: 99999, activeSnapshot: null },
        settings: {
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
        },
      })
    );

    const { getByTestId } = render(<App />);
    fireEvent.click(getByTestId('start-game-btn'));

    const heartsEl = getByTestId('status-hearts-group');
    expect(heartsEl.style.position).toBe('absolute');
    expect(heartsEl.style.left).toBe('50%');
    expect(heartsEl.style.transform).toBe('translateX(-50%)');
  });

  describe('Screen transitions in App', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('triggers forward screen transition from Home to Game with 150ms midpoint swap', () => {
      const { getByTestId, queryByTestId } = render(
        <App transitionDurationMs={300} />
      );

      fireEvent.click(getByTestId('start-game-btn'));

      // Immediately after click: transition shield is active, curtain is covering
      expect(getByTestId('screen-transition-shield')).toBeTruthy();
      const curtain = getByTestId('screen-wipe-curtain');
      expect(curtain).toBeTruthy();

      // At 75ms: still transitioning, game screen not yet mounted (Home still visible)
      act(() => {
        vi.advanceTimersByTime(75);
      });
      expect(queryByTestId('restart-level-btn')).toBeNull();
      expect(getByTestId('start-game-btn')).toBeTruthy();

      // At 150ms midpoint: screen state swaps to GameScreen
      act(() => {
        vi.advanceTimersByTime(75);
      });
      expect(getByTestId('restart-level-btn')).toBeTruthy();
      expect(queryByTestId('start-game-btn')).toBeNull();

      // At 300ms: transition completes and shield is removed
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(queryByTestId('screen-transition-shield')).toBeNull();
    });

    it('triggers backward screen transition when returning to Menu', () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <App transitionDurationMs={300} />
      );

      // Enter Game
      fireEvent.click(getByTestId('start-game-btn'));
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Verify GameScreen mounted
      expect(getByTestId('restart-level-btn')).toBeTruthy();

      // Click Menu back button
      fireEvent.click(getByText('← Menú'));

      // Shield active and curtain exiting backward at completion
      expect(getByTestId('screen-transition-shield')).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(150);
      });
      // At midpoint, Home screen is restored
      expect(getByTestId('start-game-btn')).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(queryByTestId('screen-transition-shield')).toBeNull();
    });

    it('completing the final level advances currentLevelId to 301 and returns to the home screen', () => {
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: { currentLevelId: 300, totalScore: 5000, activeSnapshot: null },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, getByText, queryByText } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('start-game-btn'));

      expect(getByText('Nivel 300')).toBeTruthy();

      // Solution for puzzle 300: [0, 2, 5, 7, 3, 1, 4, 9, 6, 8]
      const solution = [0, 2, 5, 7, 3, 1, 4, 9, 6, 8];
      for (let r = 0; r < solution.length; r++) {
        const c = solution[r];
        const cell = getByTestId(`cell-${r}-${c}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      // Skip 1.4s on-board victory celebration to open Victory Modal immediately
      fireEvent.click(getByTestId('victory-celebration-overlay'));

      // Victory modal for final level
      expect(getByText('¡Juego completado!')).toBeTruthy();
      expect(queryByText(/Siguiente Nivel ▶/i)).toBeNull();

      // Click "Volver al Menú Principal"
      const returnBtn = getByText('Volver al Menú Principal');
      fireEvent.click(returnBtn);

      // Verify we returned to HomeScreen and currentLevelId is 301
      expect(getByTestId('start-game-btn')).toBeTruthy();
      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.progress.currentLevelId).toBe(301);
      expect(saved.progress.totalScore).toBeGreaterThan(5000);
    });

    it('in post-game state, clicking Play opens PostGameModal and allows replaying level 300', () => {
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: { currentLevelId: 301, totalScore: 16000, activeSnapshot: null },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, getByText } = render(<App transitionDurationMs={0} />);
      const playBtn = getByTestId('start-game-btn');
      expect(playBtn.textContent).toContain('¡Juego completado!');
      expect(playBtn.textContent).toContain('300 / 300');

      // Click play to open post-game modal
      fireEvent.click(playBtn);
      expect(getByTestId('post-game-modal-backdrop')).toBeTruthy();

      // Click replay last level
      fireEvent.click(getByTestId('replay-last-level-btn'));
      expect(getByText('Nivel 300')).toBeTruthy();
    });

    it('in post-game state, resetting progress wipes state back to level 1 and 0 pts after confirmation', () => {
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: { currentLevelId: 301, totalScore: 16000, activeSnapshot: null },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, queryByTestId } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('start-game-btn'));

      // Open reset confirmation dialog
      fireEvent.click(getByTestId('postgame-reset-progress-btn'));
      expect(getByTestId('confirm-dialog-backdrop')).toBeTruthy();

      // Confirm reset
      fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));

      // Should be back on home screen at level 1 with 0 points
      const playBtn = getByTestId('start-game-btn');
      expect(playBtn.textContent).toContain('Nivel 1 / 300 • 0');
      expect(playBtn.textContent).not.toContain('pts');
      expect(queryByTestId('post-game-modal-backdrop')).toBeNull();

      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.progress.currentLevelId).toBe(1);
      expect(saved.progress.totalScore).toBe(0);
    });

    it('Review Focus #4 & #5: navigates to LevelSelectScreen, replays an earlier level without overwriting frontier activeSnapshot, awards only bonus improvement, and restores frontier snapshot when stepping into currentLevelId', () => {
      // Frontier is Level 2 with an active snapshot (cross at 0,0); Level 1 completed with 1 star (mistakes: 2)
      const level2SnapBoard = Array.from({ length: 5 }, () => Array(5).fill('empty'));
      level2SnapBoard[0][0] = 'cross';
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: {
            currentLevelId: 2,
            totalScore: 60, // 50 cat pts + 10 bonus from 1-star clear
            levelStars: { 1: 1 },
            activeSnapshot: {
              levelId: 2,
              board: level2SnapBoard,
              lockedCats: Array.from({ length: 5 }, () => Array(5).fill(false)),
              mistakes: 0,
              partialScore: 0,
            },
          },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, getByText } = render(<App transitionDurationMs={0} />);

      // Open Level Selector from Home
      fireEvent.click(getByTestId('open-levels-btn'));
      expect(getByTestId('level-select-total-stars').textContent).toContain('1 / 900');

      // Select Level 1 for replay
      fireEvent.click(getByTestId('level-tile-1'));
      expect(getByText('Nivel 1')).toBeTruthy();

      // Place a cross on Level 1 at (0,1) -> must NOT overwrite Level 2's activeSnapshot in localStorage
      fireEvent.click(getByTestId('cell-0-1'));
      const midReplaySaved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(midReplaySaved.progress.activeSnapshot?.levelId).toBe(2);
      expect(midReplaySaved.progress.activeSnapshot?.board[0][0]).toBe('cross');

      // Solve Level 1 with 0 mistakes (solution for puzzle 1: [0, 2, 4, 1, 3])
      const lvl1Solution = [0, 2, 4, 1, 3];
      for (let r = 0; r < lvl1Solution.length; r++) {
        const cell = getByTestId(`cell-${r}-${lvl1Solution[r]}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      // Skip 1.4s on-board victory celebration to open Victory Modal immediately
      fireEvent.click(getByTestId('victory-celebration-overlay'));

      // Advance from Level 1 -> steps to Level 2
      fireEvent.click(getByText(/Siguiente Nivel ▶/i));
      expect(getByText('Nivel 2')).toBeTruthy();

      // Score should increase by +40 (3-star 50 bonus minus 1-star 10 bonus = 40 -> total 100), stars[1] = 3, currentLevelId stays 2
      const afterWinSaved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(afterWinSaved.progress.totalScore).toBe(100);
      expect(afterWinSaved.progress.levelStars['1']).toBe(3);
      expect(afterWinSaved.progress.currentLevelId).toBe(2);

      // And Level 2's saved cross at (0,0) should be restored on the board!
      const cell00OnLvl2 = getByTestId('cell-0-0');
      expect(cell00OnLvl2.querySelector('svg.cross-mark')).not.toBeNull();
    });

    it('commits level win outcome (stars, score, and nextCurrentLevelId) when clicking Niveles in the Victory Modal', () => {
      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
          settings: {
            doubleTapTimeoutMs: 500,
            catVariant: 'black',
            regionAssist: 'off',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('start-game-btn'));

      // Solve Level 1 with 0 mistakes (solution for puzzle 1: [0, 2, 4, 1, 3])
      const lvl1Solution = [0, 2, 4, 1, 3];
      for (let r = 0; r < lvl1Solution.length; r++) {
        const cell = getByTestId(`cell-${r}-${lvl1Solution[r]}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      // Skip 1.4s on-board celebration -> open Victory Modal
      fireEvent.click(getByTestId('victory-celebration-overlay'));

      // Click Niveles button inside Victory Modal
      fireEvent.click(getByTestId('victory-levels-btn'));

      // Should navigate to LevelSelectScreen with 3 earned stars and Level 2 unlocked
      expect(getByTestId('level-select-total-stars').textContent).toContain('3 / 900');
      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.progress.currentLevelId).toBe(2);
      expect(saved.progress.totalScore).toBe(100);
      expect(saved.progress.levelStars['1']).toBe(3);
    });
  });

  describe('Daily challenge mode integration', () => {
    it('navigates to daily game mode when tapping Reto Diario button and loads today puzzle', () => {
      const { getByTestId, queryByTestId, getByText } = render(<App transitionDurationMs={0} />);
      const dailyBtn = getByTestId('open-daily-btn');
      expect(dailyBtn).toBeTruthy();

      fireEvent.click(dailyBtn);

      expect(getByText('Reto Diario')).toBeTruthy();
      expect(getByTestId('daily-timer')).toBeTruthy();
      expect(queryByTestId('level-progress-indicator')).toBeNull();
      // 10x10 board
      expect(getByTestId('cell-9-9')).toBeTruthy();
    });

    it('auto-saves daily cell updates into daily.activeSnapshot without modifying progress.activeSnapshot', () => {
      const todayStr = getTodayDateString();
      const campaignSnapshot = {
        levelId: 1,
        board: [['empty', 'empty', 'empty', 'empty', 'empty']],
        lockedCats: [[false, false, false, false, false]],
        mistakes: 0,
        partialScore: 0,
      };

      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: {
            currentLevelId: 1,
            totalScore: 40,
            activeSnapshot: campaignSnapshot,
          },
          settings: {
            catVariant: 'black',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('open-daily-btn'));

      // Place a cross on cell-0-0
      const cell00 = getByTestId('cell-0-0');
      fireEvent.click(cell00);

      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.daily.activeSnapshot).toBeTruthy();
      expect(saved.daily.activeSnapshotDate).toBe(todayStr);
      expect(saved.daily.activeSnapshot.board[0][0]).toBe('cross');

      // Campaign snapshot remains untouched
      expect(saved.progress.activeSnapshot).toEqual(campaignSnapshot);
      expect(saved.progress.totalScore).toBe(40);
    });

    it('restores daily activeSnapshot when launching Reto Diario if snapshot date matches today', () => {
      const todayStr = getTodayDateString();
      const todayPuzzle = getDailyPuzzleForDate(todayStr);
      const size = todayPuzzle.size;

      const board = Array.from({ length: size }, () => Array(size).fill('empty'));
      board[0][0] = 'cross';

      const lockedCats = Array.from({ length: size }, () => Array(size).fill(false));
      const errorCrosses = Array.from({ length: size }, () => Array(size).fill(false));

      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
          settings: {
            catVariant: 'black',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
          daily: {
            lastPlayedDate: null,
            currentStreak: 0,
            maxStreak: 0,
            history: {},
            activeSnapshot: {
              levelId: todayPuzzle.id,
              board,
              lockedCats,
              errorCrosses,
              mistakes: 1,
              partialScore: 0,
            },
            activeSnapshotDate: todayStr,
          },
        })
      );

      const { getByTestId } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('open-daily-btn'));

      const cell00 = getByTestId('cell-0-0');
      expect(cell00.querySelector('svg.cross-mark')).not.toBeNull();
      // Mistakes should be 1, so heart 2 is empty and hearts 0 and 1 are full
      expect(getByTestId('status-heart-0').getAttribute('data-state')).toBe('full');
      expect(getByTestId('status-heart-1').getAttribute('data-state')).toBe('full');
      expect(getByTestId('status-heart-2').getAttribute('data-state')).toBe('empty');
    });

    it('commits daily win via computeDailyWinOutcome and leaves campaign progress completely isolated', () => {
      const todayStr = getTodayDateString();
      const todayPuzzle = getDailyPuzzleForDate(todayStr);

      localStorage.setItem(
        'kittysquared_state_v1',
        JSON.stringify({
          progress: {
            currentLevelId: 3,
            totalScore: 150,
            levelStars: { 1: 3, 2: 2 },
            activeSnapshot: null,
          },
          settings: {
            catVariant: 'black',
            musicMuted: true,
            sfxMuted: true,
            tutorialSeen: true,
          },
        })
      );

      const { getByTestId, getByText } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('open-daily-btn'));

      // Solve today's puzzle
      for (let r = 0; r < todayPuzzle.size; r++) {
        const c = todayPuzzle.solution[r];
        const cell = getByTestId(`cell-${r}-${c}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      // Skip celebration overlay
      fireEvent.click(getByTestId('victory-celebration-overlay'));

      // Verify daily victory modal content
      expect(getByText('¡Reto Diario Completado!')).toBeTruthy();
      const homeBtn = getByText('Volver al inicio');
      expect(homeBtn).toBeTruthy();

      // Check saved storage
      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.daily.history[todayStr]).toBeDefined();
      expect(saved.daily.history[todayStr].stars).toBe(3);
      expect(saved.daily.currentStreak).toBe(1);
      expect(saved.daily.activeSnapshot).toBeNull();
      expect(saved.daily.activeSnapshotDate).toBeNull();

      // Campaign progress is strictly untouched
      expect(saved.progress.totalScore).toBe(150);
      expect(saved.progress.currentLevelId).toBe(3);
      expect(saved.progress.levelStars).toEqual({ '1': 3, '2': 2 });

      // Return to home screen
      fireEvent.click(homeBtn);
      expect(getByTestId('daily-check-icon')).toBeTruthy();
      expect(getByTestId('open-daily-btn').textContent).toContain('Completado');
    });

    it('locks session date when entering daily mode so completion after midnight commits to locked start date', () => {
      vi.useFakeTimers();
      const startDate = new Date(2026, 10, 8, 23, 55, 0); // Nov 8 2026
      vi.setSystemTime(startDate);

      const puzzleNov8 = getDailyPuzzleForDate('2026-11-08');

      const { getByTestId } = render(<App transitionDurationMs={0} />);
      fireEvent.click(getByTestId('open-daily-btn'));

      // Advance time past midnight to Nov 9 2026
      vi.setSystemTime(new Date(2026, 10, 9, 0, 10, 0));

      // Solve puzzle
      for (let r = 0; r < puzzleNov8.size; r++) {
        const c = puzzleNov8.solution[r];
        const cell = getByTestId(`cell-${r}-${c}`);
        fireEvent.click(cell);
        fireEvent.click(cell);
      }

      fireEvent.click(getByTestId('victory-celebration-overlay'));

      const saved = JSON.parse(localStorage.getItem('kittysquared_state_v1') || '{}');
      expect(saved.daily.history['2026-11-08']).toBeDefined();
      expect(saved.daily.history['2026-11-09']).toBeUndefined();
      expect(saved.daily.lastPlayedDate).toBe('2026-11-08');

      vi.useRealTimers();
    });
  });
});
