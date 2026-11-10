// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostGameModal } from '../../src/components/PostGameModal';
import { I18nProvider } from '../../src/i18n';

describe('PostGameModal component', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders nothing when isOpen is false', () => {
    const { queryByTestId } = render(
      <PostGameModal
        isOpen={false}
        totalLevels={300}
        totalScore={15000}
        catVariant="black"
        onReplayLastLevel={vi.fn()}
        onResetProgress={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(queryByTestId('post-game-modal-backdrop')).toBeNull();
  });

  it('renders title, stats, and options when isOpen is true', () => {
    const { getByTestId, getByText } = render(
      <PostGameModal
        isOpen={true}
        totalLevels={300}
        totalScore={15000}
        catVariant="black"
        onReplayLastLevel={vi.fn()}
        onResetProgress={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getByTestId('post-game-modal-backdrop')).toBeTruthy();
    expect(getByText('¡Enhorabuena!')).toBeTruthy();
    expect(getByText('Has superado los 300 niveles de KittySquared.')).toBeTruthy();
    expect(getByText('Jugar Nivel 300')).toBeTruthy();
    expect(getByText('Reiniciar Progreso')).toBeTruthy();
    expect(getByText('Volver al Menú')).toBeTruthy();
    expect(getByTestId('replay-last-level-btn')).toBeTruthy();
    expect(getByTestId('postgame-reset-progress-btn')).toBeTruthy();
    expect(getByTestId('close-postgame-modal-btn')).toBeTruthy();
  });

  it('calls onReplayLastLevel when clicking replay button', () => {
    const handleReplay = vi.fn();
    const handleClose = vi.fn();

    const { getByTestId } = render(
      <PostGameModal
        isOpen={true}
        totalLevels={300}
        totalScore={15000}
        catVariant="black"
        onReplayLastLevel={handleReplay}
        onResetProgress={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.click(getByTestId('replay-last-level-btn'));
    expect(handleReplay).toHaveBeenCalledTimes(1);
  });

  it('opens confirmation dialog on reset click, cancels safely, and only calls onResetProgress on confirm', () => {
    const handleReset = vi.fn();
    const handleClose = vi.fn();

    const { getByTestId, queryByTestId, getByText } = render(
      <PostGameModal
        isOpen={true}
        totalLevels={300}
        totalScore={15000}
        catVariant="black"
        onReplayLastLevel={vi.fn()}
        onResetProgress={handleReset}
        onClose={handleClose}
      />
    );

    // Initial state: confirmation dialog is not open
    expect(queryByTestId('confirm-dialog-backdrop')).toBeNull();

    // Click "Reiniciar progreso desde cero"
    fireEvent.click(getByTestId('postgame-reset-progress-btn'));
    expect(getByTestId('confirm-dialog-backdrop')).toBeTruthy();
    expect(getByText('¿Reiniciar Todo el Progreso?')).toBeTruthy();

    // Click "Cancelar" in confirmation dialog
    fireEvent.click(getByTestId('confirm-dialog-cancel-btn'));
    expect(queryByTestId('confirm-dialog-backdrop')).toBeNull();
    expect(handleReset).not.toHaveBeenCalled();

    // Click reset again, this time confirm
    fireEvent.click(getByTestId('postgame-reset-progress-btn'));
    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking close button or pressing Escape', () => {
    const handleClose = vi.fn();

    const { getByTestId } = render(
      <PostGameModal
        isOpen={true}
        totalLevels={300}
        totalScore={15000}
        catVariant="black"
        onReplayLastLevel={vi.fn()}
        onResetProgress={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.click(getByTestId('close-postgame-modal-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('renders title, summary, buttons, and confirm dialog in English when wrapped in <I18nProvider lang="en">', () => {
    const handleReplay = vi.fn();
    const handleReset = vi.fn();
    const handleClose = vi.fn();

    const { getByTestId, getByText } = render(
      <I18nProvider lang="en">
        <PostGameModal
          isOpen={true}
          totalLevels={300}
          totalScore={15000}
          catVariant="black"
          onReplayLastLevel={handleReplay}
          onResetProgress={handleReset}
          onClose={handleClose}
        />
      </I18nProvider>
    );

    // Title and summary in English
    expect(getByText('Congratulations!')).toBeTruthy();
    expect(getByText('You have completed all 300 levels of KittySquared.')).toBeTruthy();

    // Replay button and description
    expect(getByText('Play Level 300')).toBeTruthy();
    expect(getByText('Replay the final challenge as many times as you like')).toBeTruthy();

    // Reset button and description
    expect(getByText('Reset Progress')).toBeTruthy();
    expect(getByText('Clear stars and start fresh from level 1')).toBeTruthy();

    // Close button
    expect(getByText('Back to Menu')).toBeTruthy();

    // Reset confirmation in English
    fireEvent.click(getByTestId('postgame-reset-progress-btn'));
    expect(getByTestId('confirm-dialog-backdrop')).toBeTruthy();
    expect(getByText('Reset All Progress?')).toBeTruthy();
    expect(
      getByText(
        'All completed levels, times, and unlocked kittens will be deleted. This action cannot be undone.'
      )
    ).toBeTruthy();
    expect(getByTestId('confirm-dialog-confirm-btn').textContent).toBe('Reset Progress');
    expect(getByTestId('confirm-dialog-cancel-btn').textContent).toBe('Cancel');

    // Confirming triggers reset
    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
