import type { ReactNode } from 'react';

interface BudgetDotsProps {
  /** Budget level from 1 (cheap) to 3 (expensive). */
  level: 1 | 2 | 3;
}

/**
 * Shows up to 3 money-bag emojis. Active ones are full-opacity; the rest are dimmed.
 */
export default function BudgetDots({ level }: BudgetDotsProps): ReactNode {
  return (
    <span title={`预算 ${level}/3`} style={{ letterSpacing: 1 }}>
      {'💰'.repeat(level)}
      <span style={{ opacity: 0.25 }}>{'💰'.repeat(3 - level)}</span>
    </span>
  );
}
