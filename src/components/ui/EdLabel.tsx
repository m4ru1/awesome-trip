import type { ReactNode } from 'react';

interface EdLabelProps {
  /** Field label text. */
  label: string;
  /** Optional hint rendered below the label in a lighter colour. */
  hint?: string;
}

/**
 * Label with optional hint text for editor form fields.
 */
export default function EdLabel({ label, hint }: EdLabelProps): ReactNode {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-ink)',
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--color-ink3)',
            marginTop: 2,
            lineHeight: 1.35,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
