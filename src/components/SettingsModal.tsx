import { AppSettings } from '../state/storage';
import { CatVariant, ControlScheme, GameMode, RegionAssistMode } from '../types/puzzle';
import { CatSvg } from './CatSvg';

export interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetMode: (mode: GameMode) => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  onResetMode,
  onClose,
}: SettingsModalProps) {
  const setControl = (scheme: ControlScheme) => {
    onUpdateSettings({ ...settings, controlScheme: scheme });
  };

  const setVariant = (variant: CatVariant) => {
    onUpdateSettings({ ...settings, catVariant: variant });
  };

  const toggleMusic = () => {
    onUpdateSettings({ ...settings, musicMuted: !settings.musicMuted });
  };

  const toggleSfx = () => {
    onUpdateSettings({ ...settings, sfxMuted: !settings.sfxMuted });
  };

  return (
    <div
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
        style={{
          backgroundColor: '#FFFBF2',
          border: '4px solid #E2D6C1',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#3D3135' }}>⚙️ Ajustes</h2>
          <button
            data-testid="close-settings-btn"
            onClick={onClose}
            style={{
              background: '#EFE6D5',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Control scheme */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
            ESQUEMA DE CONTROL
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid="select-control-toggle"
              onClick={() => setControl('toggle')}
              style={{
                flex: 1,
                padding: '9px 6px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: '2px solid #E2D6C1',
                background: settings.controlScheme === 'toggle' ? '#FF9770' : '#FFF',
                color: settings.controlScheme === 'toggle' ? '#FFF' : '#3D3135',
                cursor: 'pointer',
              }}
            >
              Botón doble
            </button>
            <button
              data-testid="select-control-double-tap"
              onClick={() => setControl('double-tap')}
              style={{
                flex: 1,
                padding: '9px 6px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                border: '2px solid #E2D6C1',
                background: settings.controlScheme === 'double-tap' ? '#FF9770' : '#FFF',
                color: settings.controlScheme === 'double-tap' ? '#FFF' : '#3D3135',
                cursor: 'pointer',
              }}
            >
              1 clic ✕ / 2 clics 🐱
            </button>
          </div>
        </div>

        {/* Cat variant */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
            DISEÑO DE GATITO
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              data-testid="select-cat-black"
              onClick={() => setVariant('black')}
              style={{
                flex: 1,
                background: settings.catVariant === 'black' ? '#FFF' : '#EFE6D5',
                border: settings.catVariant === 'black' ? '3px solid #6366F1' : '2px solid #E2D6C1',
                borderRadius: '14px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '48px', height: '48px', marginBottom: '4px' }}>
                <CatSvg variant="black" state="idle" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Gato Negro</span>
            </div>

            <div
              data-testid="select-cat-white"
              onClick={() => setVariant('white')}
              style={{
                flex: 1,
                background: settings.catVariant === 'white' ? '#FFF' : '#EFE6D5',
                border: settings.catVariant === 'white' ? '3px solid #6366F1' : '2px solid #E2D6C1',
                borderRadius: '14px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: '48px', height: '48px', marginBottom: '4px' }}>
                <CatSvg variant="white" state="idle" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Gato Blanco</span>
            </div>
          </div>
        </div>

        {/* Region Assist (Accessibility) */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
            AYUDA VISUAL DE REGIONES (ACCESIBILIDAD)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'off', label: 'Desactivado', desc: 'Colores puros' },
              { id: 'textures', label: 'Texturas', desc: 'Rayas y tramas' },
              { id: 'glyphs', label: 'Gatitos 🐾', desc: 'Iconos en esquina' },
              { id: 'numbers', label: 'Números 1-9', desc: 'Dígitos en esquina' },
            ].map((item) => {
              const active = (settings.regionAssist || 'off') === item.id;
              return (
                <button
                  key={item.id}
                  data-testid={`select-region-assist-${item.id}`}
                  onClick={() =>
                    onUpdateSettings({ ...settings, regionAssist: item.id as RegionAssistMode })
                  }
                  style={{
                    padding: '9px 8px',
                    borderRadius: '12px',
                    border: active ? '3px solid #6366F1' : '2px solid #E2D6C1',
                    background: active ? '#FFF' : '#EFE6D5',
                    color: '#3D3135',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>{item.label}</span>
                  <span style={{ fontSize: '10.5px', color: '#7A686E', fontWeight: 600 }}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio toggles */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
            SONIDO Y MÚSICA
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={toggleMusic}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                border: '2px solid #E2D6C1',
                background: settings.musicMuted ? '#EFE6D5' : '#FFF',
                cursor: 'pointer',
              }}
            >
              {settings.musicMuted ? '🔇 Música: Off' : '🎵 Música: On'}
            </button>
            <button
              onClick={toggleSfx}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                border: '2px solid #E2D6C1',
                background: settings.sfxMuted ? '#EFE6D5' : '#FFF',
                cursor: 'pointer',
              }}
            >
              {settings.sfxMuted ? '🔇 Efectos: Off' : '🔊 Efectos: On'}
            </button>
          </div>
        </div>

        {/* Reset Progress */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
            REINICIAR PARTIDA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar todo el progreso de Chill Out?')) {
                  onResetMode('chill');
                }
              }}
              style={{
                background: 'transparent',
                border: '1px solid #E2D6C1',
                borderRadius: '10px',
                padding: '7px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#7A686E',
                cursor: 'pointer',
              }}
            >
              Reiniciar Chill Out (al nivel 1)
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar todo el progreso y puntos de Classic a 0?')) {
                  onResetMode('classic');
                }
              }}
              style={{
                background: 'transparent',
                border: '1px solid #E2D6C1',
                borderRadius: '10px',
                padding: '7px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#EF4444',
                cursor: 'pointer',
              }}
            >
              Reiniciar Classic (al nivel 1 y 0 pts)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
