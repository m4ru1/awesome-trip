import type { ReactNode, CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import type { Block, Mode } from '@/types'
import { TYPE_META } from '@/data/constants'
import TagRow from '@/components/ui/TagRow'

interface Props {
  block: Block
  mode: Mode
  onClick?: () => void
  compact?: boolean
  isDragging?: boolean
  nowState?: 'current' | 'past' | null
  style?: CSSProperties
  className?: string
  availableHeight?: number
}

export default function BlockCard({
  block,
  mode,
  onClick,
  compact = false,
  isDragging = false,
  nowState = null,
  style,
  className = '',
  availableHeight,
}: Props): ReactNode {
  const { enabled } = useAnimation()
  const meta = TYPE_META[block.type]
  const p = block.primary
  const altN = (block.alternatives ?? []).length
  const done = block.status === 'done'
  const skipped = block.status === 'skipped'
  const conflict = block.conflict
  const isNow = nowState === 'current'
  // mode is accepted as a prop for future use (e.g. conditional rendering)
  void mode

  const classes = [
    'block-card',
    'card-animated',
    `t-${block.type}`,
    isDragging ? 'dragging' : '',
    conflict ? 'conflict-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const mergedStyle: CSSProperties = {
    background: done || skipped ? '#FBF6EF' : '#fff',
    border: `2px solid ${isNow ? meta.color : 'transparent'}`,
    borderLeft: `5px solid ${meta.color}`,
    borderRadius: 16,
    padding: compact ? '9px 11px' : '12px 14px',
    boxShadow: isNow
      ? `0 8px 22px ${meta.color}40`
      : '0 5px 14px rgba(75,55,40,.09)',
    cursor: 'pointer',
    position: 'relative' as const,
    filter: done || skipped ? 'saturate(.45)' : 'none',
    opacity: skipped ? 0.6 : 1,
    transition:
      'transform .18s var(--ease-spring), box-shadow .2s',
    ...style,
  }

  return (
    <div className={classes} onClick={onClick} style={mergedStyle}>
      {/* Header: time + type indicator + alternatives badge */}
      {!compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 5,
          }}
        >
          <span
            className="num"
            style={{
              fontSize: 14,
              color: meta.color,
              fontWeight: 700,
            }}
          >
            {block.startTime}
            {block.endTime !== '次日' ? `–${block.endTime}` : ''}
          </span>
          <span style={{ flex: 1 }} />
          {isNow && (
            <span
              className="chip"
              style={{
                background: meta.color,
                color: '#fff',
                fontSize: 12,
                padding: '2px 8px',
              }}
            >
              进行中
            </span>
          )}
          {altN > 0 && (
            <span
              className="num"
              title={`有 ${altN} 个备选`}
              style={{
                background: meta.soft,
                color: meta.color,
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 99,
                padding: '1px 7px',
                border: `1.5px dashed ${meta.color}`,
              }}
            >
              +{altN}
            </span>
          )}
        </div>
      )}

      {/* Compact mode: type color dot + alternatives badge inline */}
      {compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 3,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: meta.color,
              display: 'inline-block',
            }}
          />
          {altN > 0 && (
            <span
              className="num"
              title={`有 ${altN} 个备选`}
              style={{
                background: meta.soft,
                color: meta.color,
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 99,
                padding: '1px 6px',
                border: `1.5px dashed ${meta.color}`,
              }}
            >
              +{altN}
            </span>
          )}
        </div>
      )}

      {/* Name row: emoji + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: compact ? 18 : 20,
            lineHeight: 1,
          }}
        >
          {p.emoji || meta.emoji}
        </span>
        <span
          className="clamp-2"
          style={{
            fontWeight: 700,
            fontSize: compact ? 13.5 : 14.5,
            lineHeight: 1.25,
            textDecoration: skipped ? 'line-through' : 'none',
          }}
        >
          {p.name}
        </span>
      </div>

      {/* Sub-info line */}
      {!compact && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--color-ink2)',
          }}
          className="clamp-1"
        >
          {block.type === 'meal' && p.perPersonCost
            ? `人均 ${p.perPersonCost}`
            : block.type === 'rest' && p.pricePerNight
              ? `${p.pricePerNight} / 晚`
              : p.ticketPrice
                ? p.ticketPrice
                : (p.address ?? '')}
        </div>
      )}

      {/* Tags */}
      {!compact && p.tags && p.tags.length > 0 && (
        <TagRow tags={p.tags} color={meta.color} />
      )}
      {compact && p.tags && p.tags.length > 0 && (availableHeight == null || availableHeight >= 80) && (
        <div style={{ marginTop: 2 }}>
          <TagRow tags={p.tags.slice(0, 3)} color={meta.color} />
        </div>
      )}

      {/* Done checkmark stamp */}
      <AnimatePresence>
      {done && (
        <motion.span
          key="check"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={enabled ? { type: 'spring', stiffness: 500, damping: 25 } : { duration: 0 }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: 99,
            background: '#15B8A6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            boxShadow: '0 3px 8px rgba(21,184,166,.4)',
          }}
        >
          ✓
        </motion.span>
      )}
      </AnimatePresence>

      {/* Conflict warning */}
      {conflict && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--color-brand)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ⚠️ {conflict.msg}
        </div>
      )}
    </div>
  )
}
