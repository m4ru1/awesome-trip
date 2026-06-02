import type { ReactNode } from 'react';

/** Activity type identifiers used throughout the app. */
export type ActivityType = 'sight' | 'meal' | 'rest' | 'transport' | 'free';

/** Metadata for each activity type: emoji, Chinese label, accent colour, and soft background. */
export const TYPE_META: Record<ActivityType, { emoji: string; zh: string; color: string; soft: string }> = {
  sight:     { emoji: '🏯', zh: '景点', color: 'var(--color-sight)',     soft: 'var(--color-sight-soft)' },
  meal:      { emoji: '🍜', zh: '美食', color: 'var(--color-meal)',      soft: 'var(--color-meal-soft)' },
  rest:      { emoji: '🏨', zh: '住宿', color: 'var(--color-rest)',      soft: 'var(--color-rest-soft)' },
  transport: { emoji: '🚗', zh: '交通', color: 'var(--color-transport)', soft: 'var(--color-transport-soft)' },
  free:      { emoji: '🎉', zh: '自由', color: 'var(--color-free)',      soft: 'var(--color-free-soft)' },
};

interface TypeTagProps {
  type: ActivityType;
}

/**
 * Coloured chip that identifies an activity type.
 * Renders the type emoji + Chinese label on a soft background.
 */
export default function TypeTag({ type }: TypeTagProps): ReactNode {
  const m = TYPE_META[type];
  return (
    <span
      className="chip"
      style={{ background: m.soft, color: m.color }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 99,
          background: m.color,
          display: 'inline-block',
        }}
      />
      {m.emoji} {m.zh}
    </span>
  );
}
