import { useState, useCallback, type ReactNode } from 'react'
import type { Trip, Mode } from '@/types'
import { SCALE, TRANSPORT_META } from '@/data/constants'
import { toMin } from '@/utils/time'
import BlockCard from '@/components/cards/BlockCard'

interface Props {
  trip: Trip
  mode: Mode
  onOpenBlock: (dayIdx: number, blockIdx: number) => void
  onMoveBlock: (src: { dayIdx: number; blockIdx: number }, targetDayIdx: number, dropMin: number) => void
  onAddBlock: (dayIdx: number) => void
  onAddDay: () => void
  onDayHeaderClick: (dayIdx: number) => void
  nowInfo: { dayIdx: number; min: number; blockIdx: number | null; nextBlockIdx: number | null } | null
}

/* ---------- helpers ---------- */

function computeRange(trip: Trip) {
  let min = 24 * 60
  let max = 0
  trip.days.forEach(day =>
    day.blocks.forEach(b => {
      const s = toMin(b.startTime)
      if (s != null) { min = Math.min(min, s) }
      const e = toMin(b.endTime)
      if (e != null) { max = Math.max(max, e) }
      else if (b.endTime === '次日' && s != null) { max = Math.max(max, s + 60) }
    }),
  )
  min = Math.floor(min / 60) * 60 - 30
  max = Math.ceil(max / 60) * 60 + 10
  return { start: Math.max(0, min), end: max }
}

/* ---------- component ---------- */

