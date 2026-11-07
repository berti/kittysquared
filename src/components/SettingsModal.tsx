import { useEffect, useRef, useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import {
  AppSettings,
  CAT_BREEDS,
  isCatBreedUnlocked,
  MusicTrackOption,
  VALID_STEPPED_VOLUMES,
} from '../state/storage';
import { AutoCrossMode, CatVariant, RegionAssistMode } from '../types/puzzle';
import { REGION_GLYPHS, RegionGlyphIcon } from './Board';
import { CatSvg } from './CatSvg';
import {
  AssistsTabIcon,
  ControlsTabIcon,
  GearIcon,
  GraphicsTabIcon,
  SoundTabIcon,
  TapFingerIcon,
} from './Icons';

export type SettingsTab = 'controls' | 'graphics' | 'sound' | 'ayudas';

export interface SettingsModalProps {
  settings: AppSettings;
  totalStars?: number;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  totalStars = 0,
  onUpdateSettings,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('controls');

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
    const nextMuted = !settings.musicMuted;
    const nextVol = !nextMuted && settings.musicVolume === 0 ? 0.75 : settings.musicVolume;
    onUpdateSettings({ ...settings, musicMuted: nextMuted, musicVolume: nextVol });
  };

  const toggleSfx = () => {
    const nextMuted = !settings.sfxMuted;
    const nextVol = !nextMuted && settings.sfxVolume === 0 ? 0.75 : settings.sfxVolume;
    onUpdateSettings({ ...settings, sfxMuted: nextMuted, sfxVolume: nextVol });
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
            <h2
              style={{
                margin: 0,
                fontSize: '21px',
                fontWeight: 900,
                color: '#3D3135',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <GearIcon size={22} />
              <span>Ajustes</span>
            </h2>
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
                fontSize: '14px',
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
              { id: 'controls', icon: <ControlsTabIcon size={18} />, label: 'Controles' },
              { id: 'graphics', icon: <GraphicsTabIcon size={18} />, label: 'Gráficos' },
              { id: 'sound', icon: <SoundTabIcon size={18} />, label: 'Sonido' },
              { id: 'ayudas', icon: <AssistsTabIcon size={18} />, label: 'Ayudas' },
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
                    padding: '9px 2px',
                    borderRadius: '12px',
                    border: 'none',
                    background: active ? '#FFFFFF' : 'transparent',
                    color: active ? '#3D3135' : '#7A686E',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{tab.icon}</span>
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
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    VELOCIDAD DE DOBLE TOQUE
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#F3722C' }}>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#7A686E' }}>
                  <span>Rápido</span>
                  <span>Medio</span>
                  <span>Lento</span>
                </div>

                {/* Interactive tap tester */}
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
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
                      padding: '14px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '26px',
                        lineHeight: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '34px',
                      }}
                    >
                      {testerFeedback.status === 'double' ? (
                        <div style={{ width: '34px', height: '34px' }}>
                          <CatSvg variant={settings.catVariant} state="idle" />
                        </div>
                      ) : testerFeedback.status === 'single' ? (
                        '✕'
                      ) : (
                        <TapFingerIcon size={28} />
                      )}
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#3D3135', marginTop: '4px' }}>
                      {testerFeedback.status === 'double'
                        ? `¡Doble toque detectado! (${testerFeedback.interval}ms)`
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
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    DISEÑO DE GATITO
                  </span>
                  <span
                    data-testid="settings-total-stars"
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#92400E',
                      background: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="#D97706"
                      stroke="#B45309"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2.4l2.85 5.78 6.38.93-4.61 4.5 1.09 6.35L12 17l-5.71 2.96 1.09-6.35-4.61-4.5 6.38-.93L12 2.4z" />
                    </svg>
                    <span>{totalStars}★</span>
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                  }}
                >
                  {CAT_BREEDS.map((breed) => {
                    const isUnlocked = isCatBreedUnlocked(breed.id, totalStars);
                    const isSelected = settings.catVariant === breed.id;

                    return (
                      <button
                        key={breed.id}
                        type="button"
                        data-testid={`select-cat-${breed.id}`}
                        data-locked={isUnlocked ? 'false' : 'true'}
                        aria-disabled={!isUnlocked}
                        onClick={() => {
                          if (isUnlocked) {
                            setVariant(breed.id);
                          }
                        }}
                        style={{
                          height: '66px',
                          boxSizing: 'border-box',
                          background: isSelected
                            ? '#FFF'
                            : isUnlocked
                            ? '#EFE6D5'
                            : '#E8DFCE',
                          border: '2px solid',
                          borderColor: isSelected
                            ? '#6366F1'
                            : isUnlocked
                            ? '#E2D6C1'
                            : '#D6C9B1',
                          boxShadow: isSelected ? '0 0 0 1px #6366F1' : 'none',
                          borderRadius: '12px',
                          padding: '4px 2px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isUnlocked ? 1 : 0.72,
                        }}
                      >
                        <div style={{ width: '28px', height: '28px', marginBottom: '2px' }}>
                          <CatSvg variant={breed.id} state="idle" />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#3D3135',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {breed.name}
                        </span>
                        {!isUnlocked && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: '#92400E',
                              background: '#FEF3C7',
                              borderRadius: '4px',
                              padding: '1px 3px',
                              lineHeight: 1,
                              marginTop: '1px',
                            }}
                          >
                            {breed.requiredStars}★
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Region Assist */}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51', marginBottom: '8px' }}>
                  AYUDA VISUAL DE REGIONES (ACCESIBILIDAD)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'off', label: 'Desactivado' },
                    { id: 'textures', label: 'Rayas' },
                    { id: 'glyphs', label: 'Iconos' },
                    { id: 'numbers', label: 'Números 1-9' },
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
                          padding: '8px 10px',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: active ? '#6366F1' : '#E2D6C1',
                          boxShadow: active ? '0 0 0 1px #6366F1' : 'none',
                          background: active ? '#FFF' : '#EFE6D5',
                          color: '#3D3135',
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 800, lineHeight: 1.2 }}>{item.label}</span>
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
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#5C4B51', marginBottom: '6px' }}>
                  VISTA PREVIA DEL TABLERO
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 32px)',
                    gridTemplateRows: 'repeat(3, 32px)',
                    gap: '3px',
                    margin: '0 auto',
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
                          <span
                            className="region-glyph-badge"
                            data-glyph={REGION_GLYPHS[cell.reg]}
                            style={{ position: 'absolute', top: '1px', left: '2px' }}
                          >
                            <RegionGlyphIcon regionId={cell.reg} size={10} />
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
              </div>
            </div>
          )}

          {/* TAB 3: SOUND */}
          {activeTab === 'sound' && (
            <div
              data-testid="pane-sound"
              role="tabpanel"
              aria-labelledby="tab-btn-sound"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
            >
              <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                AUDIO Y MÚSICA
              </div>

              {/* Music Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#5C4B51' }}>
                    Volumen de Música
                  </span>
                  <button
                    type="button"
                    data-testid="toggle-music-btn"
                    onClick={toggleMusic}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: settings.musicMuted ? '#DC2626' : '#2A9D8F',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    {settings.musicMuted ? 'Silenciada' : 'Activa'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {VALID_STEPPED_VOLUMES.map((step) => {
                    const isSelected = settings.musicMuted ? step === 0 : settings.musicVolume === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        data-testid={`music-vol-step-${step}`}
                        onClick={() => {
                          if (step === 0) {
                            onUpdateSettings({ ...settings, musicVolume: 0, musicMuted: true });
                          } else {
                            onUpdateSettings({ ...settings, musicVolume: step, musicMuted: false });
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 2px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: isSelected ? '2px solid #E76F51' : '2px solid #E2D6C1',
                          background: isSelected ? '#FCE8E2' : '#FFF',
                          color: isSelected ? '#E76F51' : '#5C4B51',
                          cursor: 'pointer',
                        }}
                      >
                        {step === 0 ? '0%' : `${Math.round(step * 100)}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SFX Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#5C4B51' }}>
                    Volumen de Efectos
                  </span>
                  <button
                    type="button"
                    data-testid="toggle-sfx-btn"
                    onClick={toggleSfx}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: settings.sfxMuted ? '#DC2626' : '#2A9D8F',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    {settings.sfxMuted ? 'Silenciados' : 'Activos'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {VALID_STEPPED_VOLUMES.map((step) => {
                    const isSelected = settings.sfxMuted ? step === 0 : settings.sfxVolume === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        data-testid={`sfx-vol-step-${step}`}
                        onClick={() => {
                          if (step === 0) {
                            onUpdateSettings({ ...settings, sfxVolume: 0, sfxMuted: true });
                          } else {
                            onUpdateSettings({ ...settings, sfxVolume: step, sfxMuted: false });
                            soundEngine.playCross();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 2px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: isSelected ? '2px solid #2A9D8F' : '2px solid #E2D6C1',
                          background: isSelected ? '#E6F4F1' : '#FFF',
                          color: isSelected ? '#2A9D8F' : '#5C4B51',
                          cursor: 'pointer',
                        }}
                      >
                        {step === 0 ? '0%' : `${Math.round(step * 100)}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Soundtrack Selector Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#5C4B51' }}>
                  Banda Sonora
                </div>
                {(() => {
                  const isAutoSelected = (settings.musicTrack || 'auto') === 'auto';
                  return (
                    <button
                      type="button"
                      data-testid="track-opt-auto"
                      onClick={() => onUpdateSettings({ ...settings, musicTrack: 'auto' })}
                      style={{
                        width: '100%',
                        padding: '8px 8px',
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        border: isAutoSelected ? '2px solid #E76F51' : '2px solid #E2D6C1',
                        background: isAutoSelected ? '#FCE8E2' : '#FFF',
                        color: isAutoSelected ? '#E76F51' : '#5C4B51',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Auto (6 temas)
                    </button>
                  );
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {([
                    { id: 'marimba', label: 'Marimba Michi' },
                    { id: 'velvet', label: 'Velvet Paws' },
                    { id: 'sunbeam', label: 'Sunbeam Stroll' },
                    { id: 'bossa', label: 'Bossa Meow' },
                    { id: 'waltz', label: 'Catnip Waltz' },
                    { id: 'samba', label: 'Samba de Gatinho' },
                  ] satisfies { id: MusicTrackOption; label: string }[]).map((track) => {
                    const isSelected = (settings.musicTrack || 'auto') === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        data-testid={`track-opt-${track.id}`}
                        onClick={() => onUpdateSettings({ ...settings, musicTrack: track.id })}
                        style={{
                          padding: '8px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          border: isSelected ? '2px solid #E76F51' : '2px solid #E2D6C1',
                          background: isSelected ? '#FCE8E2' : '#FFF',
                          color: isSelected ? '#E76F51' : '#5C4B51',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {track.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AYUDAS */}
          {activeTab === 'ayudas' && (
            <div
              data-testid="pane-ayudas"
              role="tabpanel"
              aria-labelledby="tab-btn-ayudas"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51', marginBottom: '8px' }}>
                  COLOCAR CRUCES AUTOMÁTICAMENTE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'off', label: 'No', desc: 'Colocar todas las cruces de forma manual' },
                    {
                      id: 'row_col_surround',
                      label: 'Fila, columna y alrededor',
                      desc: 'Cruces en la fila, columna y casillas adyacentes al colocar un gato',
                    },
                    {
                      id: 'all',
                      label: 'Fila, columna, alrededor y color',
                      desc: 'Cruces en fila, columna, adyacentes y toda la región de color',
                    },
                  ].map((opt) => {
                    const active = (settings.autoCross || 'off') === opt.id;
                    const testId = opt.id === 'off' ? 'select-autocross-off' : opt.id === 'row_col_surround' ? 'select-autocross-row-col-surround' : 'select-autocross-all';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        data-testid={testId}
                        onClick={() =>
                          onUpdateSettings({ ...settings, autoCross: opt.id as AutoCrossMode })
                        }
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: '2px solid',
                          borderColor: active ? '#6366F1' : '#E2D6C1',
                          boxShadow: active ? '0 0 0 1px #6366F1' : 'none',
                          background: active ? '#FFF' : '#EFE6D5',
                          color: '#3D3135',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '14.5px', fontWeight: 800 }}>{opt.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A686E' }}>
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
