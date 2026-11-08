import { useEffect, useRef, useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import { formatDailyDateSpanish, getTodayDateString } from '../engine/daily';
import { formatDailyShareText, shareDailyResult } from '../engine/share';
import {
  applyCellTap,
  applyDragCross,
  computeLevelWinOutcome,
  getStarsForMistakes,
  LevelSessionState,
} from '../state/gameState';
import {
  AppSettings,
  getNewlyUnlockedBreeds,
  getTotalEarnedStars,
  ModeProgress,
} from '../state/storage';
import { CatVariant, PuzzleDef } from '../types/puzzle';
import { Board } from './Board';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';
import {
  FlameIcon,
  GearIcon,
  HeartSvg,
  MiniCatIcon,
  PawCoinIcon,
  RestartIcon,
} from './Icons';

const STAR3_CONFETTI_VECTORS = [
  { tx: '-72px', ty: '-34px', rot: '-260deg', color: '#FF8FA3', round: false },
  { tx: '66px', ty: '-38px', rot: '290deg', color: '#FFB703', round: false },
  { tx: '-82px', ty: '16px', rot: '-210deg', color: '#2EC4B6', round: true },
  { tx: '74px', ty: '20px', rot: '240deg', color: '#C77DFF', round: false },
  { tx: '-52px', ty: '58px', rot: '310deg', color: '#80ED99', round: false },
  { tx: '58px', ty: '56px', rot: '-280deg', color: '#F3722C', round: false },
  { tx: '-18px', ty: '-46px', rot: '190deg', color: '#4EA8DE', round: true },
  { tx: '26px', ty: '64px', rot: '-230deg', color: '#FFD166', round: false },
  { tx: '44px', ty: '-42px', rot: '270deg', color: '#FF8FA3', round: false },
  { tx: '-42px', ty: '-30px', rot: '-180deg', color: '#2EC4B6', round: false },
  { tx: '-66px', ty: '40px', rot: '260deg', color: '#80ED99', round: false },
  { tx: '48px', ty: '42px', rot: '-310deg', color: '#C77DFF', round: true },
];

export interface GameScreenProps {
  puzzle: PuzzleDef;
  totalLevels?: number;
  progress: ModeProgress;
  settings: AppSettings;
  session: LevelSessionState;
  onUpdateSession: (session: LevelSessionState) => void;
  onAdvanceLevel: () => void;
  onRetryLevel: () => void;
  onBackToMenu: () => void;
  onOpenLevels?: () => void;
  onOpenSettings: () => void;
  onSelectCatVariant?: (variant: CatVariant) => void;
  gameMode?: 'campaign' | 'daily';
  dailyDate?: string;
  dailyStreak?: number;
  onDailyWin?: (result: { stars: 1 | 2 | 3; mistakes: number; timeSeconds: number }) => void;
}

export function GameScreen({
  puzzle,
  totalLevels,
  progress,
  settings,
  session,
  onUpdateSession,
  onAdvanceLevel,
  onRetryLevel,
  onBackToMenu,
  onOpenLevels,
  onOpenSettings,
  onSelectCatVariant,
  gameMode = 'campaign',
  dailyDate,
  dailyStreak = 0,
  onDailyWin,
}: GameScreenProps) {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isCelebratingVictory, setIsCelebratingVictory] = useState(false);
  const [justLostHeartIndex, setJustLostHeartIndex] = useState<number | null>(null);
  const [scorePopKey, setScorePopKey] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFiredDailyWinRef = useRef(false);
  const prevMistakesRef = useRef(session.mistakes);
  const prevPartialScoreRef = useRef(session.partialScore);
  const prevPuzzleIdRef = useRef(puzzle.id);
  const prevStatusRef = useRef(session.status);
  const latestSessionRef = useRef(session);
  latestSessionRef.current = session;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const placedCatsCount = session.board.flat().filter((c) => c === 'cat').length;
  const isLastLevel = totalLevels !== undefined && puzzle.id >= totalLevels;
  const isReplay =
    puzzle.id < progress.currentLevelId || progress.levelStars?.[puzzle.id] !== undefined;
  const winOutcome =
    session.status === 'won' && gameMode !== 'daily'
      ? computeLevelWinOutcome(session, progress)
      : null;
  const earnedStars = getStarsForMistakes(session.mistakes) as 1 | 2 | 3;

  const beforeStars = getTotalEarnedStars(progress);
  const prevLevelStars = progress.levelStars?.[puzzle.id] ?? 0;
  const starGain = winOutcome ? Math.max(0, winOutcome.bestStars - prevLevelStars) : 0;
  const afterStars = beforeStars + starGain;
  const newlyUnlockedBreeds =
    winOutcome && gameMode !== 'daily' ? getNewlyUnlockedBreeds(beforeStars, afterStars) : [];
  const latestUnlockedBreed =
    newlyUnlockedBreeds.length > 0
      ? newlyUnlockedBreeds[newlyUnlockedBreeds.length - 1]
      : null;

  // Live timer for daily mode
  useEffect(() => {
    if (gameMode !== 'daily' || session.status !== 'playing') {
      return;
    }
    const timer = setInterval(() => {
      setTimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameMode, session.status]);

  // Daily win notification
  useEffect(() => {
    if (gameMode === 'daily' && session.status === 'won' && !hasFiredDailyWinRef.current) {
      hasFiredDailyWinRef.current = true;
      const stars = getStarsForMistakes(session.mistakes) as 1 | 2 | 3;
      onDailyWin?.({ stars, mistakes: session.mistakes, timeSeconds });
    }
    if (session.status !== 'won') {
      hasFiredDailyWinRef.current = false;
    }
  }, [gameMode, session.status, session.mistakes, timeSeconds, onDailyWin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Detect puzzle reset / change or mistake / score changes via useEffect
  useEffect(() => {
    if (
      prevPuzzleIdRef.current !== puzzle.id ||
      (session.mistakes === 0 && prevMistakesRef.current > 0 && session.partialScore === 0)
    ) {
      prevPuzzleIdRef.current = puzzle.id;
      prevMistakesRef.current = session.mistakes;
      prevPartialScoreRef.current = session.partialScore;
      setJustLostHeartIndex(null);
      setScorePopKey(0);
      setTimeSeconds(0);
      return;
    }

    if (session.mistakes > prevMistakesRef.current) {
      const lostIdx = Math.max(0, session.maxMistakes - session.mistakes);
      prevMistakesRef.current = session.mistakes;
      setJustLostHeartIndex(lostIdx);
    } else if (session.mistakes < prevMistakesRef.current) {
      prevMistakesRef.current = session.mistakes;
      setJustLostHeartIndex(null);
    }

    if (session.partialScore > prevPartialScoreRef.current) {
      prevPartialScoreRef.current = session.partialScore;
      if (!isReplay) {
        setScorePopKey((k) => k + 1);
      }
    } else if (session.partialScore < prevPartialScoreRef.current) {
      prevPartialScoreRef.current = session.partialScore;
    }
  }, [puzzle.id, session.mistakes, session.partialScore, session.maxMistakes, isReplay]);

  useEffect(() => {
    if (justLostHeartIndex === null) return;
    const timer = setTimeout(() => {
      setJustLostHeartIndex(null);
    }, 750);
    return () => clearTimeout(timer);
  }, [justLostHeartIndex]);

  useEffect(() => {
    if (prevStatusRef.current === 'won' && session.status !== 'won' && isCelebratingVictory) {
      if (victoryTimerRef.current !== null) {
        clearTimeout(victoryTimerRef.current);
        victoryTimerRef.current = null;
      }
      setIsCelebratingVictory(false);
    }
    prevStatusRef.current = session.status;
  }, [session.status, isCelebratingVictory]);

  useEffect(() => {
    return () => {
      if (victoryTimerRef.current !== null) {
        clearTimeout(victoryTimerRef.current);
      }
    };
  }, []);

  const skipVictoryCelebration = () => {
    if (victoryTimerRef.current !== null) {
      clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = null;
    }
    setIsCelebratingVictory(false);
  };

  const statusScoreDelta = isReplay
    ? winOutcome
      ? winOutcome.scoreGain
      : 0
    : session.partialScore > 0
    ? session.partialScore + (session.status === 'won' ? session.levelBonus : 0)
    : 0;
  const victoryScoreGain = winOutcome
    ? winOutcome.scoreGain
    : session.partialScore + session.levelBonus;

  const renderVictoryUnlockedBanner = () => {
    if (!latestUnlockedBreed) return null;
    const isEquipped = settings.catVariant === latestUnlockedBreed.id;
    return (
      <div
        data-testid="victory-unlocked-breed-banner"
        style={{
          background: '#FFF8E7',
          border: '2px solid #F6D88A',
          borderRadius: '16px',
          padding: '10px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
            <CatSvg variant={latestUnlockedBreed.id} state="victory" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 900,
                color: '#92400E',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              ¡Nuevo gatito desbloqueado!
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: '#3D3135',
              }}
            >
              {latestUnlockedBreed.name}
            </div>
          </div>
        </div>
        <button
          type="button"
          data-testid="victory-equip-breed-btn"
          disabled={isEquipped}
          onClick={() => onSelectCatVariant?.(latestUnlockedBreed.id)}
          style={{
            background: isEquipped ? '#E2D6C1' : '#FF9770',
            color: isEquipped ? '#7A686F' : '#FFF',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: isEquipped ? 'default' : 'pointer',
            boxShadow: isEquipped ? 'none' : '0 2px 0 #D9724C',
            flexShrink: 0,
          }}
        >
          {isEquipped ? '¡Equipado!' : 'Equipar'}
        </button>
      </div>
    );
  };

  const handleCellTap = (r: number, c: number, options?: { isDoubleTap?: boolean }) => {
    const prevCell = latestSessionRef.current.board[r][c];
    const prevMistakes = latestSessionRef.current.mistakes;

    const next = applyCellTap(latestSessionRef.current, r, c, {
      ...options,
      autoCross: settings.autoCross,
    });
    latestSessionRef.current = next;
    onUpdateSession(next);

    // Audio & 2-phase celebration effects
    if (next.status === 'won') {
      soundEngine.playVictory();
      setIsCelebratingVictory(true);
      if (victoryTimerRef.current !== null) {
        clearTimeout(victoryTimerRef.current);
      }
      victoryTimerRef.current = setTimeout(() => {
        victoryTimerRef.current = null;
        setIsCelebratingVictory(false);
      }, 1400);

      if (gameMode === 'daily' && !hasFiredDailyWinRef.current) {
        hasFiredDailyWinRef.current = true;
        const stars = getStarsForMistakes(next.mistakes) as 1 | 2 | 3;
        onDailyWin?.({ stars, mistakes: next.mistakes, timeSeconds });
      }
    } else if (next.mistakes > prevMistakes || next.conflictingKeys.size > session.conflictingKeys.size) {
      soundEngine.playConflict();
    } else if (next.board[r][c] === 'cat' && prevCell !== 'cat') {
      soundEngine.playCatPlaced();
    } else if (next.board[r][c] !== prevCell) {
      soundEngine.playCross();
    }
  };

  const handleShare = async () => {
    const text = formatDailyShareText({
      dateStr: dailyDate ?? getTodayDateString(),
      stars: earnedStars,
      mistakes: session.mistakes,
      timeSeconds,
      streak: dailyStreak,
    });
    const res = await shareDailyResult(text);
    if (res === 'copied') {
      setShowToast(true);
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
        toastTimerRef.current = null;
      }, 2500);
    }
  };

  const handleDragCross = (r: number, c: number, target: 'cross' | 'empty') => {
    const prevCell = latestSessionRef.current.board[r][c];
    const next = applyDragCross(latestSessionRef.current, r, c, target);
    latestSessionRef.current = next;
    onUpdateSession(next);
    if (next.board[r][c] !== prevCell) {
      soundEngine.playCross();
    }
  };

  const remainingLives = Math.max(0, session.maxMistakes - session.mistakes);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '88vh',
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <button
            onClick={onBackToMenu}
            style={{
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 2px 0 #E2D6C1',
              borderRadius: '10px',
              padding: '7px 14px',
              fontWeight: 800,
              fontSize: '15px',
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            ← Menú
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '19px', color: '#3D3135' }}>
              {gameMode === 'daily' ? 'Reto Diario' : `Nivel ${puzzle.id}`}
            </div>
            {gameMode === 'daily' && dailyDate && (
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#7A686F' }}>
                {formatDailyDateSpanish(dailyDate, 'short')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid="restart-level-btn"
              onClick={() => setShowRestartConfirm(true)}
              title="Reiniciar nivel actual"
              style={{
                background: '#F3E9D2',
                border: '2px solid #E2D6C1',
                boxShadow: '0 2px 0 #E2D6C1',
                borderRadius: '10px',
                padding: '7px 11px',
                fontWeight: 800,
                fontSize: '16px',
                color: '#5C4B51',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RestartIcon size={18} />
            </button>
            <button
              data-testid="open-settings-btn"
              onClick={onOpenSettings}
              title="Ajustes"
              style={{
                background: '#F3E9D2',
                border: '2px solid #E2D6C1',
                boxShadow: '0 2px 0 #E2D6C1',
                borderRadius: '10px',
                padding: '7px 11px',
                fontWeight: 800,
                fontSize: '16px',
                color: '#5C4B51',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GearIcon size={18} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div
          data-testid="game-status-bar"
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            padding: '10px 16px',
            borderRadius: '16px',
            fontSize: '16.5px',
            fontWeight: 900,
            color: '#3D3135',
            marginBottom: '16px',
            boxShadow: '0 2px 0 rgba(0,0,0,0.03)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MiniCatIcon size={20} /> {placedCatsCount} / {puzzle.size}
          </span>

          {/* Custom SVG Hearts Row */}
          <span
            data-testid="status-hearts-group"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {Array.from({ length: session.maxMistakes }).map((_, idx) => {
              const isFull = idx < remainingLives;
              const isJustLost = !isFull && idx === justLostHeartIndex;
              return (
                <HeartSvg
                  key={idx}
                  isLost={!isFull}
                  isJustLost={isJustLost}
                  size={20}
                  testId={`status-heart-${idx}`}
                />
              );
            })}
          </span>

          {gameMode === 'daily' ? (
            <span
              data-testid="daily-timer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 800,
                color: '#5C4B51',
              }}
            >
              {formattedTime}
            </span>
          ) : (
            <span
              key={scorePopKey}
              className={scorePopKey > 0 ? 'score-pill-pulse' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <PawCoinIcon size={20} testId="score-paw-coin-icon" />
              {progress.totalScore}{' '}
              {statusScoreDelta > 0 && (
                <span style={{ color: '#E07A5F' }}>(+{statusScoreDelta})</span>
              )}
            </span>
          )}
          {gameMode !== 'daily' && scorePopKey > 0 && (
            <span
              key={`pop-${scorePopKey}`}
              data-testid="score-float-pop"
              className="score-float-pop"
            >
              +10
            </span>
          )}
        </div>
      </div>

      {/* Board & Phase 1 Tap-to-Skip Celebration Overlay */}
      <div style={{ position: 'relative' }}>
        <Board
          size={puzzle.size}
          regions={puzzle.regions}
          board={session.board}
          lockedCats={session.lockedCats}
          errorCrosses={session.errorCrosses}
          conflictingKeys={session.conflictingKeys}
          lastPlacedCat={session.lastPlacedCat}
          lastErrorCell={session.lastErrorCell}
          autoCrossCells={session.lastAutoCrossCells}
          isVictory={session.status === 'won'}
          catVariant={settings.catVariant}
          regionAssist={settings.regionAssist}
          doubleTapTimeoutMs={settings.doubleTapTimeoutMs}
          onCellTap={handleCellTap}
          onDragCross={handleDragCross}
        />
        {session.status === 'won' && isCelebratingVictory && (
          <div
            data-testid="victory-celebration-overlay"
            onClick={skipVictoryCelebration}
            title="Toca para continuar"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              cursor: 'pointer',
              background: 'transparent',
            }}
          />
        )}
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: '14.5px',
            color: '#7A686E',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          1 toque: ✕ Cruz • 2 toques: <MiniCatIcon size={16} /> Gato
        </div>
      </div>

      {/* Confirmation Dialog for Restart Level */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        title="¿Reiniciar este nivel?"
        description="Se reiniciará el tablero actual, borrando todos los gatos y cruces colocados."
        icon={<RestartIcon size={28} />}
        confirmText="Reiniciar nivel"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowRestartConfirm(false);
          onRetryLevel();
        }}
        onCancel={() => setShowRestartConfirm(false)}
      />

      {/* Victory Modal (Phase 2) */}
      {session.status === 'won' && !isCelebratingVictory && (
        <div
          data-testid="victory-modal-backdrop"
          class="modal-backdrop-anim"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 49, 53, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            data-testid="victory-modal-card"
            class="modal-card-flyin"
            style={{
              backgroundColor: '#FFFBF2',
              border: `4px solid ${earnedStars === 3 ? '#FFB703' : '#E2D6C1'}`,
              borderRadius: '24px',
              padding: '22px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            {/* 3-Star Arch */}
            <div
              data-testid="victory-stars-arch"
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: '8px',
                marginBottom: '8px',
                minHeight: '48px',
              }}
            >
              {[1, 2, 3].map((starIdx) => {
                const isEarned = starIdx <= earnedStars;
                const size = starIdx === 2 ? 42 : 32;
                const starClass = isEarned
                  ? `victory-star-earned-${starIdx}`
                  : `victory-star-empty-${starIdx}`;

                return (
                  <div
                    key={starIdx}
                    style={{
                      position: 'relative',
                      width: `${size}px`,
                      height: `${size}px`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {starIdx === 3 && earnedStars === 3 && (
                      <div
                        data-testid="victory-third-star-confetti"
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
                      >
                        {STAR3_CONFETTI_VECTORS.map((vec, i) => (
                          <span
                            key={i}
                            className="star3-confetti-piece"
                            style={{
                              background: vec.color,
                              borderRadius: vec.round ? '50%' : '2px',
                              '--tx': vec.tx,
                              '--ty': vec.ty,
                              '--rot': vec.rot,
                            } as Record<string, string>}
                          />
                        ))}
                      </div>
                    )}
                    <svg
                      data-testid={`victory-star-${starIdx}`}
                      data-earned={isEarned ? 'true' : 'false'}
                      className={starClass}
                      width={size}
                      height={size}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2.4l2.85 5.78 6.38.93-4.61 4.5 1.09 6.35L12 17l-5.71 2.96 1.09-6.35-4.61-4.5 6.38-.93L12 2.4z"
                        fill={isEarned ? '#FFB703' : '#E6DAC6'}
                        stroke={isEarned ? '#D97706' : '#C9B99F'}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>

            <div style={{ width: '56px', height: '56px', margin: '0 auto 8px' }}>
              <CatSvg variant={settings.catVariant} state="victory" />
            </div>

            {gameMode === 'daily' ? (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '23px', fontWeight: 900, color: '#3D3135' }}>
                  ¡Reto Diario Completado!
                </h2>
                <div
                  data-testid="daily-victory-stats"
                  style={{
                    background: '#F3E9D2',
                    border: '2px solid #E2D6C1',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    fontSize: '14.5px',
                    color: '#5C4B51',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Fallos:</span>
                    <strong>
                      {session.mistakes === 0
                        ? '0 fallos'
                        : session.mistakes === 1
                        ? '1 fallo'
                        : `${session.mistakes} fallos`}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tiempo:</span>
                    <strong>{formattedTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Racha:</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#E07A5F',
                        fontWeight: 900,
                      }}
                    >
                      <FlameIcon size={18} /> {dailyStreak} {dailyStreak === 1 ? 'd\u00eda' : 'd\u00edas'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    data-testid="daily-share-btn"
                    onClick={handleShare}
                    style={{
                      background: '#F3E9D2',
                      color: '#5C4B51',
                      border: '2px solid #E2D6C1',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: '0 4px 0 #E2D6C1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Compartir
                  </button>
                  <button
                    type="button"
                    data-testid="daily-home-btn"
                    onClick={onBackToMenu}
                    style={{
                      flex: 1,
                      background: '#FF9770',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '16px',
                      boxShadow: '0 4px 0 #D9724C',
                      cursor: 'pointer',
                    }}
                  >
                    Volver al inicio
                  </button>
                </div>
              </>
            ) : isLastLevel ? (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '23px', fontWeight: 900, color: '#3D3135' }}>
                  ¡Juego completado!
                </h2>
                <div
                  data-testid="victory-score-card"
                  style={{
                    background: '#F3E9D2',
                    border: '2px solid #E2D6C1',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '14.5px',
                    color: '#5C4B51',
                    fontWeight: 700,
                  }}
                >
                  <div>¡Has superado los {totalLevels} niveles!</div>
                  {isReplay ? (
                    <div>
                      {victoryScoreGain > 0
                        ? `+${victoryScoreGain} pts (mejora de récord)`
                        : '+0 pts (ya completado)'}
                    </div>
                  ) : (
                    <>
                      <div>Puntos gatos: +{session.partialScore}</div>
                      <div>
                        Bono {earnedStars}★ (
                        {session.mistakes === 0
                          ? '0 fallos'
                          : session.mistakes === 1
                          ? '1 fallo'
                          : '2 fallos'}
                        ): +{session.levelBonus}
                      </div>
                    </>
                  )}
                  <div
                    style={{
                      marginTop: '4px',
                      color: '#3D3135',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <PawCoinIcon size={16} testId="victory-paw-coin-icon" />
                    <strong>Puntuación final: {progress.totalScore + victoryScoreGain} pts</strong>
                  </div>
                </div>
                {renderVictoryUnlockedBanner()}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    data-testid="victory-levels-btn"
                    onClick={onOpenLevels ?? onBackToMenu}
                    style={{
                      background: '#F3E9D2',
                      color: '#5C4B51',
                      border: '2px solid #E2D6C1',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: '0 4px 0 #E2D6C1',
                      cursor: 'pointer',
                    }}
                  >
                    Niveles
                  </button>
                  <button
                    type="button"
                    onClick={onAdvanceLevel}
                    style={{
                      flex: 1,
                      background: '#FF9770',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '16px',
                      boxShadow: '0 4px 0 #D9724C',
                      cursor: 'pointer',
                    }}
                  >
                    Volver al Menú Principal
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 8px', fontSize: '23px', fontWeight: 900, color: '#3D3135' }}>
                  ¡Nivel {puzzle.id} superado!
                </h2>
                <div
                  data-testid="victory-score-card"
                  style={{
                    background: '#F3E9D2',
                    border: '2px solid #E2D6C1',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '14.5px',
                    color: '#5C4B51',
                    fontWeight: 700,
                  }}
                >
                  {isReplay ? (
                    <div>
                      {victoryScoreGain > 0
                        ? `+${victoryScoreGain} pts (mejora de récord)`
                        : '+0 pts (ya completado)'}
                    </div>
                  ) : (
                    <>
                      <div>Puntos gatos: +{session.partialScore}</div>
                      <div>
                        Bono {earnedStars}★ (
                        {session.mistakes === 0
                          ? '0 fallos'
                          : session.mistakes === 1
                          ? '1 fallo'
                          : '2 fallos'}
                        ): +{session.levelBonus}
                      </div>
                    </>
                  )}
                  <div
                    style={{
                      marginTop: '4px',
                      color: '#3D3135',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <PawCoinIcon size={16} testId="victory-paw-coin-icon" />
                    <strong>Nuevo total: {progress.totalScore + victoryScoreGain} pts</strong>
                  </div>
                </div>
                {renderVictoryUnlockedBanner()}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    data-testid="victory-levels-btn"
                    onClick={onOpenLevels ?? onBackToMenu}
                    style={{
                      background: '#F3E9D2',
                      color: '#5C4B51',
                      border: '2px solid #E2D6C1',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: '0 4px 0 #E2D6C1',
                      cursor: 'pointer',
                    }}
                  >
                    Niveles
                  </button>
                  <button
                    type="button"
                    data-testid="victory-next-btn"
                    onClick={onAdvanceLevel}
                    style={{
                      flex: 1,
                      background: '#FF9770',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '14px',
                      fontWeight: 800,
                      fontSize: '16.5px',
                      boxShadow: '0 4px 0 #D9724C',
                      cursor: 'pointer',
                    }}
                  >
                    Siguiente Nivel ▶
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {session.status === 'lost' && (
        <div
          data-testid="defeat-modal-backdrop"
          class="modal-backdrop-anim"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 49, 53, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            data-testid="defeat-modal-card"
            class="modal-card-flyin"
            style={{
              backgroundColor: '#FFFBF2',
              border: '4px solid #E2D6C1',
              borderRadius: '24px',
              padding: '22px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            {/* 3 Broken Hearts Arch */}
            <div
              data-testid="defeat-hearts-arch"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              {[1, 2, 3].map((idx) => {
                const size = idx === 2 ? 32 : 26;
                const isCenter = idx === 2;
                const fill = isCenter ? '#EF4444' : '#D8CBB8';
                const stroke = isCenter ? '#B91C1C' : '#BDAE98';
                const rot = idx === 1 ? '-10deg' : idx === 3 ? '10deg' : '0deg';
                return (
                  <svg
                    key={idx}
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    style={{
                      transform: isCenter ? 'translateY(-3px)' : `rotate(${rot})`,
                    }}
                  >
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09L10.5 9.5l2.2 3.5-1.5 3.5L12 21.35z"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.4"
                    />
                    <path
                      d="M12 5.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35l-.8-4.85 1.5-3.5-2.2-3.5L12 5.09z"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.4"
                    />
                  </svg>
                );
              })}
            </div>

            <div style={{ width: '56px', height: '56px', margin: '0 auto 8px' }}>
              <CatSvg variant={settings.catVariant} state="conflict" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '23px', fontWeight: 900, color: '#EF4444' }}>
              3 fallos alcanzados
            </h2>
            <p
              style={{
                background: '#F3E9D2',
                border: '2px solid #E2D6C1',
                borderRadius: '14px',
                padding: '10px 12px',
                margin: '0 0 16px',
                fontSize: '14px',
                color: '#5C4B51',
                fontWeight: 700,
              }}
            >
              Se han perdido los puntos parciales de este intento. Puedes reintentar el nivel manteniendo tu puntuación anterior.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                data-testid="defeat-levels-btn"
                onClick={onOpenLevels ?? onBackToMenu}
                style={{
                  background: '#F3E9D2',
                  color: '#5C4B51',
                  border: '2px solid #E2D6C1',
                  borderRadius: '14px',
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  boxShadow: '0 4px 0 #E2D6C1',
                  cursor: 'pointer',
                }}
              >
                Niveles
              </button>
              <button
                type="button"
                data-testid="defeat-retry-btn"
                onClick={onRetryLevel}
                style={{
                  flex: 1,
                  background: '#FF9770',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '16.5px',
                  boxShadow: '0 4px 0 #D9724C',
                  cursor: 'pointer',
                }}
              >
                Reintentar Nivel ↻
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div
          data-testid="share-toast"
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#FFF8F0',
            color: '#3D3135',
            border: '2px solid #EADCC9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '14px',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '14px',
            zIndex: 1100,
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ¡Resultado copiado al portapapeles!
        </div>
      )}
    </div>
  );
}
