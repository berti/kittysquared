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
  computeDailyWinOutcome,
  getDailyPuzzleForDate,
  getEffectiveStreak,
  getTodayDateString,
} from './engine/daily';
import {
  computeLevelWinOutcome,
  createLevelSession,
  LevelSessionState,
  restoreLevelSession,
} from './state/gameState';
import {
  AppSettings,
  getTotalEarnedStars,
  loadPersistedState,
  PersistedAppState,
  resetProgress,
  savePersistedState,
} from './state/storage';
import { PuzzleDef, SavedBoardSnapshot } from './types/puzzle';

const puzzles = puzzlesData as PuzzleDef[];

export interface AppProps {
  transitionDurationMs?: number;
}

export function App({
  transitionDurationMs = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
}: AppProps = {}) {
  const [appState, setAppState] = useState<PersistedAppState>(() => loadPersistedState());
  const [activeScreen, setActiveScreen] = useState<'home' | 'levels' | 'game'>('home');
  const [activeGameMode, setActiveGameMode] = useState<'campaign' | 'daily'>('campaign');
  const [dailySessionDate, setDailySessionDate] = useState<string | null>(null);
  const dailySessionDateRef = useRef<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const lockDailySessionDate = (date: string | null) => {
    dailySessionDateRef.current = date;
    setDailySessionDate(date);
  };
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
  const updateAppState = (
    next: PersistedAppState | ((prev: PersistedAppState) => PersistedAppState)
  ) => {
    setAppState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      savePersistedState(resolved);
      return resolved;
    });
  };

  const startSessionForLevel = (
    levelId: number,
    snapshotToCheck = appState.progress.activeSnapshot
  ): LevelSessionState => {
    const puzzle = puzzles.find((p) => p.id === levelId) || puzzles[0];
    return restoreLevelSession(puzzle, snapshotToCheck);
  };

  const handlePlay = () => {
    navigateWithTransition('forward', () => {
      setActiveGameMode('campaign');
      lockDailySessionDate(null);
      const currentLvlId = appState.progress.currentLevelId;
      const newSession = startSessionForLevel(currentLvlId);

      setSession(newSession);
      setActiveScreen('game');

      // Auto-open tutorial on first visit if not seen
      if (!appState.settings.tutorialSeen && currentLvlId === 1) {
        setShowTutorial(true);
        const nextSettings = { ...appState.settings, tutorialSeen: true };
        updateAppState((prev) => ({ ...prev, settings: nextSettings }));
      }
    });
  };

  const handleOpenDaily = () => {
    navigateWithTransition('forward', () => {
      const todayStr = getTodayDateString();
      setActiveGameMode('daily');
      lockDailySessionDate(todayStr);

      const dailyPuzzle = getDailyPuzzleForDate(todayStr);
      let newSession: LevelSessionState;

      if (
        appState.daily.activeSnapshot &&
        appState.daily.activeSnapshotDate === todayStr
      ) {
        newSession = restoreLevelSession(dailyPuzzle, appState.daily.activeSnapshot);
      } else {
        newSession = createLevelSession(dailyPuzzle);
      }

      setSession(newSession);
      setActiveScreen('game');
    });
  };

  const handleOpenLevels = () => {
    navigateWithTransition('forward', () => {
      setActiveScreen('levels');
    });
  };

  const handleSelectLevel = (levelId: number) => {
    navigateWithTransition('forward', () => {
      setActiveGameMode('campaign');
      lockDailySessionDate(null);
      const newSession = startSessionForLevel(levelId);
      setSession(newSession);
      setActiveScreen('game');

      if (!appState.settings.tutorialSeen && levelId === 1) {
        setShowTutorial(true);
        const nextSettings = { ...appState.settings, tutorialSeen: true };
        updateAppState((prev) => ({ ...prev, settings: nextSettings }));
      }
    });
  };

  const handleUpdateSession = (nextSession: LevelSessionState) => {
    setSession(nextSession);

    if (activeGameMode === 'daily') {
      const puzzleDate = dailySessionDateRef.current ?? dailySessionDate ?? getTodayDateString();
      const snap: SavedBoardSnapshot | null =
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

      updateAppState((prev) => ({
        ...prev,
        daily: {
          ...prev.daily,
          activeSnapshot: snap,
          activeSnapshotDate: snap ? puzzleDate : null,
        },
      }));
      return;
    }

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

    updateAppState((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        activeSnapshot: snap,
      },
    }));
  };

  const handleDailyWin = ({
    stars,
    mistakes,
    timeSeconds,
  }: {
    stars: 1 | 2 | 3;
    mistakes: number;
    timeSeconds: number;
  }) => {
    const puzzleDate = dailySessionDateRef.current ?? dailySessionDate ?? getTodayDateString();
    updateAppState((prev) => {
      const newDaily = computeDailyWinOutcome(
        prev.daily,
        puzzleDate,
        stars,
        mistakes,
        timeSeconds
      );
      return {
        ...prev,
        daily: newDaily,
      };
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
        setSession(createLevelSession(session.puzzle));
        setActiveScreen('home');
        return;
      }

      const nextLvlId = currentLvlId + 1;
      setSession(startSessionForLevel(nextLvlId, nextState.progress.activeSnapshot));
    });
  };

  const handleOpenLevelsFromGame = () => {
    navigateWithTransition('backward', () => {
      if (activeGameMode === 'campaign') {
        const nextState = commitCurrentLevelWinIfNeeded(appState);
        if (nextState !== appState) {
          updateAppState(nextState);
          // Reset session status so leaving and returning doesn't double-commit
          setSession(createLevelSession(session.puzzle));
        }
      } else {
        setSession(createLevelSession(session.puzzle));
      }
      setActiveGameMode('campaign');
      lockDailySessionDate(null);
      setActiveScreen('levels');
    });
  };

  const handleBackToMenuFromGame = () => {
    navigateWithTransition('backward', () => {
      if (activeGameMode === 'campaign') {
        const nextState = commitCurrentLevelWinIfNeeded(appState);
        if (nextState !== appState) {
          updateAppState(nextState);
          setSession(createLevelSession(session.puzzle));
        }
      } else {
        setSession(createLevelSession(session.puzzle));
      }
      setActiveGameMode('campaign');
      lockDailySessionDate(null);
      setActiveScreen('home');
    });
  };

  const handleRetryLevel = () => {
    navigateWithTransition('forward', () => {
      if (activeGameMode === 'campaign') {
        const nextState = commitCurrentLevelWinIfNeeded(appState);
        if (nextState !== appState) {
          updateAppState(nextState);
        }
      }
      const fresh = createLevelSession(session.puzzle);
      handleUpdateSession(fresh);
    });
  };

  const handleReplayLastLevel = () => {
    navigateWithTransition('forward', () => {
      setActiveGameMode('campaign');
      lockDailySessionDate(null);
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
          daily={appState.daily}
          onPlay={handlePlay}
          onOpenDaily={handleOpenDaily}
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
          onSelectCatVariant={(variant) => {
            if (activeGameMode === 'campaign') {
              const nextState = commitCurrentLevelWinIfNeeded(appState);
              updateAppState({
                ...nextState,
                settings: { ...nextState.settings, catVariant: variant },
              });
            } else {
              updateAppState((prev) => ({
                ...prev,
                settings: { ...prev.settings, catVariant: variant },
              }));
            }
          }}
          gameMode={activeGameMode}
          dailyDate={dailySessionDate ?? getTodayDateString()}
          dailyStreak={getEffectiveStreak(appState.daily, dailySessionDate ?? undefined)}
          onDailyWin={handleDailyWin}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={appState.settings}
          totalStars={
            getTotalEarnedStars(appState.progress) +
            (activeScreen === 'game' && activeGameMode === 'campaign' && session.status === 'won'
              ? Math.max(
                  0,
                  computeLevelWinOutcome(session, appState.progress).bestStars -
                    (appState.progress.levelStars?.[session.puzzle.id] ?? 0)
                )
              : 0)
          }
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
