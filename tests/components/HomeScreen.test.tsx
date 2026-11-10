// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from '../../src/components/HomeScreen';
import {
  formatDailyDate,
  formatDailyDateSpanish,
  getPreviousDateString,
  getTodayDateString,
} from '../../src/engine/daily';
import { I18nProvider } from '../../src/i18n';
import { DailyProgress } from '../../src/types/puzzle';

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

    // Single unified play button with right-aligned level + paw coin score and NO emoji or "pts" text
    const playBtn = screen.getByTestId('start-game-btn');
    expect(playBtn).toBeDefined();
    expect(playBtn.textContent).toContain('Jugar');
    expect(playBtn.textContent).not.toContain('🎮');
    expect(playBtn.textContent).toContain('Nivel 4 / 300 • 125');
    expect(playBtn.textContent).not.toContain('pts');
    expect(screen.getByTestId('home-paw-coin-icon')).toBeDefined();

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
    expect(playBtn.textContent).toContain('300 / 300 • 16500');
    expect(playBtn.textContent).not.toContain('pts');

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

  it('renders Niveles button with earned stars and triggers onOpenLevels', () => {
    const onOpenLevels = vi.fn();
    render(
      <HomeScreen
        progress={{
          currentLevelId: 4,
          totalScore: 125,
          activeSnapshot: null,
          levelStars: { 1: 3, 2: 2, 3: 3 },
        }}
        totalLevels={300}
        catVariant="black"
        onPlay={vi.fn()}
        onOpenLevels={onOpenLevels}
        onOpenTutorial={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const levelsBtn = screen.getByTestId('open-levels-btn');
    expect(levelsBtn.textContent).toContain('Niveles');
    expect(levelsBtn.textContent).toContain('8 / 900');
    fireEvent.click(levelsBtn);
    expect(onOpenLevels).toHaveBeenCalledTimes(1);
  });

  describe('Reto Diario Card', () => {
    it('renders Reto Diario card between Jugar and Niveles with calendar icon and date', () => {
      render(
        <HomeScreen
          progress={defaultProgress}
          catVariant="black"
          onPlay={vi.fn()}
          onOpenLevels={vi.fn()}
          onOpenTutorial={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const playBtn = screen.getByTestId('start-game-btn');
      const dailyCard = screen.getByTestId('open-daily-btn');
      const levelsBtn = screen.getByTestId('open-levels-btn');

      expect(playBtn.compareDocumentPosition(dailyCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(dailyCard.compareDocumentPosition(levelsBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      expect(screen.getByTestId('daily-calendar-icon')).toBeDefined();
      expect(dailyCard.textContent).toContain('Reto Diario');

      const todayStr = getTodayDateString();
      const expectedDate = formatDailyDateSpanish(todayStr, 'long');
      expect(dailyCard.textContent).toContain(expectedDate);
    });

    it('renders unplayed today state with 10x10 Dificil pill and effective streak', () => {
      const todayStr = getTodayDateString();
      const yesterdayStr = getPreviousDateString(todayStr);
      const dailyUnplayed: DailyProgress = {
        lastPlayedDate: yesterdayStr,
        currentStreak: 4,
        maxStreak: 6,
        history: {},
        activeSnapshot: null,
        activeSnapshotDate: null,
      };

      render(
        <HomeScreen
          progress={defaultProgress}
          daily={dailyUnplayed}
          catVariant="black"
          onPlay={vi.fn()}
          onOpenTutorial={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const dailyCard = screen.getByTestId('open-daily-btn');
      expect(dailyCard.textContent).toContain('10×10 Difícil');
      expect(dailyCard.textContent).toContain('4');
      expect(screen.getByTestId('daily-flame-icon')).toBeDefined();
      expect(screen.queryByTestId('daily-check-icon')).toBeNull();
      expect(dailyCard.textContent).not.toContain('Completado');
    });

    it('renders completed today state with CheckIcon, Completado pill, stars, and streak', () => {
      const todayStr = getTodayDateString();
      const dailyCompleted: DailyProgress = {
        lastPlayedDate: todayStr,
        currentStreak: 5,
        maxStreak: 7,
        history: {
          [todayStr]: {
            date: todayStr,
            stars: 3,
            mistakes: 0,
            timeSeconds: 120,
            completedAt: new Date().toISOString(),
          },
        },
        activeSnapshot: null,
        activeSnapshotDate: null,
      };

      render(
        <HomeScreen
          progress={defaultProgress}
          daily={dailyCompleted}
          catVariant="black"
          onPlay={vi.fn()}
          onOpenTutorial={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const dailyCard = screen.getByTestId('open-daily-btn');
      expect(dailyCard.textContent).toContain('Completado');
      expect(screen.getByTestId('daily-check-icon')).toBeDefined();
      expect(dailyCard.textContent).toContain('3★');
      expect(screen.getByTestId('daily-flame-icon')).toBeDefined();
      expect(dailyCard.textContent).toContain('5');
      expect(dailyCard.textContent).not.toContain('10×10 Difícil');
    });

    it('triggers onOpenDaily callback when Reto Diario card is clicked', () => {
      const onOpenDaily = vi.fn();
      render(
        <HomeScreen
          progress={defaultProgress}
          catVariant="black"
          onPlay={vi.fn()}
          onOpenDaily={onOpenDaily}
          onOpenTutorial={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('open-daily-btn'));
      expect(onOpenDaily).toHaveBeenCalledTimes(1);
    });

    it('handles backward compatibility when daily prop is omitted', () => {
      render(
        <HomeScreen
          progress={defaultProgress}
          catVariant="black"
          onPlay={vi.fn()}
          onOpenTutorial={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const dailyCard = screen.getByTestId('open-daily-btn');
      expect(dailyCard).toBeDefined();
      expect(dailyCard.textContent).toContain('Reto Diario');
      expect(dailyCard.textContent).toContain('10×10 Difícil');
      expect(dailyCard.textContent).toContain('0');
      expect(screen.queryByTestId('daily-check-icon')).toBeNull();
    });
  });

  describe('Bilingual Localization (English)', () => {
    it('renders Play button, Levels button, and Level progress in English when wrapped in <I18nProvider lang="en">', () => {
      render(
        <I18nProvider lang="en">
          <HomeScreen
            progress={defaultProgress}
            totalLevels={300}
            catVariant="black"
            onPlay={vi.fn()}
            onOpenTutorial={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </I18nProvider>
      );

      const playBtn = screen.getByTestId('start-game-btn');
      expect(playBtn.textContent).toContain('Play');
      expect(playBtn.textContent).toContain('Level 4 / 300 • 125');

      const levelsBtn = screen.getByTestId('open-levels-btn');
      expect(levelsBtn.textContent).toContain('Levels');
    });

    it('renders Daily Challenge card with English title, formatted date, badge, and streak', () => {
      const todayStr = getTodayDateString();
      const yesterdayStr = getPreviousDateString(todayStr);
      const dailyUnplayed: DailyProgress = {
        lastPlayedDate: yesterdayStr,
        currentStreak: 4,
        maxStreak: 6,
        history: {},
        activeSnapshot: null,
        activeSnapshotDate: null,
      };

      render(
        <I18nProvider lang="en">
          <HomeScreen
            progress={defaultProgress}
            daily={dailyUnplayed}
            catVariant="black"
            onPlay={vi.fn()}
            onOpenTutorial={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </I18nProvider>
      );

      const dailyCard = screen.getByTestId('open-daily-btn');
      expect(dailyCard.textContent).toContain('Daily Challenge');
      const expectedEnDate = formatDailyDate(todayStr, 'long', 'en');
      expect(dailyCard.textContent).toContain(expectedEnDate);
      expect(dailyCard.textContent).toContain('10×10 Hard');
      expect(dailyCard.textContent).toContain('4');
    });

    it('renders Daily Challenge card completed badge in English', () => {
      const todayStr = getTodayDateString();
      const dailyCompleted: DailyProgress = {
        lastPlayedDate: todayStr,
        currentStreak: 5,
        maxStreak: 7,
        history: {
          [todayStr]: {
            date: todayStr,
            stars: 3,
            mistakes: 0,
            timeSeconds: 120,
            completedAt: new Date().toISOString(),
          },
        },
        activeSnapshot: null,
        activeSnapshotDate: null,
      };

      render(
        <I18nProvider lang="en">
          <HomeScreen
            progress={defaultProgress}
            daily={dailyCompleted}
            catVariant="black"
            onPlay={vi.fn()}
            onOpenTutorial={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </I18nProvider>
      );

      const dailyCard = screen.getByTestId('open-daily-btn');
      expect(dailyCard.textContent).toContain('Completed');
      expect(dailyCard.textContent).not.toContain('10×10 Hard');
    });

    it('renders localized Reset button and ConfirmDialog in English', () => {
      const onReset = vi.fn();
      render(
        <I18nProvider lang="en">
          <HomeScreen
            progress={defaultProgress}
            catVariant="black"
            onPlay={vi.fn()}
            onResetProgress={onReset}
            onOpenTutorial={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </I18nProvider>
      );

      const resetBtn = screen.getByTestId('home-reset-progress-btn');
      expect(resetBtn.textContent).toBe('Reset All Progress');

      fireEvent.click(resetBtn);
      expect(screen.getByRole('dialog', { name: 'Reset All Progress?' })).toBeDefined();
      expect(
        screen.getByText(
          'All completed levels, times, and unlocked kittens will be deleted. This action cannot be undone.'
        )
      ).toBeDefined();
      expect(screen.getByTestId('confirm-dialog-confirm-btn').textContent).toBe('Reset All Progress');
      expect(screen.getByTestId('confirm-dialog-cancel-btn').textContent).toBe('Cancel');
    });

    it('renders completed state banner on Play button in English when all levels are completed', () => {
      render(
        <I18nProvider lang="en">
          <HomeScreen
            progress={{
              currentLevelId: 301,
              totalScore: 16500,
              activeSnapshot: null,
            }}
            totalLevels={300}
            catVariant="black"
            onPlay={vi.fn()}
            onOpenTutorial={vi.fn()}
            onOpenSettings={vi.fn()}
          />
        </I18nProvider>
      );

      const playBtn = screen.getByTestId('start-game-btn');
      expect(playBtn.textContent).toContain('Game Completed!');
      expect(playBtn.textContent).toContain('300 / 300 • 16500');
    });
  });
});
