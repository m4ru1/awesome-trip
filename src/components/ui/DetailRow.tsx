import type { ReactNode } from 'react';

interface DetailRowProps {
  label: string;
  value?: ReactNode;
  icon?: string;
  children?: ReactNode;
}

export default function DetailRow({ label, value, icon, children }: DetailRowProps): ReactNode {
  const content = value ?? children ?? '—'
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '9px 0',
        borderBottom: '1px solid var(--color-line)',
      }}
    >
      <span
        style={{
          width: 76,
          flexShrink: 0,
          color: 'var(--color-ink2)',
          fontSize: 13,
        }}
      >
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {label}
      </span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>
        {content}
      </span>
    </div>
  );
}
