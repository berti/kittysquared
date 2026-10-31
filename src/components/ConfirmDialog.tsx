import { useEffect, useRef, useState } from 'preact/hooks';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  guardBackdropMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  icon,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  guardBackdropMs = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 300,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const prevIsOpenRef = useRef(isOpen);
  const [isEntering, setIsEntering] = useState(() => isOpen && guardBackdropMs > 0);

  if (!prevIsOpenRef.current && isOpen) {
    prevIsOpenRef.current = true;
    if (guardBackdropMs > 0 && !isEntering) {
      setIsEntering(true);
    }
  } else if (prevIsOpenRef.current && !isOpen) {
    prevIsOpenRef.current = false;
  }

  useEffect(() => {
    if (!isOpen) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (guardBackdropMs > 0) {
      setIsEntering(true);
      timer = setTimeout(() => {
        setIsEntering(false);
      }, guardBackdropMs);
    } else {
      setIsEntering(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, guardBackdropMs, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="confirm-dialog-backdrop"
      class="modal-backdrop-anim"
      onClick={(e) => {
        if (isEntering) return;
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(61, 49, 53, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        data-testid="confirm-dialog-card"
        class="modal-card-flyin"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          backgroundColor: '#FFFBF2',
          border: '4px solid #E2D6C1',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '340px',
          width: '100%',
          boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: isEntering ? 'none' : 'auto',
        }}
      >

        {icon && (
          <div style={{ fontSize: '32px', lineHeight: 1, userSelect: 'none' }}>
            {icon}
          </div>
        )}

        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#3D3135' }}>
          {title}
        </h3>

        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '13px',
            color: '#7A686E',
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {description}
        </p>

        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            type="button"
            data-testid="confirm-dialog-cancel-btn"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: '2px solid #E2D6C1',
              background: '#FFF',
              fontWeight: 800,
              fontSize: '13px',
              color: '#5C4B51',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            data-testid="confirm-dialog-confirm-btn"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              background: isDestructive ? '#EF4444' : '#F3722C',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: isDestructive ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(243, 114, 44, 0.3)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
