import { useRef, useState, useCallback, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { motion, useTransform } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import { useDayCarousel } from '@/hooks/useDayCarousel'
import { useIsMobile } from '@/hooks/useIsMobile'
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
  onSetActiveDay?: (idx: number) => void
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
  onSetActiveDay,
}: Props): ReactNode {
  const { enabled } = useAnimation()
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()
  const isMob = useIsMobile()

  const day = trip.days[activeIdx]
  const blocks = day?.blocks ?? []
  const editable = mode === 'plan'
  void _transportBinder

  /* ── Container measurement (mobile carousel) ── */
  const containerRef = useRef<HTMLDivElement>(null)
  const currentPanelRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    if (!isMob || !containerRef.current) return
    setContainerWidth(containerRef.current.offsetWidth)
  }, [isMob])

  useEffect(() => {
    if (!isMob || !containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [isMob])

  /* ── Day carousel (mobile) ── */
  const { dragX, onTouchStart, onTouchMove, onTouchEnd, isSwipingRef } = useDayCarousel({
    dayCount: trip.days.length,
    activeIdx,
    onSetActiveDay: onSetActiveDay ?? (() => {}),
    containerWidth,
    enabled,
  })

  const prevPanelX = useTransform(dragX, v => v - containerWidth)
  const nextPanelX = useTransform(dragX, v => v + containerWidth)

  /* ── Reset scroll + carousel position on day change ── */
  useLayoutEffect(() => {
    if (isMob) {
      dragX.set(0)
      if (currentPanelRef.current) currentPanelRef.current.scrollTop = 0
    } else if (rubberRef.current) {
      rubberRef.current.scrollTop = 0
    }
  }, [activeIdx, isMob, dragX, rubberRef])

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
  const dragReorderRef = useRef(false)

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
      dragReorderRef.current = true
    },
    [editable, onReorderIds],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = ptrState.current
      if (!s) return
      const dy = e.clientY - s.startY

      if (!s.active && Math.abs(dy) < 7) return
      if (!s.active) {
        s.active = true
        s.moved = true
        setDragIdx(s.idx)
      }

      setDragDeltaY(dy)

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

      setGuard(true)
      if (guardTimer.current) clearTimeout(guardTimer.current)
      guardTimer.current = setTimeout(() => setGuard(false), 120)
    }
    ptrState.current = null
    dragReorderRef.current = false
    setDragIdx(null)
    setDragDeltaY(0)
    setHoverIdx(null)
  }, [blocks, hoverIdx, activeIdx, onReorderIds])

  useEffect(() => {
    return () => {
      if (guardTimer.current) clearTimeout(guardTimer.current)
    }
  }, [])

  const openBlock = (guard || isSwipingRef.current)
    ? () => {}
    : (d: number, b: number) => onOpenBlock(d, b)

  // Guard: skip carousel touch if touch started on drag grip
  const wrappedTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-grip]')) return
    onTouchStart(e)
  }, [onTouchStart])

  const wrappedTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragReorderRef.current) return
    onTouchMove(e)
  }, [onTouchMove])

  const wrappedTouchEnd = useCallback(() => {
    onTouchEnd()
  }, [onTouchEnd])

  if (!day) return null

  /* ── Render blocks for a given day panel ── */
  const renderBlocks = (
    dayIdx: number,
    dayBlocks: typeof blocks,
    isCurrentPanel: boolean,
  ) => {
    const dayNowInfo = isCurrentPanel ? nowInfo : null
    const dayNowBlock = dayNowInfo?.blockIdx != null ? dayBlocks[dayNowInfo.blockIdx] : null
    const dayNextBlock = dayNowInfo?.nextBlockIdx != null ? dayBlocks[dayNowInfo.nextBlockIdx] : null

    return (
      <>
        {isCurrentPanel && mode === 'execute' && (
          <ExecuteNowCard
            block={dayNowBlock}
            nextBlock={dayNextBlock}
            onOpenBlock={
              dayNowInfo?.blockIdx != null
                ? () => onOpenBlock(dayIdx, dayNowInfo.blockIdx!)
                : undefined
            }
          />
        )}

        <div style={{ padding: '10px 14px 0' }}>
          {dayBlocks.map((b, pos) => {
            const meta = TYPE_META[b.type]
            const realIdx = pos
            const isNow =
              dayNowInfo?.blockIdx === realIdx &&
              mode === 'execute'

            const isDragging = isCurrentPanel && dragIdx === realIdx
            const isHoverTarget = isCurrentPanel && hoverIdx === realIdx && dragIdx !== null && dragIdx !== realIdx

            let translateY = 0
            if (isDragging) {
              translateY = dragDeltaY
            } else if (isCurrentPanel && dragIdx !== null && hoverIdx !== null) {
              if (dragIdx < hoverIdx && realIdx > dragIdx && realIdx <= hoverIdx) {
                const dragEl = rowRefs.current[dragIdx]
                translateY = dragEl ? -dragEl.offsetHeight : 0
              } else if (dragIdx > hoverIdx && realIdx >= hoverIdx && realIdx < dragIdx) {
                const dragEl = rowRefs.current[dragIdx]
                translateY = dragEl ? dragEl.offsetHeight : 0
              }
            }

            return (
              <motion.div
                key={b.id}
                ref={isCurrentPanel ? (el => { rowRefs.current[realIdx] = el }) : undefined}
                layout={enabled && isCurrentPanel}
                transition={enabled && isCurrentPanel ? { type: 'spring', stiffness: 400, damping: 30, mass: 1 } : { duration: 0 }}
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
                    {/* Drag grip handle (plan mode, current panel only) */}
                    {isCurrentPanel && editable && (
                      <div
                        data-grip
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
                        openBlock(dayIdx, realIdx)
                      }
                      isDragging={isDragging}
                    />
                  </div>
                </div>

                {/* Transport connector between blocks */}
                {pos < dayBlocks.length - 1 && (
                  <TransportIndicator
                    transport={b.transportToNext}
                  />
                )}
              </motion.div>
            )
          })}

          {/* Add block button (plan mode, current panel only) */}
          {isCurrentPanel && editable && onAddBlock && (
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
      </>
    )
  }

  /* ── Mobile: three-panel carousel ── */
  if (isMob) {
    return (
      <div
        ref={containerRef}
        className="overscroll-none"
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
        onTouchStart={wrappedTouchStart}
        onTouchMove={wrappedTouchMove}
        onTouchEnd={wrappedTouchEnd}
      >
        {/* Prev day panel */}
        {activeIdx > 0 && (
          <motion.div
            className="overscroll-none"
            style={{
              position: 'absolute',
              top: 0, bottom: 0, left: 0, right: 0,
              x: prevPanelX,
              overflowY: 'auto',
              paddingBottom: 30,
              pointerEvents: 'none',
            }}
          >
            {renderBlocks(activeIdx - 1, trip.days[activeIdx - 1].blocks, false)}
          </motion.div>
        )}

        {/* Current day panel */}
        <motion.div
          ref={currentPanelRef}
          className="overscroll-none"
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            x: dragX,
            overflowY: 'auto',
            paddingBottom: 30,
          }}
          onScroll={onScroll ? (e) => onScroll(e.currentTarget.scrollTop) : undefined}
        >
          {renderBlocks(activeIdx, blocks, true)}
        </motion.div>

        {/* Next day panel */}
        {activeIdx < trip.days.length - 1 && (
          <motion.div
            className="overscroll-none"
            style={{
              position: 'absolute',
              top: 0, bottom: 0, left: 0, right: 0,
              x: nextPanelX,
              overflowY: 'auto',
              paddingBottom: 30,
              pointerEvents: 'none',
            }}
          >
            {renderBlocks(activeIdx + 1, trip.days[activeIdx + 1].blocks, false)}
          </motion.div>
        )}
      </div>
    )
  }

  /* ── Desktop: rubber band ── */
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
      {renderBlocks(activeIdx, blocks, true)}
    </motion.div>
  )
}
