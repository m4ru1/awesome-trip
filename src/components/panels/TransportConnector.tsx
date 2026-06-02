import { useState, type ReactNode } from 'react'
import type { Transport, TransportMode } from '@/types'
import { TRANSPORT_META } from '@/data/constants'
import TransportModeRow from '@/components/panels/TransportModeRow'
import MiniEdit from '@/components/ui/MiniEdit'

interface Props {
  connector: Transport
  editable: boolean
  onSwitchAlt?: (idx: number) => void
  onSetMode?: (mode: string) => void
  onSetField?: (field: string, value: string) => void
  onAdd?: () => void
  onRemove?: () => void
  layout?: 'timeline' | 'grid'
}

export default function TransportConnector({
  connector,
  editable,
  onSwitchAlt,
  onSetMode,
  onSetField,
  onAdd,
  onRemove,
  layout,
}: Props): ReactNode {
  const [open, setOpen] = useState(false)
  const center = layout !== 'timeline'

  // Empty / unplanned transport
  if (!connector || !connector.primary) {
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

  const p = connector.primary
  const tm = TRANSPORT_META[p.mode] || { zh: p.mode, emoji: '•' }
  const alts = connector.alternatives || []
  const switchAlt = onSwitchAlt

  return (
    <div
      className={`connector ${layout === 'timeline' ? 'conn-timeline' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: center ? 'center' : 'flex-start',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="chip no-select"
        style={{
          border: '1.5px solid rgba(76,125,255,.3)',
          background: open ? 'var(--color-transport-soft)' : '#fff',
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
          {open ? '▲' : editable ? '⚙' : '▾'}
        </span>
      </button>

      {open && (
        <div
          className="float-in"
          style={{
            marginTop: 8,
            background: '#fff',
            borderRadius: 16,
            padding: 14,
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 8px 22px rgba(76,125,255,.18)',
            border: '1px solid rgba(76,125,255,.16)',
          }}
        >
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
            {p.distance && (
              <span>
                距离{' '}
                <b className="num" style={{ color: 'var(--color-ink)' }}>
                  {p.distance}
                </b>
              </span>
            )}
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
                onPick={(m: TransportMode) => onSetMode(m)}
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
                  onCommit={(v: string) => onSetField?.('duration', v)}
                />
                <MiniEdit
                  label="花费"
                  value={p.cost}
                  onCommit={(v: string) => onSetField?.('cost', v)}
                  width={86}
                />
                <span style={{ flex: 1 }} />
                {onRemove && (
                  <button
                    onClick={onRemove}
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
                  fontSize: 11,
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
                      onClick={() =>
                        editable && switchAlt && switchAlt(i)
                      }
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
                            fontSize: 11,
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
      )}
    </div>
  )
}
