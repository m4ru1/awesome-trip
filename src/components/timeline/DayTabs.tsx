import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import type { Trip } from '@/types'

interface Props {
  trip: Trip
  activeIdx: number
  onPick: (idx: number) => void
  onAddDay?: () => void
  onDayHeaderClick?: (idx: number) => void
  editable?: boolean
}

export default function DayTabs({
  trip,
  activeIdx,
  onPick,
  onAddDay,
  onDayHeaderClick,
  editable = false,
}: Props): ReactNode {
  const { enabled } = useAnimation()

  return (
    <div
      className="no-select"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-line)',
        background: 'var(--color-paper)',
      }}
    >
      <div style={{
        position: 'sticky',
        right: 0,
        flexShrink: 0,
        alignSelf: 'stretch',
        width: 28,
        marginLeft: -28,
        background: 'linear-gradient(to right, transparent, var(--color-paper))',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      {trip.days.map((day, di) => {
        const active = di === activeIdx
        return (
          <div
            key={day.id}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <button
              onClick={() => onPick(di)}
              style={{
                border: 'none',
                cursor: 'pointer',
                borderRadius: 14,
                padding: '7px 13px',
                textAlign: 'center',
                background: active ? 'transparent' : '#fff',
                color: active ? '#fff' : 'var(--color-ink)',
                fontFamily: 'var(--font-cn-body)',
                position: 'relative',
                transition: enabled ? 'color .15s ease' : 'all .2s var(--ease-spring)',
                overflow: 'hidden',
              }}
            >
              {active && (
                <motion.div
                  layoutId={enabled ? 'day-tab-indicator' : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 14,
                    background: 'var(--color-brand)',
                    boxShadow: '0 6px 14px rgba(255,107,92,.3)',
                    zIndex: 0,
                  }}
                />
              )}
              {!active && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 14,
                  background: '#fff',
                  boxShadow: 'var(--shadow-soft)',
                  zIndex: 0,
                }} />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                }}
              >
                DAY {di + 1}
              </div>
              {day.subtitle ? (
                <>
                  <div
                    className="clamp-1"
                    title={day.subtitle}
                    style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}
                  >
                    {day.subtitle}
                  </div>
                  <div
                    className="num"
                    style={{ fontSize: 11, opacity: active ? 0.8 : 0.55 }}
                  >
                    {day.dateLabel} {day.weekday}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="num"
                    style={{ fontWeight: 700, fontSize: 13.5 }}
                  >
                    {day.dateLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: active ? 0.9 : 0.6,
                    }}
                  >
                    {day.weekday} {day.weatherIcon}
                  </div>
                </>
              )}
              </div>
            </button>
            {onDayHeaderClick && (
              <button
                onClick={e => { e.stopPropagation(); onDayHeaderClick(di) }}
                title="编辑天气"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.04)',
                  color: active ? '#fff' : 'var(--color-ink2)',
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                ✎
              </button>
            )}
          </div>
        )
      })}

      {editable && onAddDay && (
        <button
          onClick={onAddDay}
          title="加一天"
          style={{
            flexShrink: 0,
            border: '1.5px dashed #D8C7B2',
            cursor: 'pointer',
            borderRadius: 14,
            padding: '0 15px',
            background: 'rgba(255,255,255,.6)',
            color: 'var(--color-ink2)',
            fontFamily: 'var(--font-cn-body)',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          <div style={{ fontSize: 18 }}>＋</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>加一天</div>
        </button>
      )}
    </div>
  )
}
