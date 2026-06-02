import type { ReactNode } from 'react';

interface MiniChipProps {
  children: ReactNode;
  /** Optional text colour override. Defaults to `var(--color-ink2)`. */
  color?: string;
}

/**
 * Small pill-shaped chip for tags, labels, and inline badges.
 */
export default function MiniChip({ children, color }: MiniChipProps): ReactNode {
  return (
    <span
      className="chip"
      style={{
        background: 'var(--color-paper2)',
        color: color || 'var(--color-ink2)',
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}
