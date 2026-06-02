import type { ReactNode } from 'react';
import MiniChip from './MiniChip';

interface TagRowProps {
  /** List of tag strings to display. */
  tags: string[];
  /** Optional colour passed through to each MiniChip. */
  color?: string;
}

/**
 * Horizontal list of MiniChip tags, wrapping as needed.
 */
export default function TagRow({ tags, color }: TagRowProps): ReactNode {
  if (!tags || !tags.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {tags.map((t, i) => (
        <MiniChip key={i} color={color}>
          {t}
        </MiniChip>
      ))}
    </div>
  );
}
