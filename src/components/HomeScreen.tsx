import { useState } from 'preact/hooks';
import { CatVariant } from '../types/puzzle';
import { getTotalEarnedStars, ModeProgress } from '../state/storage';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';
import { WarningIcon } from './Icons';
import { PostGameModal } from './PostGameModal';

export interface HomeScreenProps {
  progress: ModeProgress;
  totalLevels?: number;
  catVariant: CatVariant;
  onPlay: () => void;
  onOpenLevels?: () => void;
  onReplayLastLevel?: () => void;
  onResetProgress?: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
}

export function HomeScreen({
  progress,
  totalLevels,
  catVariant,
  onPlay,
  onOpenLevels,
  onReplayLastLevel,
  onResetProgress,
  onOpenTutorial,
  onOpenSettings,
}: HomeScreenProps) {
  const [showPostGameModal, setShowPostGameModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const levelsCount = totalLevels ?? 300;
  const isGameCompleted = progress.currentLevelId > levelsCount;
  const totalEarnedStars = getTotalEarnedStars(progress);
  const maxStars = levelsCount * 3;

  const handlePlayClick = () => {
    if (isGameCompleted) {
      setShowPostGameModal(true);
    } else {
      onPlay();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '85vh',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div style={{ width: '84px', height: '84px', margin: '0 auto 12px' }}>
          <CatSvg variant={catVariant} state="idle" />
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: '30px', color: '#3D3135' }}>KittySquared</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '32px 0', width: '100%' }}>
        <button
          type="button"
          data-testid="start-game-btn"
          onClick={handlePlayClick}
          style={{
            width: '100%',
            background: '#FF9770',
            border: '2px solid #E07A5F',
            boxShadow: '0 4px 0 #D9724C',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#FFFFFF',
            transition: 'transform 0.1s ease',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '0.2px' }}>
            Jugar
          </div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#FFFBF2', opacity: 0.95 }}>
            {isGameCompleted
              ? `¡Juego completado! • ${levelsCount} / ${levelsCount} • ${progress.totalScore} pts`
              : `Nivel ${progress.currentLevelId} / ${levelsCount} • ${progress.totalScore} pts`}
          </div>
        </button>

        <button
          type="button"
          data-testid="open-levels-btn"
          onClick={() => onOpenLevels?.()}
          style={{
            width: '100%',
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            boxShadow: '0 3px 0 #E2D6C1',
            borderRadius: '14px',
            padding: '14px 18px',
            fontSize: '15.5px',
            fontWeight: 800,
            color: '#3D3135',
            cursor: 'pointer',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'inherit',
          }}
        >
          <span>Niveles</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#5C4B51',
              fontSize: '14.5px',
              fontWeight: 800,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ display: 'block' }}>
              <path
                fill="#FFB703"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinejoin="round"
                d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z"
              />
            </svg>
            <span>
              {totalEarnedStars} / {maxStars}
            </span>
          </span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            data-testid="open-tutorial-btn"
            onClick={onOpenTutorial}
            style={{
              width: '100%',
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 3px 0 #E2D6C1',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '15.5px',
              fontWeight: 800,
              color: '#5C4B51',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            Tutorial
          </button>
          <button
            data-testid="open-settings-btn"
            onClick={onOpenSettings}
            style={{
              width: '100%',
              background: '#F3E9D2',
              border: '2px solid #E2D6C1',
              boxShadow: '0 3px 0 #E2D6C1',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '15.5px',
              fontWeight: 800,
              color: '#5C4B51',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            Ajustes
          </button>
        </div>
      </div>

      <div style={{ width: '100%', marginTop: 'auto', paddingTop: '16px' }}>
        <button
          type="button"
          data-testid="home-reset-progress-btn"
          onClick={() => setShowConfirmReset(true)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1.5px solid #D8CBB6',
            borderRadius: '14px',
            padding: '12px',
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#9E8D93',
            cursor: 'pointer',
            boxSizing: 'border-box',
            transition: 'all 0.15s ease',
          }}
        >
          Reiniciar progreso
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirmReset}
        title="¿Reiniciar progreso?"
        description="Perderás el nivel alcanzado y todos los puntos acumulados volverán a 0."
        icon={<WarningIcon size={28} />}
        confirmText="Sí, reiniciar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          onResetProgress?.();
          setShowConfirmReset(false);
        }}
        onCancel={() => setShowConfirmReset(false)}
      />

      <PostGameModal
        isOpen={showPostGameModal}
        totalLevels={levelsCount}
        totalScore={progress.totalScore}
        catVariant={catVariant}
        onReplayLastLevel={() => {
          setShowPostGameModal(false);
          onReplayLastLevel?.();
        }}
        onResetProgress={() => {
          setShowPostGameModal(false);
          onResetProgress?.();
        }}
        onClose={() => setShowPostGameModal(false)}
      />
    </div>
  );
}
