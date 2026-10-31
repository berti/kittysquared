import { useEffect, useState } from 'preact/hooks';
import { soundEngine } from './audio/soundEngine';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { ScreenTransitionOverlay } from './components/ScreenTransitionOverlay';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import puzzlesData from './data/puzzles.json';
import { createLevelSession, LevelSessionState } from './state/gameState';
import {
  AppSettings,
  loadPersistedState,
  PersistedAppState,
  resetModeProgress,
  savePersistedState,
} from './state/storage';
import { GameMode, PuzzleDef } from './types/puzzle';

const puzzles = puzzlesData as PuzzleDef[];

export interface AppProps {
  transitionDurationMs?: number;
}

export function App({
  transitionDurationMs = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
}: AppProps = {}) {
  const [appState, setAppState] = useState<PersistedAppState>(() => loadPersistedState());
  const [activeScreen, setActiveScreen] = useState<'home' | 'game'>('home');
  const [activeMode, setActiveMode] = useState<GameMode>('chill');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [transitionState, setTransitionState] = useState<{
    isTransitioning: boolean;
    direction: 'forward' | 'backward';
    phase: 'idle' | 'covering' | 'uncovering';
  }>({
    isTransitioning: false,
    direction: 'forward',
    phase: 'idle',
  });

  const navigateWithTransition = (direction: 'forward' | 'backward', action: () => void) => {
    if (transitionState.isTransitioning) return;
    if (transitionDurationMs <= 0) {
      action();
      return;
    }

    const half = Math.floor(transitionDurationMs / 2);
    setTransitionState({ isTransitioning: true, direction, phase: 'covering' });

    setTimeout(() => {
      action();
      setTransitionState({ isTransitioning: true, direction, phase: 'uncovering' });

      setTimeout(() => {
        setTransitionState({ isTransitioning: false, direction, phase: 'idle' });
      }, half);
    }, half);
  };

  // Current session in play
  const [session, setSession] = useState<LevelSessionState>(() => {
    return createLevelSession(puzzles[0], 'chill');
  });

  // Sync mute settings with soundEngine
  useEffect(() => {
    soundEngine.setMuted(appState.settings.musicMuted, appState.settings.sfxMuted);
  }, [appState.settings.musicMuted, appState.settings.sfxMuted]);

  // Persist state on change
  const updateAppState = (next: PersistedAppState) => {
    setAppState(next);
    savePersistedState(next);
  };

  const handleStartMode = (mode: GameMode) => {
    navigateWithTransition('forward', () => {
      setActiveMode(mode);
      const currentLvlId = appState[mode].currentLevelId;
      const puzzle = puzzles.find((p) => p.id === currentLvlId) || puzzles[0];
      const newSession = createLevelSession(puzzle, mode);

      // Restore saved board snapshot if exists
      const snap = appState[mode].activeSnapshot;
      if (snap && snap.levelId === currentLvlId) {
        newSession.board = snap.board;
        newSession.lockedCats = snap.lockedCats;
        if (snap.errorCrosses) newSession.errorCrosses = snap.errorCrosses;
        newSession.mistakes = snap.mistakes;
        newSession.partialScore = snap.partialScore;
      }

      setSession(newSession);
      setActiveScreen('game');

      // Auto-open tutorial on first visit if not seen
      if (!appState.settings.tutorialSeen && currentLvlId === 1) {
        setShowTutorial(true);
        const nextSettings = { ...appState.settings, tutorialSeen: true };
        updateAppState({ ...appState, settings: nextSettings });
      }
    });
  };


  const handleUpdateSession = (nextSession: LevelSessionState) => {
    setSession(nextSession);
    // Auto-save snapshot
    const snap =
      nextSession.status === 'playing'
        ? {
            levelId: nextSession.puzzle.id,
            board: nextSession.board,
            lockedCats: nextSession.lockedCats,
            errorCrosses: nextSession.errorCrosses,
            mistakes: nextSession.mistakes,
            partialScore: nextSession.partialScore,
          }
        : null;

    const nextModeProgress = {
      ...appState[activeMode],
      activeSnapshot: snap,
    };

    updateAppState({
      ...appState,
      [activeMode]: nextModeProgress,
    });
  };

  const handleAdvanceLevel = () => {
    navigateWithTransition('forward', () => {
      const nextLvlId = Math.min(100, session.puzzle.id + 1);
      const puzzle = puzzles.find((p) => p.id === nextLvlId) || puzzles[puzzles.length - 1];

      let newTotalScore = appState[activeMode].totalScore;
      if (activeMode === 'classic' && session.status === 'won') {
        newTotalScore += session.partialScore + session.levelBonus;
      }

      const nextModeProgress = {
        currentLevelId: nextLvlId,
        totalScore: newTotalScore,
        activeSnapshot: null,
      };

      const nextApp = {
        ...appState,
        [activeMode]: nextModeProgress,
      };
      updateAppState(nextApp);

      setSession(createLevelSession(puzzle, activeMode));
    });
  };

  const handleRetryLevel = () => {
    navigateWithTransition('forward', () => {
      const fresh = createLevelSession(session.puzzle, activeMode);
      handleUpdateSession(fresh);
    });
  };

  const handleResetMode = (mode: GameMode) => {
    const next = resetModeProgress(appState, mode);
    setAppState(next);
    if (activeScreen === 'game' && activeMode === mode) {
      setSession(createLevelSession(puzzles[0], mode));
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    updateAppState({
      ...appState,
      settings: newSettings,
    });
  };

  const currentPuzzle =
    puzzles.find((p) => p.id === appState[activeMode].currentLevelId) || puzzles[0];

  return (
    <div>
      <ScreenTransitionOverlay {...transitionState} />

      {activeScreen === 'home' && (
        <HomeScreen
          chill={appState.chill}
          classic={appState.classic}
          catVariant={appState.settings.catVariant}
          onSelectMode={handleStartMode}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeScreen === 'game' && (
        <GameScreen
          puzzle={session.puzzle || currentPuzzle}
          progress={appState[activeMode]}
          settings={appState.settings}
          session={session}
          onUpdateSession={handleUpdateSession}
          onAdvanceLevel={handleAdvanceLevel}
          onRetryLevel={handleRetryLevel}
          onBackToMenu={() => navigateWithTransition('backward', () => setActiveScreen('home'))}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}


      {showSettings && (
        <SettingsModal
          settings={appState.settings}
          activeMode={activeScreen === 'game' ? activeMode : null}
          onUpdateSettings={handleUpdateSettings}
          onResetMode={handleResetMode}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTutorial && (
        <TutorialModal
          catVariant={appState.settings.catVariant}
          regionAssist={appState.settings.regionAssist}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
