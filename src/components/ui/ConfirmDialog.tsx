import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  /** Dialog title. */
  title: string;
  /** Body text. */
  body: string;
  /** Label for the confirm button. */
  confirmText: string;
  /** When true, the confirm button uses the danger / brand colour. */
  danger?: boolean;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Called when the user cancels (or clicks the backdrop). */
  onCancel: () => void;
}

/**
 * Modal confirmation dialog with a semi-transparent backdrop and a centred card.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmText,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactNode {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px 22px',
          maxWidth: 360,
          width: '90%',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        {/* Title */}
        <div
          className="title-cn"
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--color-ink)',
            marginBottom: 10,
          }}
        >
          {title}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--color-ink2)',
            lineHeight: 1.55,
            marginBottom: 22,
          }}
        >
          {body}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              background: danger ? 'var(--color-brand)' : 'var(--color-ink)',
              color: '#fff',
              boxShadow: danger
                ? '0 6px 16px rgba(255,107,92,.32)'
                : '0 6px 16px rgba(43,45,51,.2)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
