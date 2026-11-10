// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LevelSelectScreen } from '../../src/components/LevelSelectScreen';
import { I18nProvider } from '../../src/i18n';

describe('LevelSelectScreen component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('auto-selects the tier tab containing currentLevelId, displays total and tier stars, and renders completed, frontier, and locked tiles', () => {
    const onSelectLevel = vi.fn();
    const onBack = vi.fn();

    render(
      <LevelSelectScreen
        progress={{
          currentLevelId: 18,
          totalScore: 1500,
          activeSnapshot: null,
          levelStars: {
            1: 3,
            16: 3,
            17: 2,
          },
        }}
        totalLevels={300}
        onSelectLevel={onSelectLevel}
        onBack={onBack}
      />
    );

    // Total stars pill shows sum of levelStars (3 + 3 + 2 = 8 / 900)
    expect(screen.getByTestId('level-select-total-stars').textContent).toContain('8 / 900');

    // Level 18 is in 6x6 tier (16..40), so tier-tab-6 is active
    expect(screen.getByTestId('tier-tab-6').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('tier-summary-banner').textContent).toContain('16–40');
    expect(screen.getByTestId('tier-summary-banner').textContent).toContain('5 / 75');

    // Completed tile 16 is enabled and clickable
    const tile16 = screen.getByTestId('level-tile-16') as HTMLButtonElement;
    expect(tile16.disabled).toBe(false);
    fireEvent.click(tile16);
    expect(onSelectLevel).toHaveBeenCalledWith(16);

    // Frontier tile 18 shows JUGAR and is clickable
    const tile18 = screen.getByTestId('level-tile-18') as HTMLButtonElement;
    expect(tile18.disabled).toBe(false);
    expect(tile18.textContent).toContain('JUGAR');
    fireEvent.click(tile18);
    expect(onSelectLevel).toHaveBeenCalledWith(18);

    // Locked tile 19 is disabled and does not fire onSelectLevel
    const tile19 = screen.getByTestId('level-tile-19') as HTMLButtonElement;
    expect(tile19.disabled).toBe(true);
    fireEvent.click(tile19);
    expect(onSelectLevel).toHaveBeenCalledTimes(2);

    // Switching to 5x5 tab renders levels 1..15
    fireEvent.click(screen.getByTestId('tier-tab-5'));
    expect(screen.getByTestId('level-tile-1')).toBeTruthy();

    // Back button calls onBack
    fireEvent.click(screen.getByTestId('level-select-back-btn'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('Review Focus #3: defaults to 10x10 tab and unlocks all 300 levels when game is completed (currentLevelId === 301)', () => {
    const onSelectLevel = vi.fn();
    render(
      <LevelSelectScreen
        progress={{
          currentLevelId: 301,
          totalScore: 25000,
          activeSnapshot: null,
          levelStars: { 300: 3 },
        }}
        totalLevels={300}
        onSelectLevel={onSelectLevel}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId('tier-tab-10').getAttribute('aria-selected')).toBe('true');
    const tile300 = screen.getByTestId('level-tile-300') as HTMLButtonElement;
    expect(tile300.disabled).toBe(false);
    fireEvent.click(tile300);
    expect(onSelectLevel).toHaveBeenCalledWith(300);
  });

  it('renders title, stars counter, back button, tier banner, frontier play button, and tile aria-labels in English when wrapped in <I18nProvider lang="en">', () => {
    const onSelectLevel = vi.fn();
    const onBack = vi.fn();

    render(
      <I18nProvider lang="en">
        <LevelSelectScreen
          progress={{
            currentLevelId: 18,
            totalScore: 1500,
            activeSnapshot: null,
            levelStars: {
              1: 3,
              16: 3,
              17: 2,
            },
          }}
          totalLevels={300}
          onSelectLevel={onSelectLevel}
          onBack={onBack}
        />
      </I18nProvider>
    );

    // Title and back button in English
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Levels');
    expect(screen.getByTestId('level-select-back-btn').textContent).toBe('← Menu');

    // Total stars counter in English
    const totalStars = screen.getByTestId('level-select-total-stars');
    expect(totalStars.getAttribute('aria-label') || totalStars.textContent).toContain('Stars: 8 / 900');

    // Tier banner in English: "Boards 6×6 (Lvl. 16–40)"
    expect(screen.getByTestId('tier-summary-banner').textContent).toContain('Boards 6×6 (Lvl. 16–40)');

    // Frontier tile shows PLAY and English aria-label
    const tile18 = screen.getByTestId('level-tile-18');
    expect(tile18.textContent).toContain('PLAY');
    expect(tile18.getAttribute('aria-label')).toBe('Level 18, current');

    // Completed tile aria-label
    const tile16 = screen.getByTestId('level-tile-16');
    expect(tile16.getAttribute('aria-label')).toBe('Level 16, 3 stars');

    // Locked tile aria-label
    const tile19 = screen.getByTestId('level-tile-19');
    expect(tile19.getAttribute('aria-label')).toBe('Level 19, locked');
  });
});
