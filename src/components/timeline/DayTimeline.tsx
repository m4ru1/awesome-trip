import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import type { Trip, Mode, TransportMode } from '@/types'
import { TYPE_META, TRANSPORT_META } from '@/data/constants'
import { parseTransportMin } from '@/utils/time'
import BlockCard from '@/components/cards/BlockCard'
import ExecuteNowCard from '@/components/timeline/ExecuteNowCard'

interface Props {
  trip: Trip
  activeIdx: number
  mode: Mode
  onOpenBlock: (dayIdx: number, blockIdx: number) => void
  onAddBlock?: (dayIdx: number) => void
  onReorderIds?: (dayIdx: number, ids: string[]) => void
  transportBinder?: (
    dayIdx: number,
    blockIdx: number,
  ) => {
    editable: boolean
    onSwitchAlt: (segIdx: number, altIdx: number) => void
    onSetMode: (segIdx: number, k: string) => void
    onSetField: (segIdx: number, f: string, v: string) => void
    onAdd: () => void
    onRemove: (segIdx: number) => void
  }
  nowInfo?: {
    blockIdx: number | null
    nextBlockIdx: number | null
  } | null
  onScroll?: (scrollTop: number) => void
}

/** Small transport connector rendered between two adjacent blocks. */
function TransportIndicator({
  transport,
}: {
  transport: { primary: { mode: string; duration: string } }[] | null
}) {
  if (!transport || transport.length === 0) return null
  const segments = transport.filter(t => t?.primary)
  if (segments.length === 0) return null

  const parts = segments.map(t => {
    const tm = TRANSPORT_META[t.primary.mode as TransportMode] ?? { emoji: '•', zh: '' }
    return `${tm.emoji} ${t.primary.duration}`
  })
  const totalMin = segments.reduce((s, t) => s + parseTransportMin(t.primary.duration), 0)

  return (
    <div
      style={{
        display: 'flex',
        gap: 11,
      }}
    >
      <div
        style={{
          width: 46,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: 6,
        }}
      >
        <div
          style={{
            width: 0,
            borderLeft:
              '2px dotted var(--color-transport)',
            opacity: 0.4,
            minHeight: 30,
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: '4px 0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--color-ink2)',
        }}
      >
        <span className="num" style={{ fontWeight: 600 }}>
          {segments.length === 1
            ? (() => {
                const s = segments[0]
                const tm = TRANSPORT_META[s.primary.mode as TransportMode] ?? { emoji: '•', zh: '' }
                return `${tm.emoji} ${tm.zh} ${s.primary.duration}`
              })()
            : `${parts.join(' → ')} · ${totalMin}min`
          }
        </span>
      </div>
    </div>
  )
}

