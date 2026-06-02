import { useState, type ReactNode } from 'react'
import type { Block } from '@/types'
import { TYPE_META } from '@/data/constants'
import ImageTile from '@/components/ui/ImageTile'
import ScenarioChip from '@/components/ui/ScenarioChip'

interface Props {
  block: Block
  editable: boolean
  onSetPrimary: (altIdx: number) => void
  onEditAlt?: (altIdx: number) => void
  onDeleteAlt?: (altIdx: number) => void
  onAddAlt?: () => void
}

export default function AlternativeDeck({
  block,
  editable,
  onSetPrimary,
  onEditAlt,
  onDeleteAlt,
  onAddAlt,
}: Props): ReactNode {
  const alts = block.alternatives || []
  const [flipping, setFlipping] = useState(false)
  const m = TYPE_META[block.type]

  function pick(i: number) {
    if (!editable) return
    setFlipping(true)
    setTimeout(() => {
      onSetPrimary(i)
      setFlipping(false)
    }, 220)
  }

  if (!alts.length && !editable) return null

  return (
    <div style={{ marginTop: 18 }}>
      {/* Section heading + count badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{ fontWeight: 800, fontSize: 14 }}
          className="title-cn"
        >
          备选方案
        </span>
        {alts.length > 0 && (
          <span
            className="num"
            style={{
              background: m.soft,
              color: m.color,
              borderRadius: 99,
              padding: '1px 8px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {alts.length}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--color-ink3)' }}>
          {editable
            ? alts.length
              ? '点「设为主选」即换'
              : '存几个候选，遇到雨天 / 想省钱随手换'
            : '查看备选'}
        </span>
      </div>

      {/* Alternative cards */}
      <div
        className={flipping ? 'flip-swap' : ''}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {alts.map((a, i) => (
          <div
            key={a.id || i}
            className={`t-${block.type}`}
            style={{
              border: `1.5px dashed ${m.color}`,
              background: m.soft,
              borderRadius: 16,
              padding: 12,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ width: 54, height: 54, flexShrink: 0 }}>
              <ImageTile
                type={block.type}
                emoji={a.emoji}
                height={54}
                radius={12}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 3,
                  flexWrap: 'wrap',
                }}
              >
                {a.swapReason && (
                  <ScenarioChip reason={a.swapReason} small />
                )}
              </div>
              <div
                style={{ fontWeight: 700, fontSize: 14 }}
                className="clamp-1"
              >
                {a.emoji} {a.name}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--color-ink2)',
                  marginTop: 2,
                }}
                className="clamp-2"
              >
                {a.highlight}
              </div>
              <div
                className="num"
                style={{
                  fontSize: 11.5,
                  color: m.color,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {a.perPersonCost
                  ? `人均 ${a.perPersonCost}`
                  : a.ticketPrice
                    ? a.ticketPrice
                    : a.pricePerNight
                      ? `${a.pricePerNight}/晚`
                      : ''}
                {a.suggestedDuration ? ` · ${a.suggestedDuration}` : ''}
              </div>
              {editable && (
                <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
                  <button
                    onClick={() => pick(i)}
                    className="btn"
                    style={{
                      fontSize: 12.5,
                      padding: '7px 12px',
                      background: '#fff',
                      color: m.color,
                      boxShadow: `0 3px 8px ${m.color}22`,
                    }}
                  >
                    设为主选
                  </button>
                  <button
                    onClick={() => onEditAlt?.(i)}
                    title="编辑备选"
                    className="btn"
                    style={{
                      fontSize: 12.5,
                      padding: '7px 10px',
                      background: '#fff',
                      color: 'var(--color-ink2)',
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteAlt?.(i)}
                    title="删除备选"
                    className="btn"
                    style={{
                      fontSize: 12.5,
                      padding: '7px 10px',
                      background: '#fff',
                      color: 'var(--color-brand)',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add alternative button */}
      {editable && (
        <button
          onClick={onAddAlt}
          style={{
            width: '100%',
            marginTop: 10,
            cursor: 'pointer',
            border: `1.5px dashed ${m.color}`,
            borderRadius: 14,
            background: '#fff',
            color: m.color,
            fontFamily: 'var(--font-cn-body)',
            fontWeight: 700,
            fontSize: 13.5,
            padding: '11px 0',
          }}
        >
          ＋ 加一个备选
        </button>
      )}
    </div>
  )
}
