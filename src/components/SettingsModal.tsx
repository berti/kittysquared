import { useEffect, useRef, useState } from 'preact/hooks';
import { soundEngine } from '../audio/soundEngine';
import { getLocalizedBreedName, useI18n } from '../i18n';
import {
  ALL_CONCRETE_TRACKS,
  AppSettings,
  CAT_BREEDS,
  ConcreteTrackId,
  isCatBreedUnlocked,
  SteppedVolume,
} from '../state/storage';
import { AutoCrossMode, CatVariant, Language, RegionAssistMode } from '../types/puzzle';
import { REGION_GLYPHS, RegionGlyphIcon } from './Board';
import { CatSvg } from './CatSvg';
import {
  AssistsTabIcon,
  CatTabIcon,
  ControlsTabIcon,
  GearIcon,
  GraphicsTabIcon,
  SoundTabIcon,
} from './Icons';

export type SettingsTab = 'controls' | 'cats' | 'graphics' | 'sound' | 'ayudas';

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
  const { t, lang } = useI18n();
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

  const handleMusicSliderChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawVal = parseFloat(target.value);
    const stepVal = (Math.round(rawVal * 4) / 4) as SteppedVolume;
    if (stepVal === 0) {
      onUpdateSettings({ ...settings, musicVolume: 0, musicMuted: true });
    } else {
      onUpdateSettings({ ...settings, musicVolume: stepVal, musicMuted: false });
    }
  };

  const handleSfxSliderChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawVal = parseFloat(target.value);
    const stepVal = (Math.round(rawVal * 4) / 4) as SteppedVolume;
    if (stepVal === 0) {
      onUpdateSettings({ ...settings, sfxVolume: 0, sfxMuted: true });
    } else {
      onUpdateSettings({ ...settings, sfxVolume: stepVal, sfxMuted: false });
      soundEngine.playCross();
    }
  };

  const selectedTracks = settings.selectedTracks || ALL_CONCRETE_TRACKS;
  const isAllTracksSelected = selectedTracks.length === ALL_CONCRETE_TRACKS.length;

  const handleToggleAllTracks = () => {
    if (isAllTracksSelected) {
      onUpdateSettings({ ...settings, selectedTracks: ['marimba'] });
    } else {
      onUpdateSettings({ ...settings, selectedTracks: [...ALL_CONCRETE_TRACKS] });
    }
  };

  const handleToggleTrack = (trackId: ConcreteTrackId) => {
    const isChecked = selectedTracks.includes(trackId);
    if (isChecked) {
      if (selectedTracks.length <= 1) {
        // Guard: At least 1 track must remain checked at all times
        return;
      }
      const next = selectedTracks.filter((id) => id !== trackId);
      onUpdateSettings({ ...settings, selectedTracks: next });
    } else {
      const next = [...selectedTracks, trackId];
      onUpdateSettings({ ...settings, selectedTracks: next });
    }
  };

  const currentTimeout = settings.doubleTapTimeoutMs || 500;
  let speedCategory = t('settings.controls.speedNormal');
  if (currentTimeout <= 350) speedCategory = t('settings.controls.speedFast');
  else if (currentTimeout >= 650) speedCategory = t('settings.controls.speedSlow');

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
      }, 1200);
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
              <span>{t('settings.title')}</span>
            </h2>
            <button
              data-testid="close-settings-btn"
              aria-label={t('common.close')}
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
              { id: 'controls', icon: <ControlsTabIcon size={18} />, label: t('settings.tabs.controls') },
              { id: 'cats', icon: <CatTabIcon size={18} />, label: t('settings.tabs.cats') },
              { id: 'graphics', icon: <GraphicsTabIcon size={18} />, label: t('settings.tabs.graphics') },
              { id: 'sound', icon: <SoundTabIcon size={18} />, label: t('settings.tabs.audio') },
              { id: 'ayudas', icon: <AssistsTabIcon size={18} />, label: t('settings.tabs.assists') },
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
              {/* Language Selector Card */}
              <div
                style={{
                  background: '#F8F3E8',
                  border: '2px solid #E2D6C1',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    {t('settings.language.sectionTitle')}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#7A686E' }}>
                    {t('settings.language.subtitle')}
                  </span>
                </div>
                <div
                  data-testid="language-select"
                  style={{ display: 'flex', gap: '6px' }}
                >
                  {[
                    { id: 'auto', label: t('settings.language.auto'), testId: 'lang-opt-auto' },
                    { id: 'es', label: t('settings.language.spanish'), testId: 'lang-opt-es' },
                    { id: 'en', label: t('settings.language.english'), testId: 'lang-opt-en' },
                  ].map((opt) => {
                    const isSelected = (settings.language || 'auto') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={opt.testId}
                        aria-pressed={isSelected}
                        onClick={() =>
                          onUpdateSettings({ ...settings, language: opt.id as Language })
                        }
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #6366F1' : '2px solid #E2D6C1',
                          background: isSelected ? '#FFF' : '#EFE6D5',
                          color: isSelected ? '#3D3135' : '#5C4B51',
                          boxShadow: isSelected ? '0 0 0 1px #6366F1' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Double-tap Speed Section */}
              <div
                data-testid="double-tap-speed-section"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    {t('settings.controls.doubleTapSection')}
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
                  <span>{t('settings.controls.speedFast')}</span>
                  <span>{t('settings.controls.speedNormal')}</span>
                  <span>{t('settings.controls.speedSlow')}</span>
                </div>

                {/* Interactive tap tester */}
                <div
                  data-testid="double-tap-tester"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '6px',
                    gap: '6px',
                  }}
                >
                  <div
                    data-testid="double-tap-cell-tester"
                    onClick={handleTesterClick}
                    role="button"
                    tabIndex={0}
                    aria-label={t('settings.controls.testTapPrompt')}
                    style={{
                      width: '52px',
                      height: '52px',
                      background: '#FFE3D8',
                      border: '2px solid #E2D6C1',
                      borderRadius: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {testerFeedback.status === 'double' ? (
                      <div style={{ width: '34px', height: '34px' }}>
                        <CatSvg variant={settings.catVariant} state="idle" />
                      </div>
                    ) : testerFeedback.status === 'single' ? (
                      <span
                        data-testid="double-tap-cross"
                        style={{
                          fontSize: '26px',
                          fontWeight: 900,
                          color: '#3D3135',
                          opacity: 0.45,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </span>
                    ) : null}
                  </div>
                  <div
                    data-testid="double-tap-tester-feedback"
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#3D3135',
                      textAlign: 'center',
                    }}
                  >
                    {testerFeedback.status === 'double'
                      ? `${t('settings.controls.doubleTapDetected')} (${testerFeedback.interval}ms)`
                      : testerFeedback.status === 'single'
                      ? t('settings.controls.singleTapPrompt')
                      : t('settings.controls.testTapPrompt')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATS */}
          {activeTab === 'cats' && (
            <div
              data-testid="pane-cats"
              role="tabpanel"
              aria-labelledby="tab-btn-cats"
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
                    {t('settings.graphics.sectionTitle')}
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
                    const breedName = getLocalizedBreedName(breed.id, lang);
                    const starsReq = t('settings.graphics.starsRequired', { stars: breed.requiredStars });

                    return (
                      <button
                        key={breed.id}
                        type="button"
                        data-testid={`select-cat-${breed.id}`}
                        data-locked={isUnlocked ? 'false' : 'true'}
                        aria-disabled={!isUnlocked}
                        title={breedName}
                        aria-label={
                          isUnlocked
                            ? breedName
                            : `${breedName} (${starsReq})`
                        }
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
                          {breedName}
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
            </div>
          )}

          {/* TAB 3: GRAPHICS */}
          {activeTab === 'graphics' && (
            <div
              data-testid="pane-graphics"
              role="tabpanel"
              aria-labelledby="tab-btn-graphics"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}
            >
              {/* Region Assist */}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51', marginBottom: '8px' }}>
                  {t('settings.assists.regionSection')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'off', label: t('settings.assists.regionOptions.off.label') },
                    { id: 'textures', label: t('settings.assists.regionOptions.textures.label') },
                    { id: 'glyphs', label: t('settings.assists.regionOptions.glyphs.label') },
                    { id: 'numbers', label: t('settings.assists.regionOptions.numbers.label') },
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

          {/* TAB 4: SOUND */}
          {activeTab === 'sound' && (
            <div
              data-testid="pane-sound"
              role="tabpanel"
              aria-labelledby="tab-btn-sound"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
            >
              {/* Music Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    {t('settings.audio.musicVolume').toUpperCase()}
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
                <input
                  type="range"
                  data-testid="music-vol-slider"
                  min="0"
                  max="1"
                  step="0.25"
                  value={settings.musicMuted ? 0 : settings.musicVolume}
                  onInput={handleMusicSliderChange}
                  onChange={handleMusicSliderChange}
                  style={{ width: '100%', accentColor: '#E76F51', cursor: 'pointer' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#7A686E',
                    padding: '0 2px',
                  }}
                >
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* SFX Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                    {t('settings.audio.sfxVolume').toUpperCase()}
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
                <input
                  type="range"
                  data-testid="sfx-vol-slider"
                  min="0"
                  max="1"
                  step="0.25"
                  value={settings.sfxMuted ? 0 : settings.sfxVolume}
                  onInput={handleSfxSliderChange}
                  onChange={handleSfxSliderChange}
                  style={{ width: '100%', accentColor: '#2A9D8F', cursor: 'pointer' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#7A686E',
                    padding: '0 2px',
                  }}
                >
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Soundtrack Playlist Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#5C4B51' }}>
                  {t('settings.audio.musicTrack').toUpperCase()}
                </div>

                {/* Master Checkbox: Todas las pistas / All tracks */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: isAllTracksSelected ? '2px solid #E76F51' : '2px solid #E2D6C1',
                    background: isAllTracksSelected ? '#FCE8E2' : '#FFF',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="track-opt-all"
                    checked={isAllTracksSelected}
                    onChange={handleToggleAllTracks}
                    style={{
                      accentColor: '#E76F51',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#5C4B51' }}>
                    {t('settings.audio.allTracks')}
                  </span>
                </label>

                {/* 2-column responsive grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {ALL_CONCRETE_TRACKS.map((trackId) => {
                    const isChecked = selectedTracks.includes(trackId);
                    return (
                      <label
                        key={trackId}
                        data-testid={`track-card-${trackId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '12px',
                          border: isChecked ? '2px solid #E76F51' : '2px solid #E2D6C1',
                          background: isChecked ? '#FCE8E2' : '#FFF',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          data-testid={`track-checkbox-${trackId}`}
                          checked={isChecked}
                          onChange={() => handleToggleTrack(trackId)}
                          style={{
                            accentColor: '#E76F51',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: isChecked ? '#E76F51' : '#5C4B51',
                            lineHeight: 1.2,
                          }}
                        >
                          {t(`settings.audio.tracks.${trackId}` as const)}
                        </span>
                      </label>
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
                  {t('settings.assists.autoCrossSection')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    {
                      id: 'off',
                      label: t('settings.assists.autoCrossOptions.off.label'),
                      desc: t('settings.assists.autoCrossOptions.off.desc'),
                    },
                    {
                      id: 'all',
                      label: t('settings.assists.autoCrossOptions.all.label'),
                      desc: t('settings.assists.autoCrossOptions.all.desc'),
                    },
                  ].map((opt) => {
                    const active = (settings.autoCross || 'off') === opt.id;
                    const testId = opt.id === 'off' ? 'select-autocross-off' : 'select-autocross-all';
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
