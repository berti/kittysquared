import { useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import {
  applyCellTap,
  applyDragCross,
  clearCrosses,
  LevelSessionState,
  undoMove,
} from '../state/gameState';
import { AppSettings, ModeProgress } from '../state/storage';
import { PuzzleDef } from '../types/puzzle';
import { Board } from './Board';
import { CatSvg } from './CatSvg';

export interface GameScreenProps {
  puzzle: PuzzleDef;
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
  progress,
  settings,
  session,
  onUpdateSession,
  onAdvanceLevel,
  onRetryLevel,
  onBackToMenu,
  onOpenSettings,
}: GameScreenProps) {
  const [activeTool, setActiveTool] = useState<'cross' | 'cat'>('cat');

  const placedCatsCount = session.board.flat().filter((c) => c === 'cat').length;

  const handleCellTap = (r: number, c: number) => {
    const prevCell = session.board[r][c];
    const prevMistakes = session.mistakes;

    const next = applyCellTap(session, r, c, settings.controlScheme, activeTool);
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

  const handleUndo = () => {
    const next = undoMove(session);
    onUpdateSession(next);
  };

  const handleClear = () => {
    const next = clearCrosses(session);
    onUpdateSession(next);
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
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '13px',
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            ← Menú
          </button>
          <div style={{ fontWeight: 800, fontSize: '17px', color: '#3D3135' }}>
            Nivel {puzzle.id}{' '}
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#8C7A80' }}>
              ({session.mode === 'chill' ? 'Chill Out' : 'Classic'})
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            style={{
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 2px 0 #E2D6C1',
              borderRadius: '10px',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '13px',
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            ⚙️
          </button>
        </div>

        {/* Status bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F3E9D2',
            padding: '8px 16px',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: 800,
            color: '#3D3135',
            marginBottom: '16px',
          }}
        >
          <span>
            🐱 {placedCatsCount} / {puzzle.size}
          </span>
          {session.mode === 'classic' && (
            <>
              <span>{hearts.join(' ')}</span>
              <span>
                ⭐ {progress.totalScore}{' '}
                {session.partialScore > 0 && (
                  <span style={{ color: '#E07A5F' }}>
                    (+{session.partialScore + session.levelBonus})
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Board */}
      <Board
        size={puzzle.size}
        regions={puzzle.regions}
        board={session.board}
        lockedCats={session.lockedCats}
        conflictingKeys={session.conflictingKeys}
        lastPlacedCat={session.lastPlacedCat}
        lastErrorCell={session.lastErrorCell}
        isVictory={session.status === 'won'}
        catVariant={settings.catVariant}
        onCellTap={handleCellTap}
        onDragCross={handleDragCross}
      />

      {/* Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {settings.controlScheme === 'toggle' ? (
          <div
            data-testid="tool-toggle-switch"
            style={{
              display: 'flex',
              background: '#EFE6D5',
              padding: '4px',
              borderRadius: '999px',
              border: '2px solid #E2D6C1',
              width: '210px',
              margin: '0 auto',
            }}
          >
            <div
              onClick={() => setActiveTool('cross')}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '7px 10px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeTool === 'cross' ? '#FFFFFF' : 'transparent',
                color: '#3D3135',
                boxShadow: activeTool === 'cross' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ✕ Cruz
            </div>
            <div
              onClick={() => setActiveTool('cat')}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '7px 10px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeTool === 'cat' ? '#FFFFFF' : 'transparent',
                color: '#3D3135',
                boxShadow: activeTool === 'cat' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              🐱 Gato
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#8C7A80', fontWeight: 600 }}>
            1 toque: ✕ Cruz • 2 toques: 🐱 Gato
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleUndo}
            style={{
              flex: 1,
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 3px 0 #E2D6C1',
              borderRadius: '12px',
              padding: '9px 10px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 800,
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            ↩ Deshacer
          </button>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 3px 0 #E2D6C1',
              borderRadius: '12px',
              padding: '9px 10px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 800,
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            🧹 Limpiar cruces
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      {session.status === 'won' && (
        <div
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
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#3D3135' }}>
              ¡Nivel {puzzle.id} superado!
            </h2>
            {session.mode === 'classic' ? (
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#7A686E' }}>
                Puntos gatos: +{session.partialScore}
                <br />
                Bono por fallos: +{session.levelBonus}
                <br />
                <strong>Nuevo total: {progress.totalScore + session.partialScore + session.levelBonus} pts</strong>
              </p>
            ) : (
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#7A686E' }}>
                ¡Perfecto! Has resuelto el puzzle sin conflictos.
              </p>
            )}
            <button
              onClick={onAdvanceLevel}
              style={{
                width: '100%',
                background: '#FF9770',
                color: '#FFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 800,
                fontSize: '15px',
                boxShadow: '0 4px 0 #D9724C',
                cursor: 'pointer',
              }}
            >
              Siguiente Nivel ▶
            </button>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {session.status === 'lost' && (
        <div
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
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#EF4444' }}>
              3 fallos alcanzados
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#7A686E' }}>
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
                padding: '12px',
                fontWeight: 800,
                fontSize: '15px',
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
