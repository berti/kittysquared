// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../src/components/SettingsModal';
import { soundEngine } from '../../src/audio/soundEngine';
import { AppSettings } from '../../src/state/storage';
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
    expect(getByText('Normal')).toBeDefined();
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
    expect(tester.textContent).toContain('Prueba aquí tu ritmo de doble toque');
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

  it('Review Focus #4: Graphics tab renders 8 cat breeds, displays totalStars badge, blocks locked breeds, and selects unlocked breeds', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={defaultSettings}
        totalStars={24}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('settings-total-stars').textContent).toContain('24★');

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
    expect(getByTestId('track-opt-auto').textContent?.trim()).toBe('Automática (por tamaño)');
    expect(getByTestId('track-opt-marimba').textContent?.trim()).toBe('Gatito Curioso (Marimba)');
    expect(getByTestId('track-opt-velvet').textContent?.trim()).toBe('Pasos de Terciopelo (Suave)');
    expect(getByTestId('track-opt-sunbeam').textContent?.trim()).toBe('Rayo de Sol (Alegre)');
    expect(getByTestId('track-opt-bossa').textContent?.trim()).toBe('Siesta Felina (Bossa)');
    expect(getByTestId('track-opt-waltz').textContent?.trim()).toBe('Vals de Medianoche (Misterio)');
    expect(getByTestId('track-opt-samba').textContent?.trim()).toBe('Ronroneo Travieso (Samba)');
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
      const { getByTestId, getByText } = render(
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

      // Graphics tab
      fireEvent.click(getByTestId('tab-btn-graphics'));
      expect(getByText('CHOOSE YOUR KITTEN')).toBeDefined();
      expect(getByTestId('select-cat-black').getAttribute('aria-label')).toContain('Black Cat');
      expect(getByTestId('select-cat-orange').getAttribute('aria-label')).toContain('Orange Tabby');
      expect(getByText('REGION DIFFERENTIATION')).toBeDefined();
      expect(getByTestId('select-region-assist-off').textContent?.trim()).toBe('Off');
      expect(getByTestId('select-region-assist-textures').textContent?.trim()).toBe('Stripes');
      expect(getByTestId('select-region-assist-glyphs').textContent?.trim()).toBe('Icons');
      expect(getByTestId('select-region-assist-numbers').textContent?.trim()).toBe('Numbers 1-9');

      // Audio tab
      fireEvent.click(getByTestId('tab-btn-sound'));
      expect(getByText('Music')).toBeDefined();
      expect(getByText('Sound Effects (SFX)')).toBeDefined();
      expect(getByText('Music track')).toBeDefined();
      expect(getByTestId('track-opt-auto').textContent?.trim()).toBe('Automatic (by size)');
      expect(getByTestId('track-opt-marimba').textContent?.trim()).toBe('Curious Kitten (Marimba)');
      expect(getByTestId('track-opt-velvet').textContent?.trim()).toBe('Velvet Paws (Gentle)');

      // Assists tab
      fireEvent.click(getByTestId('tab-btn-ayudas'));
      expect(getByText('AUTO-CROSS ELIMINATIONS')).toBeDefined();
      expect(getByTestId('select-autocross-off').textContent).toContain('Off');
      expect(getByTestId('select-autocross-off').textContent).toContain('Place all crosses manually');
      expect(getByTestId('select-autocross-row-col-surround').textContent).toContain('Row, column & surround');
      expect(getByTestId('select-autocross-all').textContent).toContain('Row, column, surround & color');
    });

    it('renders Spanish strings in default context', () => {
      const { getByTestId, getByText } = render(
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
      expect(getByTestId('tab-btn-graphics').textContent).toContain('Aspecto');
      expect(getByTestId('tab-btn-sound').textContent).toContain('Sonido');
      expect(getByTestId('tab-btn-ayudas').textContent).toContain('Ayudas');

      // Controls tab
      expect(getByText('IDIOMA')).toBeDefined();
      expect(getByText('Detectar automáticamente o elegir idioma')).toBeDefined();
      expect(getByText('VELOCIDAD DE DOBLE TOQUE')).toBeDefined();
      expect(getByText('Prueba aquí tu ritmo de doble toque')).toBeDefined();

      // Graphics tab
      fireEvent.click(getByTestId('tab-btn-graphics'));
      expect(getByText('ELIGE TU GATITO')).toBeDefined();
      expect(getByTestId('select-cat-black').getAttribute('aria-label')).toContain('Gato Negro');
      expect(getByTestId('select-cat-orange').getAttribute('aria-label')).toContain('Naranjito');
      expect(getByText('DIFERENCIACIÓN DE REGIONES')).toBeDefined();

      // Audio tab
      fireEvent.click(getByTestId('tab-btn-sound'));
      expect(getByText('Música')).toBeDefined();
      expect(getByText('Efectos (SFX)')).toBeDefined();
      expect(getByText('Pista musical')).toBeDefined();
      expect(getByTestId('track-opt-auto').textContent?.trim()).toBe('Automática (por tamaño)');
      expect(getByTestId('track-opt-marimba').textContent?.trim()).toBe('Gatito Curioso (Marimba)');

      // Assists tab
      fireEvent.click(getByTestId('tab-btn-ayudas'));
      expect(getByText('AUTO-DESCARTES DE CRUCES')).toBeDefined();
      expect(getByTestId('select-autocross-off').textContent).toContain('No');
      expect(getByTestId('select-autocross-row-col-surround').textContent).toContain('Fila, columna y alrededor');
    });
  });
});