export default function DayTimeline({
  trip,
  activeIdx,
  mode,
  onOpenBlock,
  onAddBlock,
  onReorderIds,
  transportBinder: _transportBinder,
  nowInfo,
  onScroll,
}: Props): ReactNode {
  const { enabled } = useAnimation()
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()
  const day = trip.days[activeIdx]
  if (!day) return null

  const editable = mode === 'plan'
  const blocks = day.blocks
  // _transportBinder will be wired to TransportIndicator editing in a future pass
  void _transportBinder

  // Derive the ExecuteNowCard props from nowInfo
  const nowBlock =
    nowInfo?.blockIdx != null
      ? blocks[nowInfo.blockIdx]
      : null
  const nextBlock =
    nowInfo?.nextBlockIdx != null
      ? blocks[nowInfo.nextBlockIdx]
      : null

  /* ── Pointer-based drag reorder ── */
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragDeltaY, setDragDeltaY] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const ptrState = useRef<{
    active: boolean
    startY: number
    idx: number
    moved: boolean
  } | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const guardTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [guard, setGuard] = useState(false)

  // Capture row heights for swap calculation
  const getRowCenter = useCallback((i: number) => {
    const el = rowRefs.current[i]
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return rect.top + rect.height / 2
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, idx: number) => {
      if (!editable || !onReorderIds) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      ptrState.current = { active: false, startY: e.clientY, idx, moved: false }
    },
    [editable, onReorderIds],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = ptrState.current
      if (!s) return
      const dy = e.clientY - s.startY

      // 7px threshold before starting drag
      if (!s.active && Math.abs(dy) < 7) return
      if (!s.active) {
        s.active = true
        s.moved = true
        setDragIdx(s.idx)
      }

      setDragDeltaY(dy)

      // Determine hover target based on pointer position
      for (let i = 0; i < blocks.length; i++) {
        if (i === s.idx) continue
        const center = getRowCenter(i)
        if (center == null) continue
        if (e.clientY < center) {
          setHoverIdx(i)
          return
        }
      }
      setHoverIdx(blocks.length - 1 === s.idx ? null : blocks.length - 1)
    },
    [blocks.length, getRowCenter],
  )

  const handlePointerUp = useCallback(() => {
    const s = ptrState.current
    if (s?.active && hoverIdx != null && s.idx !== hoverIdx && onReorderIds) {
      const ids = blocks.map(b => b.id)
      const [moved] = ids.splice(s.idx, 1)
      const insertAt = hoverIdx > s.idx ? hoverIdx - 1 : hoverIdx
      ids.splice(insertAt < 0 ? 0 : insertAt, 0, moved)
      onReorderIds(activeIdx, ids)

      // Post-drop guard: prevent accidental re-open for 120ms
      setGuard(true)
      if (guardTimer.current) clearTimeout(guardTimer.current)
      guardTimer.current = setTimeout(() => setGuard(false), 120)
    }
    ptrState.current = null
    setDragIdx(null)
    setDragDeltaY(0)
    setHoverIdx(null)
  }, [blocks, hoverIdx, activeIdx, onReorderIds])

  // Cleanup guard timer on unmount
  useEffect(() => {
    return () => {
      if (guardTimer.current) clearTimeout(guardTimer.current)
    }
  }, [])

  const openBlock = guard
    ? () => {}
    : (d: number, b: number) => onOpenBlock(d, b)

  return (
    <motion.div
      ref={rubberRef}
      className="overscroll-none"
      style={{
        height: '100%',
        overflowY: 'auto',
        paddingBottom: 30,
        position: 'relative',
        y: rubberY,
      }}
      onScroll={onScroll ? (e) => onScroll(e.currentTarget.scrollTop) : undefined}
    >
      {/* Execute mode: "Now" card at the top */}
      {mode === 'execute' && (
        <ExecuteNowCard
          block={nowBlock}
          nextBlock={nextBlock}
          onOpenBlock={
            nowInfo?.blockIdx != null
              ? () => onOpenBlock(activeIdx, nowInfo.blockIdx!)
              : undefined
          }
        />
      )}

      <div style={{ padding: '10px 14px 0' }}>
        {blocks.map((b, pos) => {
          const meta = TYPE_META[b.type]
          const realIdx = pos
          const isNow =
            nowInfo?.blockIdx === realIdx &&
            mode === 'execute'

          const isDragging = dragIdx === realIdx
          const isHoverTarget = hoverIdx === realIdx && dragIdx !== null && dragIdx !== realIdx

          // Calculate visual offset: dragged card follows pointer, others shift to make room
          let translateY = 0
          if (isDragging) {
            translateY = dragDeltaY
          } else if (dragIdx !== null && hoverIdx !== null) {
            // Non-dragged cards shift to make room
            if (dragIdx < hoverIdx && realIdx > dragIdx && realIdx <= hoverIdx) {
              // Moving down: cards between dragIdx+1 and hoverIdx shift up
              const dragEl = rowRefs.current[dragIdx]
              translateY = dragEl ? -dragEl.offsetHeight : 0
            } else if (dragIdx > hoverIdx && realIdx >= hoverIdx && realIdx < dragIdx) {
              // Moving up: cards between hoverIdx and dragIdx-1 shift down
              const dragEl = rowRefs.current[dragIdx]
              translateY = dragEl ? dragEl.offsetHeight : 0
            }
          }

          return (
            <motion.div
              key={b.id}
              ref={el => { rowRefs.current[realIdx] = el }}
              layout={enabled}
              transition={enabled ? { type: 'spring', stiffness: 400, damping: 30, mass: 1 } : { duration: 0 }}
              style={{
                transition: isDragging ? 'none' : 'transform .22s var(--ease-spring)',
                transform: translateY ? `translateY(${translateY}px)` : undefined,
                zIndex: isDragging ? 30 : undefined,
                position: 'relative',
                opacity: isDragging ? 0.92 : 1,
                pointerEvents: isDragging ? 'none' : undefined,
              }}
            >
              {/* Block row: time gutter + card */}
              <div
                style={{ display: 'flex', gap: 11 }}
              >
                {/* Left time gutter */}
                <div
                  style={{
                    width: 46,
                    flexShrink: 0,
                    textAlign: 'right',
                    position: 'relative',
                  }}
                >
                  <div
                    className="num"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: meta.color,
                    }}
                  >
                    {b.startTime}
                  </div>
                  <div
                    className="num"
                    style={{
                      fontSize: 11,
                      color: 'var(--color-ink3)',
                    }}
                  >
                    {b.endTime !== '次日'
                      ? b.endTime
                      : ''}
                  </div>
                  {/* Drag grip handle (plan mode only) */}
                  {editable && (
                    <div
                      title="按住拖动重排"
                      className="no-select"
                      onPointerDown={e => handlePointerDown(e, realIdx)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      style={{
                        fontSize: 15,
                        color: isHoverTarget ? 'var(--color-brand)' : 'var(--color-ink3)',
                        marginTop: 7,
                        cursor: 'grab',
                        touchAction: 'none',
                        lineHeight: 1,
                        transition: 'color .15s',
                        padding: 10,
                        margin: '1px -10px 0 0',
                      }}
                    >
                      ⠿
                    </div>
                  )}
                </div>

                {/* Block card */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingBottom: 4,
                  }}
                >
                  <BlockCard
                    block={b}
                    mode={mode}
                    nowState={
                      isNow ? 'current' : null
                    }
                    onClick={() =>
                      openBlock(activeIdx, realIdx)
                    }
                    isDragging={isDragging}
                  />
                </div>
              </div>

              {/* Transport connector between blocks */}
              {pos < blocks.length - 1 && (
                <TransportIndicator
                  transport={b.transportToNext}
                />
              )}
            </motion.div>
          )
        })}

        {/* Add block button (plan mode only) */}
        {editable && onAddBlock && (
          <div
            style={{
              display: 'flex',
              gap: 11,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 46,
                flexShrink: 0,
              }}
            />
            <button
              onClick={() => onAddBlock(activeIdx)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: '1.5px dashed #D8C7B2',
                borderRadius: 16,
                background:
                  'rgba(255,255,255,.6)',
                color: 'var(--color-ink2)',
                fontFamily:
                  'var(--font-cn-body)',
                fontWeight: 700,
                fontSize: 14,
                padding: '13px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              ＋ 加一项行程
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
