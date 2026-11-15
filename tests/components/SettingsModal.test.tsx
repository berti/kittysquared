// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../src/components/SettingsModal';
import { soundEngine } from '../../src/audio/soundEngine';
import { ALL_CONCRETE_TRACKS, AppSettings } from '../../src/state/storage';
import { I18nProvider } from '../../src/i18n';

const defaultSettings: AppSettings = {
  language: 'auto',
  doubleTapTimeoutMs: 500,
  catVariant: 'black',
  regionAssist: 'off',
  autoCross: 'off',
  musicMuted: false,
  sfxMuted: false,
  tutorialSeen: true,
  musicVolume: 0.75,
  sfxVolume: 0.75,
  selectedTracks: [...ALL_CONCRETE_TRACKS],
  musicTrack: 'auto',
};

describe('SettingsModal component', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders tab buttons: controls, cats, graphics, sound, ayudas with custom Soft-Clay SVG icons', () => {
    const { getByTestId, queryByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getByTestId('icon-gear')).toBeDefined();
    expect(getByTestId('tab-btn-controls').querySelector('[data-testid="icon-tab-controls"]')).not.toBeNull();
    expect(getByTestId('tab-btn-cats').querySelector('[data-testid="icon-tab-cats"]')).not.toBeNull();
    expect(getByTestId('tab-btn-cats').textContent).toContain('Gatos');
    expect(getByTestId('tab-btn-graphics').querySelector('[data-testid="icon-tab-graphics"]')).not.toBeNull();
    expect(getByTestId('tab-btn-sound').querySelector('[data-testid="icon-tab-sound"]')).not.toBeNull();
    expect(getByTestId('tab-btn-ayudas').querySelector('[data-testid="icon-tab-ayudas"]')).not.toBeNull();
    expect(queryByTestId('tab-btn-reset')).toBeNull();
  });

  it('applies fixed stable height to modal dialog card to prevent tab bar jumping across tabs', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialogCard = getByTestId('settings-modal-card');
    expect(dialogCard.style.height).toBeTruthy();
  });

  it('switches tabs when tab buttons are clicked', () => {
    const { getByTestId, queryByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Default tab is controls
    expect(getByTestId('pane-controls')).toBeDefined();
    expect(queryByTestId('pane-cats')).toBeNull();
    expect(queryByTestId('pane-graphics')).toBeNull();

    // Click cats tab
    fireEvent.click(getByTestId('tab-btn-cats'));
    expect(queryByTestId('pane-controls')).toBeNull();
    expect(getByTestId('pane-cats')).toBeDefined();

    // Click graphics tab
    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(queryByTestId('pane-cats')).toBeNull();
    expect(getByTestId('pane-graphics')).toBeDefined();

    // Click sound tab
    fireEvent.click(getByTestId('tab-btn-sound'));
    expect(getByTestId('pane-sound')).toBeDefined();

    // Click ayudas tab
    fireEvent.click(getByTestId('tab-btn-ayudas'));
    expect(getByTestId('pane-ayudas')).toBeDefined();
  });

  it('Controls tab: directly renders speed slider and tap tester without scheme buttons', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, queryByTestId, queryByText, getByText } = render(
      <SettingsModal
        settings={{ ...defaultSettings, doubleTapTimeoutMs: 500 }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    // Control scheme toggle buttons do not exist
    expect(queryByTestId('select-control-toggle')).toBeNull();
    expect(queryByTestId('select-control-double-tap')).toBeNull();

    const slider = getByTestId('speed-slider') as HTMLInputElement;
    expect(slider).toBeDefined();
    expect(slider.value).toBe('500');

    // Change slider
    fireEvent.input(slider, { target: { value: '650' } });
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ doubleTapTimeoutMs: 650 })
    );

    // Tap tester exists
    const tester = getByTestId('double-tap-tester');
    expect(tester).toBeDefined();
    const cellTester = getByTestId('double-tap-cell-tester');
    expect(cellTester).toBeDefined();

    // Clean speed labels without milliseconds and without Área de prueba title
    expect(getByText('Rápido')).toBeDefined();
    expect(getByText('Normal')).toBeDefined();
    expect(getByText('Lento')).toBeDefined();
    expect(queryByText(/250ms/i)).toBeNull();
    expect(queryByText(/500ms/i)).toBeNull();
    expect(queryByText(/900ms/i)).toBeNull();
    expect(queryByText('ÁREA DE PRUEBA')).toBeNull();
  });

  it('Controls tab: double-tap section is uncarded without #F8F3E8 card background or border', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const section = getByTestId('double-tap-speed-section');
    expect(section.style.background).not.toContain('#F8F3E8');
    expect(section.style.backgroundColor).not.toBe('rgb(248, 243, 232)');
    expect(section.style.border).toBe('');
  });

  it('Controls tab: cell tap tester displays 52x52px board cell styling and is empty when idle', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const cell = getByTestId('double-tap-cell-tester');
    expect(cell.style.width).toBe('52px');
    expect(cell.style.height).toBe('52px');
    expect(cell.style.borderRadius).toBe('12px');
    expect(cell.style.backgroundColor).toBe('rgb(255, 227, 216)');
    expect(cell.style.border).toMatch(/2px solid (rgb\(226, 214, 193\)|#E2D6C1)/i);

    // Empty when idle
    expect(cell.querySelector('.cat-svg')).toBeNull();
    expect(cell.querySelector('[data-testid="double-tap-cross"]')).toBeNull();
    expect(getByTestId('double-tap-tester-feedback').textContent).toContain('Prueba aquí tu ritmo de doble toque');
  });

  it('Controls tab: single tap renders translucent cross and disappears when timer expires', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, doubleTapTimeoutMs: 500 }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const cell = getByTestId('double-tap-cell-tester');
    const feedback = getByTestId('double-tap-tester-feedback');

    // Single click -> shows translucent cross (opacity 0.45)
    fireEvent.click(cell);
    const cross = cell.querySelector('[data-testid="double-tap-cross"]') as HTMLElement;
    expect(cross).not.toBeNull();
    expect(cross.textContent).toBe('✕');
    expect(cross.style.opacity).toBe('0.45');
    expect(feedback.textContent).toContain('1 toque detectado');

    // Advance timer by 499ms -> cross still present
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(cell.querySelector('[data-testid="double-tap-cross"]')).not.toBeNull();

    // Advance 1ms (500ms total = currentTimeout) -> cross expires back to empty idle state
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cell.querySelector('[data-testid="double-tap-cross"]')).toBeNull();
    expect(feedback.textContent).toContain('Prueba aquí tu ritmo de doble toque');

    vi.useRealTimers();
  });

  it('Controls tab: double tap renders CatSvg and resets back to idle after 1.2s', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, doubleTapTimeoutMs: 500, catVariant: 'siamese' }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const cell = getByTestId('double-tap-cell-tester');
    const feedback = getByTestId('double-tap-tester-feedback');

    // 1st click
    fireEvent.click(cell);
    expect(cell.querySelector('[data-testid="double-tap-cross"]')).not.toBeNull();

    // 2nd click after 120ms (within 500ms) -> double tap detected, renders CatSvg with equipped variant
    vi.advanceTimersByTime(120);
    fireEvent.click(cell);

    expect(cell.querySelector('[data-testid="double-tap-cross"]')).toBeNull();
    const cat = cell.querySelector('.cat-svg');
    expect(cat).not.toBeNull();
    expect(cat?.getAttribute('data-cat-state')).toBe('idle');
    expect(cat?.querySelector('[data-cat-part="head"]')?.getAttribute('fill')).toBe('#F5EFE6');
    expect(feedback.textContent).toContain('¡Doble toque detectado!');
    expect(feedback.textContent).toContain('120ms');
    expect(/\p{Extended_Pictographic}/u.test(feedback.textContent || '')).toBe(false);

    // Advance 1199ms -> cat still visible
    act(() => {
      vi.advanceTimersByTime(1199);
    });
    expect(cell.querySelector('.cat-svg')).not.toBeNull();

    // Advance 1ms (1200ms = 1.2s total) -> resets back to idle
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cell.querySelector('.cat-svg')).toBeNull();
    expect(feedback.textContent).toContain('Prueba aquí tu ritmo de doble toque');

    vi.useRealTimers();
  });

  it('Cats tab: renders 8 cat breeds, displays totalStars badge, blocks locked breeds, and selects unlocked breeds', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={defaultSettings}
        totalStars={24}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-cats'));
    expect(getByTestId('pane-cats')).toBeDefined();
    expect(getByTestId('settings-total-stars').textContent).toContain('24★');
    expect(getByTestId('select-cat-black')).toBeDefined();
    expect(getByTestId('select-cat-white')).toBeDefined();

    // Black and White are unlocked at 24 stars; Orange (25★) is locked
    const orangeCard = getByTestId('select-cat-orange');
    expect(orangeCard.getAttribute('data-locked')).toBe('true');
    fireEvent.click(orangeCard);
    expect(onUpdateSettings).not.toHaveBeenCalled();

    // Rerender with 60 stars -> Orange (25★) and Siamese (60★) are unlocked, Calico (100★) is locked
    rerender(
      <SettingsModal
        settings={defaultSettings}
        totalStars={60}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );
    expect(getByTestId('select-cat-orange').getAttribute('data-locked')).toBe('false');
    expect(getByTestId('select-cat-siamese').getAttribute('data-locked')).toBe('false');
    expect(getByTestId('select-cat-calico').getAttribute('data-locked')).toBe('true');

    fireEvent.click(getByTestId('select-cat-siamese'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ catVariant: 'siamese' })
    );
  });

  it('Graphics tab: renders region assist options and live board preview, and no longer contains cat breeds', () => {
    const { getByTestId, queryByTestId, queryByText } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('pane-graphics')).toBeDefined();
    expect(queryByTestId('pane-cats')).toBeNull();

    // Cat gallery is no longer in Graphics tab
    expect(queryByTestId('select-cat-black')).toBeNull();
    expect(queryByTestId('select-cat-white')).toBeNull();
    expect(queryByTestId('select-cat-orange')).toBeNull();
    expect(queryByTestId('settings-total-stars')).toBeNull();

    // Region assist & preview are present
    expect(getByTestId('select-region-assist-off')).toBeDefined();
    expect(getByTestId('select-region-assist-textures')).toBeDefined();
    expect(getByTestId('select-region-assist-glyphs')).toBeDefined();
    expect(getByTestId('select-region-assist-numbers')).toBeDefined();
    expect(getByTestId('mini-board-preview')).toBeDefined();

    // Verify micro-descriptions and preview footer text are removed
    expect(queryByText('Colores puros')).toBeNull();
    expect(queryByText('Tramas rayadas')).toBeNull();
    expect(queryByText('Iconos en esquina')).toBeNull();
    expect(queryByText('Dígitos en esquina')).toBeNull();
    expect(queryByText(/Muestra cómo lucen los gatos/i)).toBeNull();
  });

  it('Graphics tab: mini-board preview renders distinct SVG glyphs and textures matching region IDs', () => {
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={{ ...defaultSettings, regionAssist: 'glyphs' }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('select-region-assist-glyphs').textContent).toBe('Iconos');
    const preview = getByTestId('mini-board-preview');
    // Regions 0, 1, 2 correspond to paw, fish, yarn SVG glyphs
    expect(preview.querySelector('.region-glyph-badge[data-glyph="paw"]')).not.toBeNull();
    expect(preview.querySelector('.region-glyph-badge[data-glyph="fish"]')).not.toBeNull();
    expect(preview.querySelector('.region-glyph-badge[data-glyph="yarn"]')).not.toBeNull();

    // With textures
    rerender(
      <SettingsModal
        settings={{ ...defaultSettings, regionAssist: 'textures' }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(preview.querySelector('.region-pattern.pat-0')).not.toBeNull();
    expect(preview.querySelector('.region-pattern.pat-1')).not.toBeNull();
    expect(preview.querySelector('.region-pattern.pat-2')).not.toBeNull();
  });

  it('Sound tab: allows toggling music and sfx', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));
    fireEvent.click(getByTestId('toggle-music-btn'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicMuted: true })
    );

    fireEvent.click(getByTestId('toggle-sfx-btn'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ sfxMuted: true })
    );
  });

  it('Sound tab: renders stepped volume sliders with tick marks, section headers, and playlist checkboxes', () => {
    const { getByTestId, getAllByText, getByText, queryByText } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicVolume: 0.75,
          sfxVolume: 0.75,
          selectedTracks: [...ALL_CONCRETE_TRACKS],
        }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));

    // Redundant top banner removed
    expect(queryByText('SONIDO')).toBeNull();
    expect(queryByText('AUDIO')).toBeNull();

    // Section headers in all-caps
    expect(getByText('MÚSICA')).toBeDefined();
    expect(getByText('EFECTOS (SFX)')).toBeDefined();
    expect(getByText('BANDA SONORA')).toBeDefined();

    // Stepped volume sliders
    const musicSlider = getByTestId('music-vol-slider') as HTMLInputElement;
    expect(musicSlider).toBeDefined();
    expect(musicSlider.min).toBe('0');
    expect(musicSlider.max).toBe('1');
    expect(musicSlider.step).toBe('0.25');
    expect(musicSlider.value).toBe('0.75');

    const sfxSlider = getByTestId('sfx-vol-slider') as HTMLInputElement;
    expect(sfxSlider).toBeDefined();
    expect(sfxSlider.min).toBe('0');
    expect(sfxSlider.max).toBe('1');
    expect(sfxSlider.step).toBe('0.25');
    expect(sfxSlider.value).toBe('0.75');

    // Stepped tick labels (0%, 25%, 50%, 75%, 100%)
    expect(getAllByText('0%').length).toBe(2);
    expect(getAllByText('25%').length).toBe(2);
    expect(getAllByText('50%').length).toBe(2);
    expect(getAllByText('75%').length).toBe(2);
    expect(getAllByText('100%').length).toBe(2);

    // Playlist master checkbox
    const masterCheckbox = getByTestId('track-opt-all') as HTMLInputElement;
    expect(masterCheckbox).toBeDefined();
    expect(masterCheckbox.checked).toBe(true);
    expect(getByText('Todas las pistas')).toBeDefined();

    // Individual checkboxes for all 6 songs
    for (const trackId of ALL_CONCRETE_TRACKS) {
      const trackCheckbox = getByTestId(`track-checkbox-${trackId}`) as HTMLInputElement;
      expect(trackCheckbox).toBeDefined();
      expect(trackCheckbox.checked).toBe(true);
    }
  });

  it('Sound tab: moving volume sliders to 0 sets volume to 0 and mutes; moving >0 unmutes and sets volume', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicVolume: 0.75,
          musicMuted: false,
          sfxVolume: 0.75,
          sfxMuted: false,
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));

    // Move music slider to 0 -> muted: true, volume: 0
    const musicSlider = getByTestId('music-vol-slider');
    fireEvent.input(musicSlider, { target: { value: '0' } });
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicVolume: 0, musicMuted: true })
    );

    // Move music slider to 0.5 -> muted: false, volume: 0.5
    fireEvent.input(musicSlider, { target: { value: '0.5' } });
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicVolume: 0.5, musicMuted: false })
    );

    // Move SFX slider to 0 -> muted: true, volume: 0
    const sfxSlider = getByTestId('sfx-vol-slider');
    fireEvent.input(sfxSlider, { target: { value: '0' } });
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ sfxVolume: 0, sfxMuted: true })
    );

    // Move SFX slider to 0.25 -> muted: false, volume: 0.25
    fireEvent.input(sfxSlider, { target: { value: '0.25' } });
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ sfxVolume: 0.25, sfxMuted: false })
    );
  });

  it('Sound tab: slider displays 0 value when muted', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicVolume: 0.75,
          musicMuted: true,
          sfxVolume: 0.75,
          sfxMuted: true,
        }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));
    const musicSlider = getByTestId('music-vol-slider') as HTMLInputElement;
    expect(musicSlider.value).toBe('0');
    const sfxSlider = getByTestId('sfx-vol-slider') as HTMLInputElement;
    expect(sfxSlider.value).toBe('0');
  });

  it('Sound tab: master checkbox toggles all tracks vs default single track', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          selectedTracks: [...ALL_CONCRETE_TRACKS],
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));
    const masterCheckbox = getByTestId('track-opt-all') as HTMLInputElement;
    expect(masterCheckbox.checked).toBe(true);

    // Clicking master when all 6 tracks are selected unchecks to default ['marimba']
    fireEvent.click(masterCheckbox);
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTracks: ['marimba'] })
    );

    // When only a subset of tracks are selected, master checkbox is unchecked
    rerender(
      <SettingsModal
        settings={{
          ...defaultSettings,
          selectedTracks: ['marimba', 'bossa'],
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );
    expect((getByTestId('track-opt-all') as HTMLInputElement).checked).toBe(false);

    // Clicking master when not all are checked selects all 6 tracks
    fireEvent.click(getByTestId('track-opt-all'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTracks: [...ALL_CONCRETE_TRACKS] })
    );
  });

  it('Sound tab: individual checkboxes toggle tracks and guard prevents unchecking the last track', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          selectedTracks: ['marimba', 'velvet'],
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));

    // Check states: marimba checked, velvet checked, sunbeam unchecked
    expect((getByTestId('track-checkbox-marimba') as HTMLInputElement).checked).toBe(true);
    expect((getByTestId('track-checkbox-velvet') as HTMLInputElement).checked).toBe(true);
    expect((getByTestId('track-checkbox-sunbeam') as HTMLInputElement).checked).toBe(false);

    // Check an unchecked track (sunbeam) -> adds to selectedTracks
    fireEvent.click(getByTestId('track-checkbox-sunbeam'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTracks: ['marimba', 'velvet', 'sunbeam'] })
    );

    // Uncheck a checked track (velvet) -> removes from selectedTracks
    fireEvent.click(getByTestId('track-checkbox-velvet'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTracks: ['marimba'] })
    );

    // Guard test: when only 1 track remains, unchecking it is blocked
    rerender(
      <SettingsModal
        settings={{
          ...defaultSettings,
          selectedTracks: ['marimba'],
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );
    onUpdateSettings.mockClear();

    fireEvent.click(getByTestId('track-checkbox-marimba'));
    expect(onUpdateSettings).not.toHaveBeenCalled();
  });

  it('Ayudas tab: renders auto-cross options and allows changing assist setting', () => {
    const onUpdateSettings = vi.fn();

    const { getByTestId, queryByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-ayudas'));
    expect(getByTestId('pane-ayudas')).toBeDefined();

    expect(getByTestId('select-autocross-off')).toBeDefined();
    expect(getByTestId('select-autocross-all')).toBeDefined();
    expect(queryByTestId('select-autocross-row-col-surround')).toBeNull();

    // Selecting all
    fireEvent.click(getByTestId('select-autocross-all'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoCross: 'all' })
    );

    // Selecting off
    fireEvent.click(getByTestId('select-autocross-off'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoCross: 'off' })
    );
  });

  it('Sound tab: moving SFX volume slider > 0 plays a preview sound', () => {
    const playCrossSpy = vi.spyOn(soundEngine, 'playCross');
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(getByTestId('tab-btn-sound'));
    fireEvent.input(getByTestId('sfx-vol-slider'), { target: { value: '0.5' } });
    expect(playCrossSpy).toHaveBeenCalled();
    playCrossSpy.mockRestore();
  });

  it('Sound tab: unmuting when volume was 0 restores volume to 0.75', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, musicMuted: true, musicVolume: 0 }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(getByTestId('tab-btn-sound'));
    fireEvent.click(getByTestId('toggle-music-btn'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicMuted: false, musicVolume: 0.75 })
    );
  });

  describe('Controles tab: language selector', () => {
    it('renders segmented language selector at the top of Controles tab with Auto, Español, English options', () => {
      const { getByTestId } = render(
        <SettingsModal
          settings={defaultSettings}
          onUpdateSettings={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const langSelect = getByTestId('language-select');
      expect(langSelect).toBeDefined();

      const optAuto = getByTestId('lang-opt-auto');
      const optEs = getByTestId('lang-opt-es');
      const optEn = getByTestId('lang-opt-en');

      expect(optAuto.textContent?.trim()).toBe('Auto');
      expect(optEs.textContent?.trim()).toBe('Español');
      expect(optEn.textContent?.trim()).toBe('English');
    });

    it('clicking language options calls onUpdateSettings with language', () => {
      const onUpdateSettings = vi.fn();
      const { getByTestId } = render(
        <SettingsModal
          settings={{ ...defaultSettings, language: 'auto' }}
          onUpdateSettings={onUpdateSettings}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(getByTestId('lang-opt-en'));
      expect(onUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' })
      );

      fireEvent.click(getByTestId('lang-opt-es'));
      expect(onUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'es' })
      );

      fireEvent.click(getByTestId('lang-opt-auto'));
      expect(onUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'auto' })
      );
    });
  });

  describe('Full localization with I18nProvider', () => {
    it('renders English strings when wrapped in I18nProvider with lang="en"', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <I18nProvider lang="en">
          <SettingsModal
            settings={{ ...defaultSettings, language: 'en' }}
            totalStars={300}
            onUpdateSettings={vi.fn()}
            onClose={vi.fn()}
          />
        </I18nProvider>
      );

      // Modal title and close button
      expect(getByText('Settings')).toBeDefined();
      expect(getByTestId('close-settings-btn').getAttribute('aria-label')).toBe('Close');

      // Tab buttons
      expect(getByTestId('tab-btn-controls').textContent).toContain('Controls');
      expect(getByTestId('tab-btn-cats').textContent).toContain('Cats');
      expect(getByTestId('tab-btn-graphics').textContent).toContain('Graphics');
      expect(getByTestId('tab-btn-sound').textContent).toContain('Audio');
      expect(getByTestId('tab-btn-ayudas').textContent).toContain('Assists');

      // Controls tab (default)
      expect(getByText('LANGUAGE')).toBeDefined();
      expect(getByText('Auto-detect or choose language')).toBeDefined();
      expect(getByText('DOUBLE-TAP SPEED')).toBeDefined();
      expect(getByText('Fast')).toBeDefined();
      expect(getByText('Normal')).toBeDefined();
      expect(getByText('Slow')).toBeDefined();
      expect(getByText('Test your double-tap rhythm here')).toBeDefined();

      // Cats tab
      fireEvent.click(getByTestId('tab-btn-cats'));
      expect(getByText('CHOOSE YOUR KITTEN')).toBeDefined();
      expect(getByTestId('select-cat-black').getAttribute('aria-label')).toContain('Black Cat');
      expect(getByTestId('select-cat-orange').getAttribute('aria-label')).toContain('Orange Tabby');

      // Graphics tab
      fireEvent.click(getByTestId('tab-btn-graphics'));
      expect(getByText('REGION DIFFERENTIATION')).toBeDefined();
      expect(getByTestId('select-region-assist-off').textContent?.trim()).toBe('Off');
      expect(getByTestId('select-region-assist-textures').textContent?.trim()).toBe('Stripes');
      expect(getByTestId('select-region-assist-glyphs').textContent?.trim()).toBe('Icons');
      expect(getByTestId('select-region-assist-numbers').textContent?.trim()).toBe('Numbers 1-9');

      // Audio tab
      fireEvent.click(getByTestId('tab-btn-sound'));
      expect(getByText('MUSIC')).toBeDefined();
      expect(getByText('SOUND EFFECTS (SFX)')).toBeDefined();
      expect(getByText('SOUNDTRACK')).toBeDefined();
      expect(getByTestId('track-opt-all')).toBeDefined();
      expect(getByText('All tracks')).toBeDefined();
      expect(getByTestId('track-checkbox-marimba')).toBeDefined();
      expect(getByTestId('music-vol-slider')).toBeDefined();
      expect(getByTestId('sfx-vol-slider')).toBeDefined();

      // Assists tab
      fireEvent.click(getByTestId('tab-btn-ayudas'));
      expect(getByText('AUTO-CROSS ELIMINATIONS')).toBeDefined();
      expect(getByTestId('select-autocross-off').textContent).toContain('No');
      expect(getByTestId('select-autocross-off').textContent).toContain('Place all crosses manually');
      expect(queryByTestId('select-autocross-row-col-surround')).toBeNull();
      expect(getByTestId('select-autocross-all').textContent).toContain('Yes (Row, column, surround & color)');
      expect(getByTestId('select-autocross-all').textContent).toContain('Crosses in row, column, adjacent cells, and entire color region');
    });

    it('renders Spanish strings in default context', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <SettingsModal
          settings={defaultSettings}
          totalStars={300}
          onUpdateSettings={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Modal title
      expect(getByText('Ajustes')).toBeDefined();

      // Tab buttons
      expect(getByTestId('tab-btn-controls').textContent).toContain('Controles');
      expect(getByTestId('tab-btn-cats').textContent).toContain('Gatos');
      expect(getByTestId('tab-btn-graphics').textContent).toContain('Aspecto');
      expect(getByTestId('tab-btn-sound').textContent).toContain('Sonido');
      expect(getByTestId('tab-btn-ayudas').textContent).toContain('Ayudas');

      // Controls tab
      expect(getByText('IDIOMA')).toBeDefined();
      expect(getByText('Detectar automáticamente o elegir idioma')).toBeDefined();
      expect(getByText('VELOCIDAD DE DOBLE TOQUE')).toBeDefined();
      expect(getByText('Prueba aquí tu ritmo de doble toque')).toBeDefined();

      // Cats tab
      fireEvent.click(getByTestId('tab-btn-cats'));
      expect(getByText('ELIGE TU GATITO')).toBeDefined();
      expect(getByTestId('select-cat-black').getAttribute('aria-label')).toContain('Gato Negro');
      expect(getByTestId('select-cat-orange').getAttribute('aria-label')).toContain('Naranjito');

      // Graphics tab
      fireEvent.click(getByTestId('tab-btn-graphics'));
      expect(getByText('DIFERENCIACIÓN DE REGIONES')).toBeDefined();

      // Audio tab
      fireEvent.click(getByTestId('tab-btn-sound'));
      expect(getByText('MÚSICA')).toBeDefined();
      expect(getByText('EFECTOS (SFX)')).toBeDefined();
      expect(getByText('BANDA SONORA')).toBeDefined();
      expect(getByTestId('track-opt-all')).toBeDefined();
      expect(getByText('Todas las pistas')).toBeDefined();
      expect(getByTestId('track-checkbox-marimba')).toBeDefined();
      expect(getByTestId('music-vol-slider')).toBeDefined();
      expect(getByTestId('sfx-vol-slider')).toBeDefined();

      // Assists tab
      fireEvent.click(getByTestId('tab-btn-ayudas'));
      expect(getByText('AUTO-DESCARTES DE CRUCES')).toBeDefined();
      expect(getByTestId('select-autocross-off').textContent).toContain('No');
      expect(getByTestId('select-autocross-off').textContent).toContain('Colocar todas las cruces de forma manual');
      expect(queryByTestId('select-autocross-row-col-surround')).toBeNull();
      expect(getByTestId('select-autocross-all').textContent).toContain('Sí (Fila, columna, alrededor y color)');
      expect(getByTestId('select-autocross-all').textContent).toContain('Cruces en fila, columna, adyacentes y toda la región de color');
    });
  });
});
