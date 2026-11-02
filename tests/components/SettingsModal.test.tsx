// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../src/components/SettingsModal';
import { soundEngine } from '../../src/audio/soundEngine';
import { AppSettings } from '../../src/state/storage';

const defaultSettings: AppSettings = {
  doubleTapTimeoutMs: 500,
  catVariant: 'black',
  regionAssist: 'off',
  autoCross: 'off',
  musicMuted: false,
  sfxMuted: false,
  tutorialSeen: true,
  musicVolume: 0.75,
  sfxVolume: 0.75,
  musicTrack: 'auto',
};

describe('SettingsModal component', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders tab buttons: controls, graphics, sound, ayudas with custom Soft-Clay SVG icons', () => {
    const { getByTestId, queryByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getByTestId('icon-gear')).toBeDefined();
    expect(getByTestId('tab-btn-controls').querySelector('[data-testid="icon-tab-controls"]')).not.toBeNull();
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
    expect(queryByTestId('pane-graphics')).toBeNull();

    // Click graphics tab
    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(queryByTestId('pane-controls')).toBeNull();
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

    // Clean speed labels without milliseconds and without Área de prueba title
    expect(getByText('Rápido')).toBeDefined();
    expect(getByText('Medio')).toBeDefined();
    expect(getByText('Lento')).toBeDefined();
    expect(queryByText(/250ms/i)).toBeNull();
    expect(queryByText(/500ms/i)).toBeNull();
    expect(queryByText(/900ms/i)).toBeNull();
    expect(queryByText('ÁREA DE PRUEBA')).toBeNull();
  });

  it('Controls tab: double-tap tester provides interactive feedback for single and double taps', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, doubleTapTimeoutMs: 500 }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const tester = getByTestId('double-tap-tester');
    expect(tester.querySelector('[data-testid="icon-tap-prompt"]')).not.toBeNull();

    // 1st click -> single tap feedback
    fireEvent.click(tester);
    expect(tester.textContent).toContain('1 toque');

    // 2nd click after 100ms (within 500ms) -> double tap feedback with CatSvg and no paw emoji
    vi.advanceTimersByTime(100);
    fireEvent.click(tester);
    expect(tester.textContent).toContain('¡Doble toque detectado!');
    expect(tester.textContent).not.toContain('🐾');
    expect(tester.querySelector('.cat-svg')).not.toBeNull();

    // After 2000ms -> resets back to idle
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(tester.textContent).toContain('Toca 2 veces aquí para probar la velocidad');
    vi.useRealTimers();
  });

  it('Graphics tab: renders cat variants, region assist options, and mini-board preview', () => {
    const { getByTestId, queryByText } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('select-cat-black')).toBeDefined();
    expect(getByTestId('select-cat-white')).toBeDefined();
    expect(getByTestId('select-region-assist-off')).toBeDefined();
    expect(getByTestId('select-region-assist-textures')).toBeDefined();
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

  it('Sound tab: renders 5-step volume selectors for music and sfx, and soundtrack selector', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicVolume: 0.75,
          sfxVolume: 0.75,
          musicTrack: 'auto',
        }}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));

    // Music volume steps
    expect(getByTestId('music-vol-step-0')).toBeDefined();
    expect(getByTestId('music-vol-step-0.25')).toBeDefined();
    expect(getByTestId('music-vol-step-0.5')).toBeDefined();
    expect(getByTestId('music-vol-step-0.75')).toBeDefined();
    expect(getByTestId('music-vol-step-1')).toBeDefined();

    // SFX volume steps
    expect(getByTestId('sfx-vol-step-0')).toBeDefined();
    expect(getByTestId('sfx-vol-step-0.25')).toBeDefined();
    expect(getByTestId('sfx-vol-step-0.5')).toBeDefined();
    expect(getByTestId('sfx-vol-step-0.75')).toBeDefined();
    expect(getByTestId('sfx-vol-step-1')).toBeDefined();

    // Track options (Auto + 6 songs) with clean labels without decorative emojis
    expect(getByTestId('track-opt-auto').textContent?.trim()).toBe('Auto (6 temas)');
    expect(getByTestId('track-opt-marimba').textContent?.trim()).toBe('Marimba Michi');
    expect(getByTestId('track-opt-velvet').textContent?.trim()).toBe('Velvet Paws');
    expect(getByTestId('track-opt-sunbeam').textContent?.trim()).toBe('Sunbeam Stroll');
    expect(getByTestId('track-opt-bossa').textContent?.trim()).toBe('Bossa Meow');
    expect(getByTestId('track-opt-waltz').textContent?.trim()).toBe('Catnip Waltz');
    expect(getByTestId('track-opt-samba').textContent?.trim()).toBe('Samba de Gatinho');
  });

  it('Sound tab: clicking 0% volume step automatically mutes; clicking >0% unmutes and sets volume', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicVolume: 0.75,
          musicMuted: false,
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));

    // Click 0% -> sets musicMuted: true
    fireEvent.click(getByTestId('music-vol-step-0'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicVolume: 0, musicMuted: true })
    );

    // Click 50% -> sets musicVolume: 0.5 and musicMuted: false
    fireEvent.click(getByTestId('music-vol-step-0.5'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicVolume: 0.5, musicMuted: false })
    );
  });

  it('Sound tab: selecting a specific soundtrack option updates settings', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={{
          ...defaultSettings,
          musicTrack: 'auto',
        }}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-sound'));
    fireEvent.click(getByTestId('track-opt-marimba'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicTrack: 'marimba' })
    );
    fireEvent.click(getByTestId('track-opt-bossa'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ musicTrack: 'bossa' })
    );
  });

  it('Ayudas tab: renders auto-cross options and allows changing assist setting', () => {
    const onUpdateSettings = vi.fn();

    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-ayudas'));
    expect(getByTestId('pane-ayudas')).toBeDefined();

    expect(getByTestId('select-autocross-off')).toBeDefined();
    expect(getByTestId('select-autocross-row-col-surround')).toBeDefined();
    expect(getByTestId('select-autocross-all')).toBeDefined();

    // Selecting row_col_surround
    fireEvent.click(getByTestId('select-autocross-row-col-surround'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoCross: 'row_col_surround' })
    );

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

  it('Sound tab: clicking SFX volume step > 0 plays a preview sound', () => {
    const playCrossSpy = vi.spyOn(soundEngine, 'playCross');
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(getByTestId('tab-btn-sound'));
    fireEvent.click(getByTestId('sfx-vol-step-0.5'));
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
});
