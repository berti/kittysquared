// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostGameModal } from '../../src/components/PostGameModal';

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
    expect(getByText('¡Juego completado!')).toBeTruthy();
    expect(getByText(/300 \/ 300/i)).toBeTruthy();
    expect(getByText(/15000 pts/i)).toBeTruthy();
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
    expect(getByText('¿Reiniciar progreso?')).toBeTruthy();

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
});
