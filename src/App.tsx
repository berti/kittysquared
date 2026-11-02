import { useEffect, useRef, useState } from 'preact/hooks';
import { soundEngine } from './audio/soundEngine';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { ScreenTransitionOverlay } from './components/ScreenTransitionOverlay';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import puzzlesData from './data/puzzles.json';
import {
  computeLevelWinOutcome,
  createLevelSession,
  LevelSessionState,
} from './state/gameState';
import {
  AppSettings,
  loadPersistedState,
  PersistedAppState,
  resetProgress,
  savePersistedState,
} from './state/storage';
import { PuzzleDef } from './types/puzzle';

const puzzles = puzzlesData as PuzzleDef[];

export interface AppProps {
  transitionDurationMs?: number;
}

export function App({
  transitionDurationMs = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
}: AppProps = {}) {
  const [appState, setAppState] = useState<PersistedAppState>(() => loadPersistedState());
  const [activeScreen, setActiveScreen] = useState<'home' | 'levels' | 'game'>('home');
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

  const isTransitioningRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const navigateWithTransition = (direction: 'forward' | 'backward', action: () => void) => {
    if (isTransitioningRef.current || transitionState.isTransitioning) return;
    if (transitionDurationMs <= 0) {
      action();
      return;
    }

    isTransitioningRef.current = true;
    const half = Math.floor(transitionDurationMs / 2);
    setTransitionState({ isTransitioning: true, direction, phase: 'covering' });

    const t1 = setTimeout(() => {
      action();
      setTransitionState({ isTransitioning: true, direction, phase: 'uncovering' });

      const t2 = setTimeout(() => {
        isTransitioningRef.current = false;
        setTransitionState({ isTransitioning: false, direction, phase: 'idle' });
      }, half);
      timersRef.current.push(t2);
    }, half);
    timersRef.current.push(t1);
  };

  // Current session in play
  const [session, setSession] = useState<LevelSessionState>(() =>
    createLevelSession(puzzles[0])
  );

  // Manage audio focus and visibility lifecycle (pauses music when unfocused or backgrounded)
  useEffect(() => {
    return soundEngine.initLifecycle();
  }, []);

  // Sync mute settings with soundEngine
  useEffect(() => {
    soundEngine.setMuted(appState.settings.musicMuted, appState.settings.sfxMuted);
  }, [appState.settings.musicMuted, appState.settings.sfxMuted]);

  // Sync volume settings with soundEngine
  useEffect(() => {
    soundEngine.setVolume(appState.settings.musicVolume ?? 0.75, appState.settings.sfxVolume ?? 0.75);
  }, [appState.settings.musicVolume, appState.settings.sfxVolume]);

  // Sync track preference with soundEngine
  useEffect(() => {
    soundEngine.setTrackPreference(appState.settings.musicTrack ?? 'auto');
  }, [appState.settings.musicTrack]);

  // Persist state on change
  const updateAppState = (next: PersistedAppState) => {
    setAppState(next);
    savePersistedState(next);
  };

  const startSessionForLevel = (
    levelId: number,
    snapshotToCheck = appState.progress.activeSnapshot
  ): LevelSessionState => {
    const puzzle = puzzles.find((p) => p.id === levelId) || puzzles[0];
    const newSession = createLevelSession(puzzle);

    if (snapshotToCheck && snapshotToCheck.levelId === levelId) {
      newSession.board = snapshotToCheck.board;
      newSession.lockedCats = snapshotToCheck.lockedCats;
      if (snapshotToCheck.errorCrosses) newSession.errorCrosses = snapshotToCheck.errorCrosses;
      newSession.mistakes = snapshotToCheck.mistakes;
      newSession.partialScore = snapshotToCheck.partialScore;
    }

    return newSession;
  };

  const handlePlay = () => {
    navigateWithTransition('forward', () => {
      const currentLvlId = appState.progress.currentLevelId;
      const newSession = startSessionForLevel(currentLvlId);

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

  const handleOpenLevels = () => {
    navigateWithTransition('forward', () => {
      setActiveScreen('levels');
    });
  };

  const handleSelectLevel = (levelId: number) => {
    navigateWithTransition('forward', () => {
      const newSession = startSessionForLevel(levelId);
      setSession(newSession);
      setActiveScreen('game');

      if (!appState.settings.tutorialSeen && levelId === 1) {
        setShowTutorial(true);
        const nextSettings = { ...appState.settings, tutorialSeen: true };
        updateAppState({ ...appState, settings: nextSettings });
      }
    });
  };

  const handleUpdateSession = (nextSession: LevelSessionState) => {
    setSession(nextSession);
    // Only auto-save snapshot if playing the frontier level
    const isFrontierSession = nextSession.puzzle.id === appState.progress.currentLevelId;
    if (!isFrontierSession) {
      return;
    }

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

    updateAppState({
      ...appState,
      progress: {
        ...appState.progress,
        activeSnapshot: snap,
      },
    });
  };

  const commitCurrentLevelWinIfNeeded = (baseState: PersistedAppState): PersistedAppState => {
    if (session.status !== 'won') {
      return baseState;
    }
    const currentLvlId = session.puzzle.id;
    const outcome = computeLevelWinOutcome(session, baseState.progress);
    const nextLevelStars = {
      ...(baseState.progress.levelStars || {}),
      [currentLvlId]: outcome.bestStars,
    };
    const nextActiveSnapshot = outcome.isReplay ? baseState.progress.activeSnapshot : null;

    return {
      ...baseState,
      progress: {
        currentLevelId: outcome.nextCurrentLevelId,
        totalScore: baseState.progress.totalScore + outcome.scoreGain,
        activeSnapshot: nextActiveSnapshot,
        levelStars: nextLevelStars,
      },
    };
  };

  const handleAdvanceLevel = () => {
    navigateWithTransition('forward', () => {
      const currentLvlId = session.puzzle.id;
      const nextState = commitCurrentLevelWinIfNeeded(appState);
      updateAppState(nextState);

      if (currentLvlId >= puzzles.length) {
        setActiveScreen('home');
        return;
      }

      const nextLvlId = currentLvlId + 1;
      setSession(startSessionForLevel(nextLvlId, nextState.progress.activeSnapshot));
    });
  };

  const handleOpenLevelsFromGame = () => {
    navigateWithTransition('backward', () => {
      const nextState = commitCurrentLevelWinIfNeeded(appState);
      if (nextState !== appState) {
        updateAppState(nextState);
        // Reset session status so leaving and returning doesn't double-commit
        setSession(createLevelSession(session.puzzle));
      }
      setActiveScreen('levels');
    });
  };

  const handleBackToMenuFromGame = () => {
    navigateWithTransition('backward', () => {
      const nextState = commitCurrentLevelWinIfNeeded(appState);
      if (nextState !== appState) {
        updateAppState(nextState);
        setSession(createLevelSession(session.puzzle));
      }
      setActiveScreen('home');
    });
  };

  const handleRetryLevel = () => {
    navigateWithTransition('forward', () => {
      const fresh = createLevelSession(session.puzzle);
      handleUpdateSession(fresh);
    });
  };

  const handleReplayLastLevel = () => {
    navigateWithTransition('forward', () => {
      const lastPuzzle = puzzles[puzzles.length - 1];
      const freshSession = createLevelSession(lastPuzzle);
      setSession(freshSession);
      setActiveScreen('game');
    });
  };

  const handleResetProgress = () => {
    const next = resetProgress(appState);
    setAppState(next);
    if (activeScreen === 'game') {
      setSession(createLevelSession(puzzles[0]));
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    updateAppState({
      ...appState,
      settings: newSettings,
    });
  };

  const currentPuzzle =
    puzzles.find((p) => p.id === appState.progress.currentLevelId) || puzzles[0];

  return (
    <div>
      <ScreenTransitionOverlay {...transitionState} />

      {activeScreen === 'home' && (
        <HomeScreen
          progress={appState.progress}
          totalLevels={puzzles.length}
          catVariant={appState.settings.catVariant}
          onPlay={handlePlay}
          onOpenLevels={handleOpenLevels}
          onReplayLastLevel={handleReplayLastLevel}
          onResetProgress={handleResetProgress}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeScreen === 'levels' && (
        <LevelSelectScreen
          progress={appState.progress}
          totalLevels={puzzles.length}
          onSelectLevel={handleSelectLevel}
          onBack={() =>
            navigateWithTransition('backward', () => {
              setActiveScreen('home');
            })
          }
        />
      )}

      {activeScreen === 'game' && (
        <GameScreen
          puzzle={session.puzzle || currentPuzzle}
          totalLevels={puzzles.length}
          progress={appState.progress}
          settings={appState.settings}
          session={session}
          onUpdateSession={handleUpdateSession}
          onAdvanceLevel={handleAdvanceLevel}
          onRetryLevel={handleRetryLevel}
          onBackToMenu={handleBackToMenuFromGame}
          onOpenLevels={handleOpenLevelsFromGame}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={appState.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTutorial && (
        <TutorialModal
          catVariant={appState.settings.catVariant}
          regionAssist={appState.settings.regionAssist}
          doubleTapTimeoutMs={appState.settings.doubleTapTimeoutMs}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
