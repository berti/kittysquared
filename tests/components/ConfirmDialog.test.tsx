// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { RestartIcon } from '../../src/components/Icons';

describe('ConfirmDialog component', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="¿Reiniciar nivel?"
        description="Se borrarán las marcas"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, description, custom SVG icon, and buttons when isOpen is true', () => {
    const { getByRole, getByText, getByTestId } = render(
      <ConfirmDialog
        isOpen={true}
        title="¿Reiniciar nivel?"
        description="Se borrarán las marcas actuales"
        icon={<RestartIcon size={28} />}
        confirmText="Reiniciar nivel"
        cancelText="Volver"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(getByRole('dialog')).toBeDefined();
    expect(getByText('¿Reiniciar nivel?')).toBeDefined();
    expect(getByText('Se borrarán las marcas actuales')).toBeDefined();
    expect(getByTestId('icon-restart')).toBeDefined();
    expect(getByText('Reiniciar nivel')).toBeDefined();
    expect(getByText('Volver')).toBeDefined();
  });

  it('renders default WarningIcon when icon prop is omitted', () => {
    const { getByTestId } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        description="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(getByTestId('icon-warning')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(getByTestId('confirm-dialog-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button or backdrop is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        description="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(getByTestId('confirm-dialog-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTestId('confirm-dialog-backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm action"
        description="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
