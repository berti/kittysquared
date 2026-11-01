import { CatVariant } from '../types/puzzle';
import { ModeProgress } from '../state/storage';
import { CatSvg } from './CatSvg';

export interface HomeScreenProps {
  progress: ModeProgress;
  catVariant: CatVariant;
  onPlay: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
}

export function HomeScreen({
  progress,
  catVariant,
  onPlay,
  onOpenTutorial,
  onOpenSettings,
}: HomeScreenProps) {
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
        <p style={{ margin: 0, fontSize: '14px', color: '#8C7A80' }}>300 puzzles de lógica felina</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '32px 0' }}>
        <div
          data-testid="start-game-btn"
          onClick={onPlay}
          style={{
            background: '#FFFFFF',
            border: '2px solid #E6DEC8',
            boxShadow: '0 4px 0 #E6DEC8',
            borderRadius: '18px',
            padding: '18px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'transform 0.1s ease',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#3D3135', marginBottom: '4px' }}>
              🎮 Jugar
            </div>
            <div style={{ fontSize: '13.5px', color: '#7A686E' }}>
              Nivel {progress.currentLevelId} / 300 • ⭐ {progress.totalScore} pts
            </div>
          </div>
          <div
            style={{
              background: '#FF9770',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '12px',
              boxShadow: '0 3px 0 #D9724C',
            }}
          >
            Jugar ▶
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          data-testid="open-tutorial-btn"
          onClick={onOpenTutorial}
          style={{
            flex: 1,
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            boxShadow: '0 3px 0 #E2D6C1',
            borderRadius: '14px',
            padding: '12px 10px',
            fontSize: '14px',
            fontWeight: 800,
            color: '#5C4B51',
            cursor: 'pointer',
          }}
        >
          📖 Tutorial
        </button>
        <button
          data-testid="open-settings-btn"
          onClick={onOpenSettings}
          style={{
            flex: 1,
            background: '#F3E9D2',
            border: '2px solid #E2D6C1',
            boxShadow: '0 3px 0 #E2D6C1',
            borderRadius: '14px',
            padding: '12px 10px',
            fontSize: '14px',
            fontWeight: 800,
            color: '#5C4B51',
            cursor: 'pointer',
          }}
        >
          ⚙️ Ajustes
        </button>
      </div>
    </div>
  );
}
