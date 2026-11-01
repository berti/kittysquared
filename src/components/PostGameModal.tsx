import { useEffect, useState } from 'preact/hooks';
import { CatVariant } from '../types/puzzle';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';

export interface PostGameModalProps {
  isOpen: boolean;
  totalLevels: number;
  totalScore: number;
  catVariant?: CatVariant;
  onReplayLastLevel: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function PostGameModal({
  isOpen,
  totalLevels,
  totalScore,
  catVariant = 'black',
  onReplayLastLevel,
  onResetProgress,
  onClose,
}: PostGameModalProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showConfirmReset) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showConfirmReset, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        data-testid="post-game-modal-backdrop"
        class="modal-backdrop-anim"
        onClick={(e) => {
          if (e.target === e.currentTarget && !showConfirmReset) {
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(61, 49, 53, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div
          data-testid="post-game-modal-card"
          class="modal-card-flyin"
          role="dialog"
          aria-modal="true"
          aria-label="¡Juego completado!"
          style={{
            backgroundColor: '#FFFBF2',
            border: '4px solid #E2D6C1',
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '72px', height: '72px', margin: '0 auto 10px' }}>
            <CatSvg variant={catVariant} state="victory" />
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: '#3D3135' }}>
            ¡Juego completado!
          </h2>

          <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#7A686E', lineHeight: '1.4' }}>
            Has superado todos los {totalLevels} / {totalLevels} niveles con un total de{' '}
            <strong>{totalScore} pts</strong>. ¿Qué te gustaría hacer ahora?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              data-testid="replay-last-level-btn"
              onClick={() => {
                onReplayLastLevel();
                onClose();
              }}
              style={{
                width: '100%',
                background: '#FF9770',
                border: '2px solid #E07A5F',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#FFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 0 #D9724C',
              }}
            >
              <div>
                <div style={{ fontSize: '15.5px', fontWeight: 800 }}>
                  Jugar último nivel (Nivel {totalLevels})
                </div>
                <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>
                  Vuelve a jugar el último reto
                </div>
              </div>
              <span style={{ fontSize: '18px' }}>▶</span>
            </button>

            <button
              type="button"
              data-testid="postgame-reset-progress-btn"
              onClick={() => setShowConfirmReset(true)}
              style={{
                width: '100%',
                background: '#FFF',
                border: '2px solid #FCA5A5',
                borderRadius: '16px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>
                  Reiniciar progreso desde cero
                </div>
                <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '2px' }}>
                  Volver al nivel 1 y puntuación a 0
                </div>
              </div>
              <span style={{ fontSize: '18px' }}>⚠️</span>
            </button>

            <button
              type="button"
              data-testid="close-postgame-modal-btn"
              onClick={onClose}
              style={{
                width: '100%',
                background: '#F3E9D2',
                border: '2px solid #E2D6C1',
                boxShadow: '0 3px 0 #E2D6C1',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 800,
                color: '#5C4B51',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmReset}
        title="¿Reiniciar progreso?"
        description="Perderás el nivel alcanzado y todos los puntos acumulados volverán a 0."
        icon="⚠️"
        confirmText="Sí, reiniciar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          onResetProgress();
          setShowConfirmReset(false);
          onClose();
        }}
        onCancel={() => setShowConfirmReset(false)}
      />
    </>
  );
}