export default function ScheduleGrid({
  trip,
  mode,
  onOpenBlock,
  onMoveBlock,
  onAddBlock,
  onAddDay,
  onDayHeaderClick,
  nowInfo,
}: Props): ReactNode {
  const { start: rangeStart, end: rangeEnd } = computeRange(trip)
  const totalMin = rangeEnd - rangeStart
  const height = totalMin * SCALE

  const [dragSrc, setDragSrc] = useState<{ dayIdx: number; blockIdx: number } | null>(null)
  const [dropDay, setDropDay] = useState<number | null>(null)
  const editable = mode === 'plan'

  /* hour marks */
  const hours: number[] = []
  for (let h = Math.ceil(rangeStart / 60); h <= Math.floor(rangeEnd / 60); h++) hours.push(h)

  const yOf = (min: number): number => (min - rangeStart) * SCALE

  /* drag-and-drop handlers */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dayIdx: number) => {
      e.preventDefault()
      setDropDay(null)
      if (!dragSrc) return
      const rect = e.currentTarget.getBoundingClientRect()
      const dropMin = rangeStart + (e.clientY - rect.top) / SCALE
      onMoveBlock(dragSrc, dayIdx, dropMin)
      setDragSrc(null)
    },
    [dragSrc, rangeStart, onMoveBlock],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dayIdx: number) => {
      if (editable && dragSrc) {
        e.preventDefault()
        setDropDay(dayIdx)
      }
    },
    [editable, dragSrc],
  )

  const handleDragLeave = useCallback(
    (dayIdx: number) => {
      setDropDay(d => (d === dayIdx ? null : d))
    },
    [],
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dayIdx: number, blockIdx: number) => {
      setDragSrc({ dayIdx, blockIdx })
      e.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const handleDragEnd = useCallback(() => {
    setDragSrc(null)
    setDropDay(null)
  }, [])

  /* grid template columns */
  const gridCols = `58px repeat(${trip.days.length}, minmax(186px, 240px))${editable ? ' 66px' : ''}`
  const gridMinWidth = 58 + trip.days.length * 200 + (editable ? 66 : 0)

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 18px 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          minWidth: gridMinWidth,
          position: 'relative' as const,
        }}
      >
        {/* ---- sticky column headers ---- */}

        {/* gutter header placeholder */}
        <div
          style={{
            position: 'sticky' as const,
            top: 0,
            zIndex: 20,
            background: 'var(--paper)',
            height: 88,
          }}
        />

        {/* day headers */}
        {trip.days.map((day, di) => (
          <div
            key={day.id}
            onClick={() => onDayHeaderClick(di)}
            style={{
              position: 'sticky' as const,
              top: 0,
              zIndex: 20,
              padding: '10px 8px 8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '9px 12px',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                border:
                  nowInfo && nowInfo.dayIdx === di
                    ? '2px solid var(--brand)'
                    : '2px solid transparent',
              }}
            >
              {/* day badge */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'var(--paper-2)',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--ink-2)',
                    fontWeight: 700,
                  }}
                >
                  DAY
                </span>
                <span
                  className="num"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--brand)',
                  }}
                >
                  {di + 1}
                </span>
              </div>
              {/* date + weather */}
              <div style={{ minWidth: 0 }}>
                <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>
                  {day.dateLabel}{' '}
                  <span
                    style={{
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-cn-body)',
                      fontSize: 12,
                    }}
                  >
                    {day.weekday}
                  </span>
                </div>
                {day.subtitle && (
                  <div
                    className="clamp-1"
                    title={day.subtitle}
                    style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-cn-body)', marginTop: 1 }}
                  >
                    {day.subtitle}
                  </div>
                )}
                <div
                  style={{ fontSize: 11.5, color: 'var(--ink-2)' }}
                  className="clamp-1"
                >
                  {day.weatherIcon}{day.weatherHint ? ` ${day.weatherHint}` : ''}{day.temperature != null ? ` ${day.temperature}°C` : ''}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* add-day column header */}
        {editable && (
          <div
            style={{
              position: 'sticky' as const,
              top: 0,
              zIndex: 20,
              padding: '10px 6px 8px',
            }}
          >
            <button
              onClick={onAddDay}
              title="加一天"
              style={{
                width: '100%',
                height: 56,
                border: '1.5px dashed #D8C7B2',
                cursor: 'pointer',
                borderRadius: 16,
                background: 'rgba(255,255,255,.6)',
                color: 'var(--ink-2)',
                fontFamily: 'var(--font-cn-body)',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              <div style={{ fontSize: 18 }}>+</div>
              <div style={{ fontSize: 10 }}>加一天</div>
            </button>
          </div>
        )}

        {/* ---- time gutter ---- */}
        <div style={{ position: 'relative' as const, height }}>
          {hours.map(h => (
            <div
              key={h}
              className="num"
              style={{
                position: 'absolute' as const,
                top: yOf(h * 60) - 7,
                right: 8,
                fontSize: 11.5,
                color: 'var(--ink-3)',
                fontWeight: 600,
              }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* ---- day columns ---- */}
        {trip.days.map((day, di) => (
          <div
            key={day.id}
            onDragOver={e => handleDragOver(e, di)}
            onDragLeave={() => handleDragLeave(di)}
            onDrop={e => handleDrop(e, di)}
            className={dropDay === di ? 'drop-target' : ''}
            style={{
              position: 'relative' as const,
              height,
              padding: '0 7px',
              borderLeft: '1px solid var(--line)',
            }}
          >
            {/* hour dashed lines */}
            {hours.map(h => (
              <div
                key={h}
                style={{
                  position: 'absolute' as const,
                  left: 0,
                  right: 0,
                  top: yOf(h * 60),
                  borderTop: '1px dashed var(--line)',
                  opacity: 0.7,
                }}
              />
            ))}

            {/* now red line (execute mode) */}
            {nowInfo &&
              nowInfo.dayIdx === di &&
              nowInfo.min >= rangeStart &&
              nowInfo.min <= rangeEnd && (
                <div
                  style={{
                    position: 'absolute' as const,
                    left: -2,
                    right: -2,
                    top: yOf(nowInfo.min),
                    zIndex: 15,
                    height: 0,
                    borderTop: '2px solid var(--brand)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute' as const,
                      left: -4,
                      top: -5,
                      width: 10,
                      height: 10,
                      borderRadius: 99,
                      background: 'var(--brand)',
                      boxShadow: '0 0 0 3px rgba(255,107,92,.25)',
                    }}
                  />
                </div>
              )}

            {/* blocks */}
            {day.blocks.map((b, bi) => {
              const sMin = toMin(b.startTime)
              const eMin =
                b.endTime === '次日'
                  ? Math.min(rangeEnd, (sMin ?? 0) + 75)
                  : toMin(b.endTime)

              // guard against null times
              if (sMin == null || eMin == null) return null

              const top = yOf(sMin)
              const h = Math.max(58, (eMin - sMin) * SCALE - 6)

              const isNow =
                nowInfo &&
                nowInfo.dayIdx === di &&
                nowInfo.min >= sMin &&
                nowInfo.min < (toMin(b.endTime) ?? sMin + 75)

              return (
                <div
                  key={b.id}
                  draggable={editable}
                  onDragStart={e => handleDragStart(e, di, bi)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'absolute' as const,
                    top,
                    left: 7,
                    right: 7,
                    height: h,
                  }}
                >
                  <BlockCard
                    block={b}
                    mode={mode}
                    compact
                    onClick={() => onOpenBlock(di, bi)}
                    isDragging={
                      dragSrc != null &&
                      dragSrc.dayIdx === di &&
                      dragSrc.blockIdx === bi
                    }
                    nowState={isNow ? 'current' : null}
                    style={{ height: '100%', overflow: 'hidden' }}
                  />

                  {/* transport chip between blocks */}
                  {b.transportToNext && b.transportToNext.primary && (
                    <div
                      style={{
                        position: 'absolute' as const,
                        left: 0,
                        right: 0,
                        bottom: -13,
                        display: 'flex',
                        justifyContent: 'center',
                        zIndex: 6,
                      }}
                    >
                      <button
                        title="点开改交通"
                        onClick={e => {
                          e.stopPropagation()
                          onOpenBlock(di, bi)
                        }}
                        className="num"
                        style={{
                          background: '#fff',
                          color: 'var(--c-transport)',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 9px',
                          borderRadius: 99,
                          boxShadow: '0 2px 7px rgba(76,125,255,.22)',
                          border: '1px solid rgba(76,125,255,.2)',
                        }}
                      >
                        {(TRANSPORT_META[b.transportToNext.primary.mode] ?? { emoji: '•', zh: '' }).emoji}{' '}
                        {(TRANSPORT_META[b.transportToNext.primary.mode] ?? { zh: '' }).zh}{' '}
                        {b.transportToNext.primary.duration}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* add-block button (plan mode only) */}
            {editable &&
              (() => {
                let lastEnd = rangeStart
                day.blocks.forEach(b => {
                  const sMin = toMin(b.startTime)
                  const eMin =
                    b.endTime === '次日'
                      ? Math.min(rangeEnd, (sMin ?? 0) + 75)
                      : toMin(b.endTime)
                  if (eMin != null) lastEnd = Math.max(lastEnd, eMin)
                })
                const top = Math.min(yOf(lastEnd) + 18, height - 46)
                return (
                  <button
                    key="add"
                    onClick={() => onAddBlock(di)}
                    onMouseEnter={e => {
                      const s = e.currentTarget.style
                      s.borderColor = 'var(--brand)'
                      s.color = 'var(--brand)'
                      s.background = '#fff'
                    }}
                    onMouseLeave={e => {
                      const s = e.currentTarget.style
                      s.borderColor = '#D8C7B2'
                      s.color = 'var(--ink-2)'
                      s.background = 'rgba(255,255,255,.6)'
                    }}
                    style={{
                      position: 'absolute' as const,
                      left: 7,
                      right: 7,
                      top,
                      height: 40,
                      cursor: 'pointer',
                      border: '1.5px dashed #D8C7B2',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,.6)',
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-cn-body)',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all .18s var(--ease-spring)',
                    }}
                  >
                    + 加一项
                  </button>
                )
              })()}
          </div>
        ))}

        {/* placeholder cell for add-day column body (keep grid alignment) */}
        {editable && <div style={{ height }} />}
      </div>
    </div>
  )
}
