import type { CSSProperties, ReactNode } from 'react';
import type { ActivityType } from './TypeTag';
import { TYPE_META } from './TypeTag';

/** Allow CSS custom properties in the style object. */
type CustomCSS = CSSProperties & Record<`--${string}`, string | undefined>;

interface ImageTileProps {
  /** Activity type — determines the background tint and fallback emoji. */
  type: ActivityType;
  /** Emoji to display (typically the option's own emoji). */
  emoji: string;
  /** Tile height in pixels. Defaults to 96. */
  height?: number;
  /** Border radius in pixels. Defaults to 14. */
  radius?: number;
}

/**
 * Placeholder image tile with diagonal stripe background, a large emoji, and a "PHOTO" label.
 * Relies on the `.img-placeholder` and `t-{type}` CSS classes defined in `index.css`.
 */
export default function ImageTile({ type, emoji, height = 96, radius = 14 }: ImageTileProps): ReactNode {
  const m = TYPE_META[type];
  const emojiSize = Math.min(height * 0.5, 56);

  return (
    <div
      className={`img-placeholder t-${type}`}
      style={{
        height,
        borderRadius: radius,
        position: 'relative',
        overflow: 'hidden',
        '--tc-soft': m.soft,
      } as CustomCSS}
    >
      <span
        style={{
          fontSize: emojiSize,
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.12))',
        }}
      >
        {emoji || m.emoji}
      </span>
      <span
        className="num"
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontSize: 11,
          fontFamily: 'var(--font-num)',
          color: m.color,
          opacity: 0.7,
          fontWeight: 600,
        }}
      >
        PHOTO
      </span>
    </div>
  );
}
