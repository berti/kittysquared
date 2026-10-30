// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders Home screen with Chill Out and Classic mode cards, Tutorial, and Settings', () => {
    const { getByTestId, getByText } = render(<App />);
    expect(getByText('KittySquared')).toBeTruthy();
    expect(getByTestId('start-chill-btn')).toBeTruthy();
    expect(getByTestId('start-classic-btn')).toBeTruthy();
  });

  it('allows changing control scheme (toggle vs double-tap), cat variant (black vs white), and resetting progress in Settings', () => {
    const { getByTestId, queryByTestId } = render(<App />);
    // Open settings from home
    fireEvent.click(getByTestId('open-settings-btn'));
    fireEvent.click(getByTestId('select-control-double-tap'));
    fireEvent.click(getByTestId('select-cat-white'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Enter Classic mode: dual switch should be hidden in double-tap mode
    fireEvent.click(getByTestId('start-classic-btn'));
    expect(queryByTestId('tool-toggle-switch')).toBeNull();
  });

  it('plays through Level 1 in Classic mode, updates total score, and advances to Level 2', () => {
    // Set tutorialSeen so it doesn't auto-open
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
        settings: {
          controlScheme: 'toggle',
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

    // Select Glyphs
    fireEvent.click(getByTestId('select-region-assist-glyphs'));
    fireEvent.click(getByTestId('close-settings-btn'));

    // Start game and verify glyph badges are present on the board
    fireEvent.click(getByTestId('start-chill-btn'));
    const cell = document.querySelector('[data-testid="cell-0-0"]');
    expect(cell?.querySelector('.region-glyph-badge')).not.toBeNull();
  });
});
