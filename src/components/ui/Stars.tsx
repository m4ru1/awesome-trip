import type { ReactNode } from 'react';

interface StarsProps {
  /** Rating value from 0 to 5. */
  value: number;
}

/**
 * Displays a row of filled / empty star emojis with the numeric score.
 */
export default function Stars({ value }: StarsProps): ReactNode {
  const full = Math.round(value);
  return (
    <span
      className="num"
      style={{ color: '#F5A300', fontWeight: 700, fontSize: 13 }}
    >
      {'★'.repeat(full)}
      <span style={{ color: '#E7DBCB' }}>{'★'.repeat(5 - full)}</span>
      <span style={{ color: 'var(--color-ink2)', marginLeft: 5 }}>
        {value}
      </span>
    </span>
  );
}
