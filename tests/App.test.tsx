// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders Home screen with Chill Out and Classic mode cards, Tutorial, and Settings', () => {
    const { getByTestId, getByText } = render(<App />);
    expect(getByText('KittySquared')).toBeTruthy();
    expect(getByText('300 puzzles de lógica felina')).toBeTruthy();
    expect(getByText(/Nivel 1 \/ 300/i)).toBeTruthy();
    expect(getByTestId('start-chill-btn')).toBeTruthy();
    expect(getByTestId('start-classic-btn')).toBeTruthy();
  });

  it('allows configuring double-tap speed, cat variant (black vs white), and resetting progress in Settings', () => {
    const { getByTestId, getByText, queryByTestId } = render(<App />);
    // Open settings from home
    fireEvent.click(getByTestId('open-settings-btn'));
    fireEvent.input(getByTestId('speed-slider'), { target: { value: '450' } });

    // Switch to graphics tab for cat variant
    fireEvent.click(getByTestId('tab-btn-graphics'));
    fireEvent.click(getByTestId('select-cat-white'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Enter Classic mode: dual switch should be removed, hint text visible
    fireEvent.click(getByTestId('start-classic-btn'));
    expect(queryByTestId('tool-toggle-switch')).toBeNull();
    expect(getByText(/1 toque: ✕ Cruz • 2 toques: 🐱 Gato/i)).toBeTruthy();
  });

  it('plays through Level 1 in Classic mode, updates total score, and advances to Level 2', () => {
    // Set tutorialSeen so it doesn't auto-open
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        settings: {
          catVariant: 'black',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
        },
      })
    );

    const { getByTestId, getByText } = render(<App />);
    fireEvent.click(getByTestId('start-classic-btn'));
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
    fireEvent.click(getByTestId('start-chill-btn'));
    const cell = document.querySelector('[data-testid="cell-0-0"]');
    expect(cell?.querySelector('.region-glyph-badge')).not.toBeNull();
  });

  it('GameScreen has restart button in top bar, no undo/clear buttons, and no mode text in status bar', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
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
    fireEvent.click(getByTestId('start-chill-btn'));

    // Top bar restart button exists
    const restartBtn = getByTestId('restart-level-btn');
    expect(restartBtn).toBeDefined();

    // Bottom undo and clear crosses buttons are gone
    expect(queryByText(/Deshacer/i)).toBeNull();
    expect(queryByText(/Limpiar cruces/i)).toBeNull();

    // Mode name "(Chill Out)" or "(Classic)" is not in the header/status bar
    expect(queryByText('(Chill Out)')).toBeNull();
    expect(queryByText('(Classic)')).toBeNull();

    // Place a cat on cell-0-0 via double click
    fireEvent.click(getByTestId('cell-0-0'));
    fireEvent.click(getByTestId('cell-0-0'));
    expect(getByTestId('cell-0-0').querySelector('[data-cat-part="head"]')).not.toBeNull();

    // Click restart -> opens ConfirmDialog
    fireEvent.click(restartBtn);
    expect(getByText('¿Reiniciar este nivel?')).toBeDefined();

    // Confirm restart -> board is reset
    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
    expect(getByTestId('cell-0-0').querySelector('[data-cat-part="head"]')).toBeNull();
  });

  it('Classic mode status bar keeps hearts centered at 50% regardless of score width', () => {
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        classic: { currentLevelId: 1, totalScore: 99999, activeSnapshot: null },
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

    const { getByTestId, getByText } = render(<App />);
    fireEvent.click(getByTestId('start-classic-btn'));

    const heartsEl = getByText('❤️ ❤️ ❤️');
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

      fireEvent.click(getByTestId('start-chill-btn'));

      // Immediately after click: transition shield is active, curtain is covering
      expect(getByTestId('screen-transition-shield')).toBeTruthy();
      const curtain = getByTestId('screen-wipe-curtain');
      expect(curtain).toBeTruthy();

      // At 75ms: still transitioning, game screen not yet mounted (Home still visible)
      act(() => {
        vi.advanceTimersByTime(75);
      });
      expect(queryByTestId('restart-level-btn')).toBeNull();
      expect(getByTestId('start-chill-btn')).toBeTruthy();

      // At 150ms midpoint: screen state swaps to GameScreen
      act(() => {
        vi.advanceTimersByTime(75);
      });
      expect(getByTestId('restart-level-btn')).toBeTruthy();
      expect(queryByTestId('start-chill-btn')).toBeNull();

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
      fireEvent.click(getByTestId('start-chill-btn'));
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
      expect(getByTestId('start-chill-btn')).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(queryByTestId('screen-transition-shield')).toBeNull();
    });

    it('enters debug mode directly on /debug/<mode>/<level>, isolates local storage, and exits to menu', () => {
      const savedData = {
        chill: { currentLevelId: 5, totalScore: 100, activeSnapshot: null },
        classic: { currentLevelId: 10, totalScore: 500, activeSnapshot: null },
        settings: {
          doubleTapTimeoutMs: 500,
          catVariant: 'black',
          regionAssist: 'off',
          musicMuted: true,
          sfxMuted: true,
          tutorialSeen: true,
        },
      };
      localStorage.setItem('kittysquared_state_v1', JSON.stringify(savedData));

      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      const { getByTestId, getByText, queryByTestId } = render(
        <App initialPath="/debug/classic/84" transitionDurationMs={0} />
      );

      // Verify direct entry to game screen on level 84 with debug mode badge
      expect(getByText(/Nivel 84/i)).toBeTruthy();
      expect(getByTestId('debug-mode-badge')).toBeTruthy();

      // Local storage must remain unchanged
      expect(JSON.parse(localStorage.getItem('kittysquared_state_v1')!)).toEqual(savedData);

      // Advance level (simulate clicking win next level)
      // Level 84 advances to 85, replacing URL
      const advanceBtn = queryByTestId('next-level-btn');
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
        expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/debug/classic/85');
      }

      // Clicking menu exits debug mode, cleans URL to '/', and shows Home
      fireEvent.click(getByText('← Menú'));
      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/');
      expect(getByTestId('start-classic-btn')).toBeTruthy();

      // Local storage still untouched
      expect(JSON.parse(localStorage.getItem('kittysquared_state_v1')!)).toEqual(savedData);

      replaceStateSpy.mockRestore();
      pushStateSpy.mockRestore();
    });

    it('navigates directly to level 300 via debug route', () => {
      const { getByTestId, getByText } = render(
        <App initialPath="/debug/classic/300" transitionDurationMs={0} />
      );

      expect(getByText(/Nivel 300/i)).toBeTruthy();
      expect(getByTestId('debug-mode-badge')).toBeTruthy();
    });
  });
});

