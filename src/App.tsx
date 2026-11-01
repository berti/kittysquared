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
  const [activeScreen, setActiveScreen] = useState<'home' | 'game'>('home');
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

  // Sync mute settings with soundEngine
  useEffect(() => {
    soundEngine.setMuted(appState.settings.musicMuted, appState.settings.sfxMuted);
  }, [appState.settings.musicMuted, appState.settings.sfxMuted]);

  // Persist state on change
  const updateAppState = (next: PersistedAppState) => {
    setAppState(next);
    savePersistedState(next);
  };

  const handlePlay = () => {
    navigateWithTransition('forward', () => {
      const currentLvlId = appState.progress.currentLevelId;
      const puzzle = puzzles.find((p) => p.id === currentLvlId) || puzzles[0];
      const newSession = createLevelSession(puzzle);

      // Restore saved board snapshot if exists
      const snap = appState.progress.activeSnapshot;
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

    updateAppState({
      ...appState,
      progress: {
        ...appState.progress,
        activeSnapshot: snap,
      },
    });
  };

  const handleAdvanceLevel = () => {
    navigateWithTransition('forward', () => {
      let newTotalScore = appState.progress.totalScore;
      if (session.status === 'won') {
        newTotalScore += session.partialScore + session.levelBonus;
      }

      if (session.puzzle.id >= puzzles.length) {
        // Final level completed: mark finished by setting currentLevelId past end, clear snapshot, and return to home
        updateAppState({
          ...appState,
          progress: {
            currentLevelId: session.puzzle.id + 1,
            totalScore: newTotalScore,
            activeSnapshot: null,
          },
        });
        setActiveScreen('home');
        return;
      }

      const nextLvlId = session.puzzle.id + 1;
      const puzzle = puzzles.find((p) => p.id === nextLvlId) || puzzles[puzzles.length - 1];

      updateAppState({
        ...appState,
        progress: {
          currentLevelId: nextLvlId,
          totalScore: newTotalScore,
          activeSnapshot: null,
        },
      });

      setSession(createLevelSession(puzzle));
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
          onReplayLastLevel={handleReplayLastLevel}
          onResetProgress={handleResetProgress}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenSettings={() => setShowSettings(true)}
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
          onBackToMenu={() =>
            navigateWithTransition('backward', () => {
              setActiveScreen('home');
            })
          }
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={appState.settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
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
