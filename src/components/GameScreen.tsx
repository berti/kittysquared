import { useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import {
  applyCellTap,
  applyDragCross,
  LevelSessionState,
} from '../state/gameState';
import { AppSettings, ModeProgress } from '../state/storage';
import { PuzzleDef } from '../types/puzzle';
import { Board } from './Board';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';

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
  onOpenSettings,
}: GameScreenProps) {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const placedCatsCount = session.board.flat().filter((c) => c === 'cat').length;
  const isLastLevel = totalLevels !== undefined && puzzle.id >= totalLevels;

  const handleCellTap = (r: number, c: number, options?: { isDoubleTap?: boolean }) => {
    const prevCell = session.board[r][c];
    const prevMistakes = session.mistakes;

    const next = applyCellTap(session, r, c, options);
    onUpdateSession(next);

    // Audio effects
    if (next.status === 'won') {
      soundEngine.playVictory();
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

  // Hearts rendering in classic mode
  const hearts = Array.from({ length: session.maxMistakes }).map((_, i) =>
    i < session.mistakes ? '🤍' : '❤️'
  );

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
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontSize: '19px',
              letterSpacing: '2px',
            }}
          >
            {hearts.join(' ')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '19px', lineHeight: 1 }}>⭐</span> {progress.totalScore}{' '}
            {session.partialScore > 0 && (
              <span style={{ color: '#E07A5F' }}>
                (+{session.partialScore + session.levelBonus})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Board */}
      <Board
        size={puzzle.size}
        regions={puzzle.regions}
        board={session.board}
        lockedCats={session.lockedCats}
        errorCrosses={session.errorCrosses}
        conflictingKeys={session.conflictingKeys}
        lastPlacedCat={session.lastPlacedCat}
        lastErrorCell={session.lastErrorCell}
        isVictory={session.status === 'won'}
        catVariant={settings.catVariant}
        regionAssist={settings.regionAssist}
        doubleTapTimeoutMs={settings.doubleTapTimeoutMs}
        onCellTap={handleCellTap}
        onDragCross={handleDragCross}
      />

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

      {/* Victory Modal */}
      {session.status === 'won' && (
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
              border: '4px solid #E2D6C1',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ width: '72px', height: '72px', margin: '0 auto 10px' }}>
              <CatSvg variant={settings.catVariant} state="victory" />
            </div>
            {isLastLevel ? (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: '#3D3135' }}>
                  ¡Juego completado!
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: '15.5px', color: '#7A686E' }}>
                  ¡Has superado los {totalLevels} niveles!
                  <br />
                  Puntos gatos: +{session.partialScore}
                  <br />
                  Bono por fallos: +{session.levelBonus}
                  <br />
                  <strong>Puntuación final: {progress.totalScore + session.partialScore + session.levelBonus} pts</strong>
                </p>
                <button
                  onClick={onAdvanceLevel}
                  style={{
                    width: '100%',
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
                  Volver al Menú Principal
                </button>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: '#3D3135' }}>
                  ¡Nivel {puzzle.id} superado!
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: '15.5px', color: '#7A686E' }}>
                  Puntos gatos: +{session.partialScore}
                  <br />
                  Bono por fallos: +{session.levelBonus}
                  <br />
                  <strong>Nuevo total: {progress.totalScore + session.partialScore + session.levelBonus} pts</strong>
                </p>
                <button
                  onClick={onAdvanceLevel}
                  style={{
                    width: '100%',
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
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ width: '72px', height: '72px', margin: '0 auto 10px' }}>
              <CatSvg variant={settings.catVariant} state="conflict" />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: '#EF4444' }}>
              3 fallos alcanzados
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '15.5px', color: '#7A686E' }}>
              Se han perdido los puntos parciales de este intento. Puedes reintentar el nivel manteniendo tu puntuación anterior.
            </p>
            <button
              onClick={onRetryLevel}
              style={{
                width: '100%',
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
      )}
    </div>
  );
}
