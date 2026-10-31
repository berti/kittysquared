// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../src/components/SettingsModal';
import { AppSettings } from '../../src/state/storage';

const defaultSettings: AppSettings = {
  controlScheme: 'double-tap',
  doubleTapTimeoutMs: 500,
  catVariant: 'black',
  regionAssist: 'off',
  musicMuted: false,
  sfxMuted: false,
  tutorialSeen: true,
};

describe('SettingsModal component', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders tab buttons: controls, graphics, sound, reset', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getByTestId('tab-btn-controls')).toBeDefined();
    expect(getByTestId('tab-btn-graphics')).toBeDefined();
    expect(getByTestId('tab-btn-sound')).toBeDefined();
    expect(getByTestId('tab-btn-reset')).toBeDefined();
  });

  it('applies fixed stable height to modal dialog card to prevent tab bar jumping across tabs', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
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
        onResetMode={vi.fn()}
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

    // Click reset tab
    fireEvent.click(getByTestId('tab-btn-reset'));
    expect(getByTestId('pane-reset')).toBeDefined();
  });

  it('Controls tab: reveals speed slider and tap tester when double-tap is active', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, controlScheme: 'double-tap', doubleTapTimeoutMs: 500 }}
        onUpdateSettings={onUpdateSettings}
        onResetMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

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
  });

  it('Controls tab: double-tap tester provides interactive feedback for single and double taps', () => {
    vi.useFakeTimers();
    const { getByTestId } = render(
      <SettingsModal
        settings={{ ...defaultSettings, controlScheme: 'double-tap', doubleTapTimeoutMs: 500 }}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const tester = getByTestId('double-tap-tester');

    // 1st click -> single tap feedback
    fireEvent.click(tester);
    expect(tester.textContent).toContain('1 toque');

    // 2nd click after 100ms (within 500ms) -> double tap feedback
    vi.advanceTimersByTime(100);
    fireEvent.click(tester);
    expect(tester.textContent).toContain('¡Doble toque detectado!');

    // After 2000ms -> resets back to idle
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(tester.textContent).toContain('Toca 2 veces aquí para probar la velocidad');
    vi.useRealTimers();
  });

  it('Graphics tab: renders cat variants, region assist options, and mini-board preview', () => {
    const { getByTestId } = render(
      <SettingsModal
        settings={defaultSettings}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('select-cat-black')).toBeDefined();
    expect(getByTestId('select-cat-white')).toBeDefined();
    expect(getByTestId('select-region-assist-off')).toBeDefined();
    expect(getByTestId('select-region-assist-textures')).toBeDefined();
    expect(getByTestId('mini-board-preview')).toBeDefined();
  });

  it('Graphics tab: mini-board preview renders distinct glyphs and textures matching region IDs', () => {
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={{ ...defaultSettings, regionAssist: 'glyphs' }}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    const preview = getByTestId('mini-board-preview');
    // Regions 0, 1, 2 correspond to 🐾, 🐟, 🧶
    expect(preview.textContent).toContain('🐾');
    expect(preview.textContent).toContain('🐟');
    expect(preview.textContent).toContain('🧶');

    // With textures
    rerender(
      <SettingsModal
        settings={{ ...defaultSettings, regionAssist: 'textures' }}
        onUpdateSettings={vi.fn()}
        onResetMode={vi.fn()}
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
        onResetMode={vi.fn()}
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

  it('Reset tab: shows only active mode reset button during game play, and opens ConfirmDialog on click', () => {
    const onResetMode = vi.fn();

    // 1. Chill mode active -> only Chill reset visible
    const { getByTestId, queryByTestId, rerender } = render(
      <SettingsModal
        settings={defaultSettings}
        activeMode="chill"
        onUpdateSettings={vi.fn()}
        onResetMode={onResetMode}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-reset'));
    expect(getByTestId('reset-chill-btn')).toBeDefined();
    expect(queryByTestId('reset-classic-btn')).toBeNull();

    // Click reset chill -> opens ConfirmDialog (does not call onResetMode yet)
    fireEvent.click(getByTestId('reset-chill-btn'));
    expect(getByTestId('confirm-dialog-confirm-btn')).toBeDefined();
    expect(onResetMode).not.toHaveBeenCalled();

    // Confirm in dialog
    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
    expect(onResetMode).toHaveBeenCalledWith('chill');

    // 2. Classic mode active -> only Classic reset visible
    rerender(
      <SettingsModal
        settings={defaultSettings}
        activeMode="classic"
        onUpdateSettings={vi.fn()}
        onResetMode={onResetMode}
        onClose={vi.fn()}
      />
    );
    expect(queryByTestId('reset-chill-btn')).toBeNull();
    expect(getByTestId('reset-classic-btn')).toBeDefined();

    // 3. Home menu (activeMode = null) -> both visible
    rerender(
      <SettingsModal
        settings={defaultSettings}
        activeMode={null}
        onUpdateSettings={vi.fn()}
        onResetMode={onResetMode}
        onClose={vi.fn()}
      />
    );
    expect(getByTestId('reset-chill-btn')).toBeDefined();
    expect(getByTestId('reset-classic-btn')).toBeDefined();
  });
});
