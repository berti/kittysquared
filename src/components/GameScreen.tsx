import { useEffect, useRef, useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import {
  applyCellTap,
  applyDragCross,
  computeLevelWinOutcome,
  getStarsForMistakes,
  LevelSessionState,
} from '../state/gameState';
import { AppSettings, ModeProgress } from '../state/storage';
import { PuzzleDef } from '../types/puzzle';
import { Board } from './Board';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';

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
}: GameScreenProps) {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isCelebratingVictory, setIsCelebratingVictory] = useState(false);
  const [justLostHeartIndex, setJustLostHeartIndex] = useState<number | null>(null);
  const [scorePopKey, setScorePopKey] = useState(0);

  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMistakesRef = useRef(session.mistakes);
  const prevPartialScoreRef = useRef(session.partialScore);
  const prevPuzzleIdRef = useRef(puzzle.id);
  const prevStatusRef = useRef(session.status);

  const placedCatsCount = session.board.flat().filter((c) => c === 'cat').length;
  const isLastLevel = totalLevels !== undefined && puzzle.id >= totalLevels;
  const isReplay =
    puzzle.id < progress.currentLevelId || progress.levelStars?.[puzzle.id] !== undefined;
  const winOutcome =
    session.status === 'won' ? computeLevelWinOutcome(session, progress) : null;
  const earnedStars = getStarsForMistakes(session.mistakes);

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

  const handleCellTap = (r: number, c: number, options?: { isDoubleTap?: boolean }) => {
    const prevCell = session.board[r][c];
    const prevMistakes = session.mistakes;

    const next = applyCellTap(session, r, c, {
      ...options,
      autoCross: settings.autoCross,
    });
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
    } else if (next.mistakes > prevMistakes || next.conflictingKeys.size > session.conflictingKeys.size) {
      soundEngine.playConflict();
    } else if (next.board[r][c] === 'cat' && prevCell !== 'cat') {
      soundEngine.playCatPlaced();
    } else if (next.board[r][c] !== prevCell) {
      soundEngine.playCross();
    }
  };

  const handleDragCross = (r: number, c: number, target: 'cross' | 'empty') => {
    const next = applyDragCross(session, r, c, target);
    onUpdateSession(next);
    soundEngine.playCross();
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontWeight: 900, fontSize: '19px', color: '#3D3135' }}>
              Nivel {puzzle.id}
            </div>
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
              }}
            >
              ↺
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
              }}
            >
              ⚙️
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
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🐱</span> {placedCatsCount} / {puzzle.size}
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
              const fill = isFull ? '#EF4444' : '#D8CBB8';
              const stroke = isFull ? '#B91C1C' : '#BDAE98';

              return (
                <svg
                  key={idx}
                  data-testid={`status-heart-${idx}`}
                  data-state={isFull ? 'full' : 'empty'}
                  className={isJustLost ? 'heart-losing' : undefined}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  style={{ display: 'block', overflow: 'visible' }}
                >
                  {isFull ? (
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.6"
                    />
                  ) : (
                    <>
                      <path
                        className="heart-half-left"
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09L10.5 9.5l2.2 3.5-1.5 3.5L12 21.35z"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="1.4"
                      />
                      <path
                        className="heart-half-right"
                        d="M12 5.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35l-.8-4.85 1.5-3.5-2.2-3.5L12 5.09z"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="1.4"
                      />
                    </>
                  )}
                </svg>
              );
            })}
          </span>

          <span
            key={scorePopKey}
            className={scorePopKey > 0 ? 'score-pill-pulse' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <svg
              data-testid="score-paw-coin-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{ display: 'block', flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" fill="#FFB703" stroke="#B45309" strokeWidth="2" />
              <path
                d="M8.5 14.8 C8.5 12.6, 15.5 12.6, 15.5 14.8 C15.5 16.5, 13.8 17.2, 12 17.2 C10.2 17.2, 8.5 16.5, 8.5 14.8 Z"
                fill="#B45309"
              />
              <ellipse
                cx="7.8"
                cy="10.8"
                rx="1.4"
                ry="1.8"
                transform="rotate(-20 7.8 10.8)"
                fill="#B45309"
              />
              <ellipse
                cx="10.6"
                cy="9.2"
                rx="1.4"
                ry="1.9"
                transform="rotate(-6 10.6 9.2)"
                fill="#B45309"
              />
              <ellipse
                cx="13.4"
                cy="9.2"
                rx="1.4"
                ry="1.9"
                transform="rotate(6 13.4 9.2)"
                fill="#B45309"
              />
              <ellipse
                cx="16.2"
                cy="10.8"
                rx="1.4"
                ry="1.8"
                transform="rotate(20 16.2 10.8)"
                fill="#B45309"
              />
            </svg>
            {progress.totalScore}{' '}
            {statusScoreDelta > 0 && (
              <span style={{ color: '#E07A5F' }}>(+{statusScoreDelta})</span>
            )}
          </span>
          {scorePopKey > 0 && (
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
        <div style={{ textAlign: 'center', fontSize: '14.5px', color: '#7A686E', fontWeight: 700 }}>
          1 toque: ✕ Cruz • 2 toques: 🐱 Gato
        </div>
      </div>

      {/* Confirmation Dialog for Restart Level */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        title="¿Reiniciar este nivel?"
        description="Se reiniciará el tablero actual, borrando todos los gatos y cruces colocados."
        icon="↺"
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

            {isLastLevel ? (
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
                    <svg
                      data-testid="victory-paw-coin-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      style={{ display: 'block', flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" fill="#FFB703" stroke="#B45309" strokeWidth="2" />
                      <path
                        d="M8.5 14.8 C8.5 12.6, 15.5 12.6, 15.5 14.8 C15.5 16.5, 13.8 17.2, 12 17.2 C10.2 17.2, 8.5 16.5, 8.5 14.8 Z"
                        fill="#B45309"
                      />
                    </svg>
                    <strong>Puntuación final: {progress.totalScore + victoryScoreGain} pts</strong>
                  </div>
                </div>
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
                    <svg
                      data-testid="victory-paw-coin-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      style={{ display: 'block', flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" fill="#FFB703" stroke="#B45309" strokeWidth="2" />
                      <path
                        d="M8.5 14.8 C8.5 12.6, 15.5 12.6, 15.5 14.8 C15.5 16.5, 13.8 17.2, 12 17.2 C10.2 17.2, 8.5 16.5, 8.5 14.8 Z"
                        fill="#B45309"
                      />
                    </svg>
                    <strong>Nuevo total: {progress.totalScore + victoryScoreGain} pts</strong>
                  </div>
                </div>
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
    </div>
  );
}
