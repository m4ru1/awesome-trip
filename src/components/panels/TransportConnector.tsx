import { useState, type ReactNode } from 'react'
import type { Transport, TransportMode } from '@/types'
import { TRANSPORT_META } from '@/data/constants'
import TransportModeRow from '@/components/panels/TransportModeRow'
import MiniEdit from '@/components/ui/MiniEdit'

interface Props {
  connectors: Transport[]
  editable: boolean
  onSwitchAlt?: (segIdx: number, altIdx: number) => void
  onSetMode?: (segIdx: number, mode: string) => void
  onSetField?: (segIdx: number, field: string, value: string) => void
  onAdd?: () => void
  onRemove?: (segIdx: number) => void
  onReorder?: (fromIdx: number, toIdx: number) => void
  layout?: 'timeline' | 'grid'
}

function SegmentDetail({
  segment,
  segIdx,
  editable,
  total,
  onSetMode,
  onSetField,
  onSwitchAlt,
  onRemove,
  onClose,
}: {
  segment: Transport
  segIdx: number
  editable: boolean
  total: number
  onSetMode?: (segIdx: number, mode: string) => void
  onSetField?: (segIdx: number, field: string, value: string) => void
  onSwitchAlt?: (segIdx: number, altIdx: number) => void
  onRemove?: (segIdx: number) => void
  onClose: () => void
}): ReactNode {
  const p = segment.primary
  const alts = segment.alternatives || []
  const switchAlt = onSwitchAlt

  return (
    <div
      className="float-in"
      style={{
        marginTop: 8,
        background: '#fff',
        borderRadius: 14,
        padding: 12,
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 4px 14px rgba(76,125,255,.16)',
        border: '1px solid rgba(76,125,255,.12)',
      }}
    >
      {/* Header row with segment indicator + close button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--color-ink3)', fontWeight: 600 }}>
          第 {segIdx + 1}/{total} 段
        </span>
        <button
          onClick={onClose}
          className="chip"
          style={{
            fontSize: 12,
            cursor: 'pointer',
            padding: '3px 8px',
            border: '1px solid var(--color-line)',
            background: 'var(--color-paper)',
            color: 'var(--color-ink2)',
          }}
        >
          收起 ▲
        </button>
      </div>

      {/* Duration / Cost / Distance summary */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          fontSize: 12.5,
          color: 'var(--color-ink2)',
          marginBottom: p.note ? 8 : 0,
        }}
      >
        <span>
          耗时{' '}
          <b className="num" style={{ color: 'var(--color-ink)' }}>
            {p.duration}
          </b>
        </span>
        <span>
          花费{' '}
          <b className="num" style={{ color: 'var(--color-ink)' }}>
            {p.cost}
          </b>
        </span>
        {p.distance ? (
          <span>
            距离{' '}
            <b className="num" style={{ color: 'var(--color-ink)' }}>
              {p.distance}
            </b>
          </span>
        ) : null}
      </div>

      {/* Note callout */}
      {p.note && (
        <div
          style={{
            fontSize: 12.5,
            color: '#3A63CC',
            background: 'var(--color-transport-soft)',
            borderRadius: 10,
            padding: '7px 10px',
            lineHeight: 1.5,
          }}
        >
          💡 {p.note}
        </div>
      )}

      {/* Editable mode picker + fields */}
      {editable && onSetMode ? (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-ink2)',
              marginBottom: 7,
              fontWeight: 700,
            }}
          >
            换一种走法
          </div>
          <TransportModeRow
            current={p.mode}
            onPick={(m: TransportMode) => onSetMode(segIdx, m)}
          />
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 11,
              alignItems: 'flex-end',
            }}
          >
            <MiniEdit
              label="耗时"
              value={p.duration}
              onCommit={(v: string) => onSetField?.(segIdx, 'duration', v)}
            />
            <MiniEdit
              label="花费"
              value={p.cost}
              onCommit={(v: string) => onSetField?.(segIdx, 'cost', v)}
              width={86}
            />
            <span style={{ flex: 1 }} />
            {onRemove && (
              <button
                onClick={() => onRemove(segIdx)}
                className="btn"
                style={{
                  background: 'rgba(255,107,92,.1)',
                  color: 'var(--color-brand)',
                  padding: '8px 11px',
                  fontSize: 12.5,
                }}
              >
                移除
              </button>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-ink3)',
              marginTop: 8,
            }}
          >
            改耗时会自动顺移当天后面的行程
          </div>
        </div>
      ) : null}

      {/* Alternative transport cards */}
      {alts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-ink2)',
              marginBottom: 7,
            }}
          >
            推荐方案
            {editable ? '（点选即切换并重算时间）' : ''}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {alts.map((a, i) => {
              const am = TRANSPORT_META[a.mode] || {
                zh: a.mode,
                emoji: '•',
              }
              return (
                <button
                  key={i}
                  disabled={!editable}
                  onClick={() => editable && switchAlt && switchAlt(segIdx, i)}
                  style={{
                    flexShrink: 0,
                    minWidth: 120,
                    textAlign: 'left',
                    cursor: editable ? 'pointer' : 'default',
                    background: 'var(--color-paper)',
                    border: '1.5px solid var(--color-line)',
                    borderRadius: 12,
                    padding: '8px 10px',
                    fontFamily: 'var(--font-cn-body)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {am.emoji} {am.zh}
                  </div>
                  <div
                    className="num"
                    style={{
                      fontSize: 12,
                      color: 'var(--color-ink2)',
                      marginTop: 3,
                    }}
                  >
                    {a.duration} · {a.cost}
                  </div>
                  {a.note && (
                    <div
                      className="clamp-1"
                      style={{
                        fontSize: 12,
                        color: 'var(--color-ink3)',
                        marginTop: 3,
                      }}
                    >
                      {a.note}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TransportConnector({
  connectors,
  editable,
  onSwitchAlt,
  onSetMode,
  onSetField,
  onAdd,
  onRemove,
  onReorder,
  layout,
}: Props): ReactNode {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const center = layout !== 'timeline'
  const valid = connectors.filter(c => c && c.primary)

  // Empty / unplanned transport
  if (valid.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: center ? 'center' : 'flex-start',
          padding: layout === 'timeline' ? '2px 0' : 0,
        }}
      >
        {editable && onAdd ? (
          <button
            onClick={onAdd}
            className="chip no-select"
            style={{
              background: '#fff',
              color: 'var(--color-transport)',
              border: '1.5px dashed rgba(76,125,255,.5)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ＋ 加一段交通
          </button>
        ) : (
          <span
            className="chip"
            style={{
              background: 'var(--color-paper2)',
              color: 'var(--color-ink3)',
              border: '1.5px dashed var(--color-line)',
            }}
          >
            交通待规划
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: center ? 'center' : 'flex-start',
        width: '100%',
      }}
    >
      {valid.map((seg, idx) => {
        const p = seg.primary
        const tm = TRANSPORT_META[p.mode] || { zh: p.mode, emoji: '•' }
        const isOpen = openIdx === idx
        const isFirst = idx === 0
        const isLast = idx === valid.length - 1

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: center ? 'center' : 'flex-start',
              width: '100%',
            }}
          >
            {/* Arrow connector between segments */}
            {!isFirst && (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-transport)',
                  opacity: 0.5,
                  padding: '1px 0',
                  fontWeight: 700,
                }}
              >
                ↓
              </div>
            )}

            {/* Segment chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="chip no-select"
                style={{
                  border: '1.5px solid rgba(76,125,255,.3)',
                  background: isOpen ? 'var(--color-transport-soft)' : '#fff',
                  color: 'var(--color-transport)',
                  cursor: 'pointer',
                  boxShadow: '0 3px 9px rgba(76,125,255,.16)',
                  fontSize: 12.5,
                  padding: '5px 11px',
                }}
              >
                {tm.emoji} {tm.zh} ·{' '}
                <span className="num">{p.duration}</span> ·{' '}
                <span className="num">{p.cost}</span>
                <span style={{ opacity: 0.6, marginLeft: 2 }}>
                  {isOpen ? '▲' : editable ? '⚙' : '▾'}
                </span>
              </button>

              {/* Reorder buttons */}
              {editable && onReorder && valid.length > 1 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    disabled={isFirst}
                    onClick={() => onReorder(idx, idx - 1)}
                    className="chip"
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      cursor: isFirst ? 'default' : 'pointer',
                      opacity: isFirst ? 0.3 : 0.7,
                      border: '1px solid var(--color-line)',
                      background: '#fff',
                      color: 'var(--color-ink2)',
                    }}
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => onReorder(idx, idx + 1)}
                    className="chip"
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      cursor: isLast ? 'default' : 'pointer',
                      opacity: isLast ? 0.3 : 0.7,
                      border: '1px solid var(--color-line)',
                      background: '#fff',
                      color: 'var(--color-ink2)',
                    }}
                    title="下移"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>

            {/* Expanded detail panel */}
            {isOpen && (
              <SegmentDetail
                segment={seg}
                segIdx={idx}
                editable={editable}
                total={valid.length}
                onSetMode={onSetMode}
                onSetField={onSetField}
                onSwitchAlt={onSwitchAlt}
                onRemove={onRemove}
                onClose={() => setOpenIdx(null)}
              />
            )}
          </div>
        )
      })}

      {/* Add segment button at chain end */}
      {editable && onAdd && (
        <button
          onClick={onAdd}
          className="chip no-select"
          style={{
            marginTop: 6,
            background: '#fff',
            color: 'var(--color-transport)',
            border: '1.5px dashed rgba(76,125,255,.4)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          ＋ 加一段
        </button>
      )}
    </div>
  )
}
