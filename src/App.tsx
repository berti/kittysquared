import { useEffect, useRef, useState } from 'preact/hooks';
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
import { clearDebugRoute, parseDebugRoute, updateDebugRoute } from './utils/route';

const puzzles = puzzlesData as PuzzleDef[];

export interface AppProps {
  transitionDurationMs?: number;
  initialPath?: string;
}

export function App({
  transitionDurationMs = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
  initialPath,
}: AppProps = {}) {
  const initialRoute = parseDebugRoute(
    initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  );

  const [appState, setAppState] = useState<PersistedAppState>(() => loadPersistedState());
  const [isDebug, setIsDebug] = useState<boolean>(!!initialRoute);
  const [activeScreen, setActiveScreen] = useState<'home' | 'game'>(initialRoute ? 'game' : 'home');
  const [activeMode, setActiveMode] = useState<GameMode>(initialRoute ? initialRoute.mode : 'chill');
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
  const [session, setSession] = useState<LevelSessionState>(() => {
    if (initialRoute) {
      const puzzle = puzzles.find((p) => p.id === initialRoute.levelId) || puzzles[0];
      return createLevelSession(puzzle, initialRoute.mode, true);
    }
    return createLevelSession(puzzles[0], 'chill');
  });

  // Listen for browser navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseDebugRoute(
        typeof window !== 'undefined' ? window.location.pathname : ''
      );
      if (route) {
        setIsDebug(true);
        setActiveMode(route.mode);
        const puzzle = puzzles.find((p) => p.id === route.levelId) || puzzles[0];
        setSession(createLevelSession(puzzle, route.mode, true));
        setActiveScreen('game');
      } else {
        setIsDebug(false);
        setActiveScreen('home');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

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
      setIsDebug(false);
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
    if (isDebug) {
      return;
    }
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
      const nextLvlId = Math.min(puzzles.length, session.puzzle.id + 1);
      const puzzle = puzzles.find((p) => p.id === nextLvlId) || puzzles[puzzles.length - 1];

      if (isDebug) {
        updateDebugRoute(activeMode, nextLvlId);
        setSession(createLevelSession(puzzle, activeMode, true));
        return;
      }

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
      const fresh = createLevelSession(session.puzzle, activeMode, isDebug);
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
          onBackToMenu={() =>
            navigateWithTransition('backward', () => {
              if (isDebug) {
                setIsDebug(false);
                clearDebugRoute();
              }
              setActiveScreen('home');
            })
          }
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
