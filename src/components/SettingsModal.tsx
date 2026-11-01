import { useEffect, useRef, useState } from 'preact/hooks';
import { AppSettings } from '../state/storage';
import { CatVariant, RegionAssistMode } from '../types/puzzle';
import { REGION_GLYPHS } from './Board';
import { CatSvg } from './CatSvg';
import { ConfirmDialog } from './ConfirmDialog';

export type SettingsTab = 'controls' | 'graphics' | 'sound' | 'reset';

export interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('controls');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Tap tester state
  const [lastTesterTapTime, setLastTesterTapTime] = useState(0);
  const [testerFeedback, setTesterFeedback] = useState<{
    status: 'idle' | 'single' | 'double';
    interval?: number;
  }>({ status: 'idle' });
  const testerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (testerTimerRef.current) {
        clearTimeout(testerTimerRef.current);
      }
    };
  }, []);

  const setVariant = (variant: CatVariant) => {
    onUpdateSettings({ ...settings, catVariant: variant });
  };

  const setDoubleTapTimeout = (timeoutMs: number) => {
    onUpdateSettings({ ...settings, doubleTapTimeoutMs: timeoutMs });
  };

  const toggleMusic = () => {
    onUpdateSettings({ ...settings, musicMuted: !settings.musicMuted });
  };

  const toggleSfx = () => {
    onUpdateSettings({ ...settings, sfxMuted: !settings.sfxMuted });
  };

  const currentTimeout = settings.doubleTapTimeoutMs || 500;
  let speedCategory = 'Normal';
  if (currentTimeout <= 350) speedCategory = 'Rápido';
  else if (currentTimeout >= 650) speedCategory = 'Lento';

  const handleTesterClick = () => {
    if (testerTimerRef.current) {
      clearTimeout(testerTimerRef.current);
      testerTimerRef.current = null;
    }

    const now = Date.now();
    const diff = now - lastTesterTapTime;

    if (diff > 40 && diff <= currentTimeout) {
      setTesterFeedback({ status: 'double', interval: diff });
      setLastTesterTapTime(0);
      testerTimerRef.current = setTimeout(() => {
        setTesterFeedback({ status: 'idle' });
      }, 1500);
    } else {
      setLastTesterTapTime(now);
      setTesterFeedback({ status: 'single' });
      testerTimerRef.current = setTimeout(() => {
        setTesterFeedback((prev) => (prev.status === 'single' ? { status: 'idle' } : prev));
      }, currentTimeout);
    }
  };

  return (
    <>
      <div
        data-testid="settings-modal-backdrop"
        class="modal-backdrop-anim"
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
          data-testid="settings-modal-card"
          class="modal-card-flyin"
          style={{
            backgroundColor: '#FFFBF2',
            border: '4px solid #E2D6C1',
            borderRadius: '24px',
            padding: '18px 20px',
            maxWidth: '460px',
            width: '100%',
            height: 'min(540px, 90vh)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
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

          {/* Tab Navigation */}
          <div
            role="tablist"
            style={{
              display: 'flex',
              background: '#EFE6D5',
              padding: '4px',
              borderRadius: '16px',
              gap: '4px',
            }}
          >
            {[
              { id: 'controls', icon: '🎮', label: 'Controles' },
              { id: 'graphics', icon: '🎨', label: 'Gráficos' },
              { id: 'sound', icon: '🔊', label: 'Sonido' },
              { id: 'reset', icon: '🔄', label: 'Reiniciar' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={tab.label}
                  data-testid={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '8px 2px',
                    borderRadius: '12px',
                    border: 'none',
                    background: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#3D3135' : '#7A686E',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{tab.icon}</span>
                  <span className="settings-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: CONTROLS */}
          {activeTab === 'controls' && (
            <div
              data-testid="pane-controls"
              role="tabpanel"
              aria-labelledby="tab-btn-controls"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
            >
              <div
                style={{
                  background: '#F8F3E8',
                  border: '2px solid #E2D6C1',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#7A686E' }}>
                    VELOCIDAD DE DOBLE TOQUE
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#F3722C' }}>
                    {currentTimeout} ms ({speedCategory})
                  </span>
                </div>

                <input
                  type="range"
                  data-testid="speed-slider"
                  min="250"
                  max="900"
                  step="25"
                  value={currentTimeout}
                  onInput={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value, 10);
                    setDoubleTapTimeout(val);
                  }}
                  style={{ width: '100%', accentColor: '#F3722C', cursor: 'pointer' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#8C7A80' }}>
                  <span>Rápido (250ms)</span>
                  <span>Medio (500ms)</span>
                  <span>Lento (900ms)</span>
                </div>

                {/* Interactive tap tester */}
                <div style={{ textAlign: 'center', marginTop: '2px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A686E', marginBottom: '6px' }}>
                    ÁREA DE PRUEBA
                  </div>
                  <div
                    data-testid="double-tap-tester"
                    onClick={handleTesterClick}
                    style={{
                      background:
                        testerFeedback.status === 'double'
                          ? '#E8FBF8'
                          : testerFeedback.status === 'single'
                          ? '#FFF5F0'
                          : '#FFFFFF',
                      border:
                        testerFeedback.status === 'double'
                          ? '2px solid #2EC4B6'
                          : testerFeedback.status === 'single'
                          ? '2px solid #FF9770'
                          : '2px dashed #E2D6C1',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '24px', lineHeight: 1 }}>
                      {testerFeedback.status === 'double'
                        ? settings.catVariant === 'white'
                          ? '🤍'
                          : '🐱'
                        : testerFeedback.status === 'single'
                        ? '✕'
                        : '👆'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#3D3135', marginTop: '4px' }}>
                      {testerFeedback.status === 'double'
                        ? `¡Doble toque detectado! 🐾 (${testerFeedback.interval}ms)`
                        : testerFeedback.status === 'single'
                        ? '1 toque (✕ cruz) — ¡toca de nuevo rápido!'
                        : 'Toca 2 veces aquí para probar la velocidad'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRAPHICS */}
          {activeTab === 'graphics' && (
            <div
              data-testid="pane-graphics"
              role="tabpanel"
              aria-labelledby="tab-btn-graphics"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A686E', marginBottom: '6px' }}>
                  DISEÑO DE GATITO
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    data-testid="select-cat-black"
                    onClick={() => setVariant('black')}
                    style={{
                      flex: 1,
                      height: '62px',
                      boxSizing: 'border-box',
                      background: settings.catVariant === 'black' ? '#FFF' : '#EFE6D5',
                      border: '2px solid',
                      borderColor: settings.catVariant === 'black' ? '#6366F1' : '#E2D6C1',
                      boxShadow: settings.catVariant === 'black' ? '0 0 0 1px #6366F1' : 'none',
                      borderRadius: '12px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', marginBottom: '2px' }}>
                      <CatSvg variant="black" state="idle" />
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Gato Negro</span>
                  </div>

                  <div
                    data-testid="select-cat-white"
                    onClick={() => setVariant('white')}
                    style={{
                      flex: 1,
                      height: '62px',
                      boxSizing: 'border-box',
                      background: settings.catVariant === 'white' ? '#FFF' : '#EFE6D5',
                      border: '2px solid',
                      borderColor: settings.catVariant === 'white' ? '#6366F1' : '#E2D6C1',
                      boxShadow: settings.catVariant === 'white' ? '0 0 0 1px #6366F1' : 'none',
                      borderRadius: '12px',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', marginBottom: '2px' }}>
                      <CatSvg variant="white" state="idle" />
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700 }}>Gato Blanco</span>
                  </div>
                </div>
              </div>

              {/* Region Assist */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#7A686E', marginBottom: '6px' }}>
                  AYUDA VISUAL DE REGIONES (ACCESIBILIDAD)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'off', label: 'Desactivado', desc: 'Colores puros' },
                    { id: 'textures', label: 'Rayas', desc: 'Tramas rayadas' },
                    { id: 'glyphs', label: 'Gatitos 🐾', desc: 'Iconos en esquina' },
                    { id: 'numbers', label: 'Números 1-9', desc: 'Dígitos en esquina' },
                  ].map((item) => {
                    const active = (settings.regionAssist || 'off') === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        data-testid={`select-region-assist-${item.id}`}
                        onClick={() =>
                          onUpdateSettings({ ...settings, regionAssist: item.id as RegionAssistMode })
                        }
                        style={{
                          height: '46px',
                          boxSizing: 'border-box',
                          padding: '6px 8px',
                          borderRadius: '10px',
                          border: '2px solid',
                          borderColor: active ? '#6366F1' : '#E2D6C1',
                          boxShadow: active ? '0 0 0 1px #6366F1' : 'none',
                          background: active ? '#FFF' : '#EFE6D5',
                          color: '#3D3135',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: '1px',
                        }}
                      >
                        <span style={{ fontSize: '11.5px', fontWeight: 800, lineHeight: 1.2 }}>{item.label}</span>
                        <span style={{ fontSize: '9.5px', color: '#7A686E', fontWeight: 600, lineHeight: 1.2 }}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Mini-Board Preview */}
              <div
                data-testid="mini-board-preview"
                style={{
                  background: '#F8F3E8',
                  border: '2px solid #E2D6C1',
                  borderRadius: '14px',
                  padding: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#7A686E', marginBottom: '4px' }}>
                  VISTA PREVIA DEL TABLERO
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 32px)',
                    gridTemplateRows: 'repeat(3, 32px)',
                    gap: '3px',
                    margin: '0 auto 4px',
                    padding: '4px',
                    background: '#EFE6D5',
                    borderRadius: '10px',
                    width: 'fit-content',
                  }}
                >
                  {[
                    { reg: 0, color: '#FFD166', hasCat: true },
                    { reg: 0, color: '#FFD166', hasCat: false },
                    { reg: 1, color: '#4EA8DE', hasCat: false },
                    { reg: 0, color: '#FFD166', hasCat: false },
                    { reg: 1, color: '#4EA8DE', hasCat: true },
                    { reg: 1, color: '#4EA8DE', hasCat: false },
                    { reg: 2, color: '#FF8FA3', hasCat: false },
                    { reg: 2, color: '#FF8FA3', hasCat: false },
                    { reg: 2, color: '#FF8FA3', hasCat: true },
                  ].map((cell, idx) => {
                    const assist = settings.regionAssist || 'off';
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: cell.color,
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {assist === 'textures' && (
                          <div className={`region-pattern pat-${cell.reg}`} />
                        )}
                        {assist === 'glyphs' && (
                          <span className="region-glyph-badge" style={{ position: 'absolute', top: '1px', left: '2px', fontSize: '8px' }}>
                            {REGION_GLYPHS[cell.reg]}
                          </span>
                        )}
                        {assist === 'numbers' && (
                          <span style={{ position: 'absolute', top: '1px', left: '2px', fontSize: '8px', fontWeight: 800, color: '#3D3135', zIndex: 2 }}>
                            {cell.reg + 1}
                          </span>
                        )}
                        {cell.hasCat && (
                          <div style={{ width: '22px', height: '22px', position: 'relative', zIndex: 2 }}>
                            <CatSvg variant={settings.catVariant} state="idle" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: '10px', color: '#8C7A80', fontWeight: 600 }}>
                  Muestra cómo lucen los gatos y las ayudas de región juntos
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SOUND */}
          {activeTab === 'sound' && (
            <div
              data-testid="pane-sound"
              role="tabpanel"
              aria-labelledby="tab-btn-sound"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#7A686E' }}>
                AUDIO Y MÚSICA
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  data-testid="toggle-music-btn"
                  onClick={toggleMusic}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
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
                  type="button"
                  data-testid="toggle-sfx-btn"
                  onClick={toggleSfx}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
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
          )}

          {/* TAB 4: RESET */}
          {activeTab === 'reset' && (
            <div
              data-testid="pane-reset"
              role="tabpanel"
              aria-labelledby="tab-btn-reset"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#7A686E' }}>
                REINICIAR PROGRESO DE PARTIDA
              </div>

              <button
                type="button"
                data-testid="reset-progress-btn"
                onClick={() => setShowConfirmReset(true)}
                style={{
                  background: '#FFF',
                  border: '2px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>
                    Reiniciar progreso
                  </div>
                  <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '2px' }}>
                    Volver al nivel 1 y puntuación a 0
                  </div>
                </div>
                <span style={{ fontSize: '16px' }}>⚠️</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Progress Reset */}
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
        }}
        onCancel={() => setShowConfirmReset(false)}
      />
    </>
  );
}
