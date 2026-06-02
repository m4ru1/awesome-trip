import type { ReactNode } from 'react';

export type ScenarioReason = 'rain' | 'save' | 'time' | 'closed' | 'like';

/** Metadata for each scenario reason shown in swap / alternative cards. */
export const SCENARIO_META: Record<ScenarioReason, { emoji: string; zh: string; color: string }> = {
  rain:  { emoji: '☔', zh: '雨天',   color: '#5B9BD5' },
  save:  { emoji: '💰', zh: '平价',   color: '#F5A300' },
  time:  { emoji: '🕒', zh: '时间紧', color: '#7C6BFF' },
  closed:{ emoji: '🔒', zh: '闭馆',   color: '#E74C3C' },
  like:  { emoji: '❤️', zh: '想换换', color: '#FF6B81' },
};

interface ScenarioChipProps {
  reason: ScenarioReason;
  /** When true, renders a smaller variant. */
  small?: boolean;
}

/**
 * Coloured scenario badge with emoji + Chinese label, used in alternative suggestions.
 */
export default function ScenarioChip({ reason, small }: ScenarioChipProps): ReactNode {
  const s = SCENARIO_META[reason];
  if (!s) return null;
  return (
    <span
      className="chip"
      style={{
        background: s.color,
        color: '#fff',
        fontSize: small ? 11.5 : 12.5,
        boxShadow: `0 2px 6px ${s.color}55`,
      }}
    >
      {s.emoji} {s.zh}
    </span>
  );
}
