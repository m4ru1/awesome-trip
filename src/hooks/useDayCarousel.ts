import { useRef, useCallback } from 'react'
import { useMotionValue, animate } from 'motion/react'

const AXIS_LOCK_PX = 6
const VEL_SMOOTH = 0.7
const SNAP_VEL = 0.4       // px/ms — fast flick always snaps
const SNAP_RATIO = 0.3     // 30 % of width
const RUBBER = 0.35
const SNAP_SPRING = { type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }
const BOUNCE_SPRING = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.8 }

interface Opts {
  dayCount: number
  activeIdx: number
  onSetActiveDay: (idx: number) => void
  containerWidth: number
  enabled: boolean
}

export function useDayCarousel({
  dayCount, activeIdx, onSetActiveDay, containerWidth, enabled,
}: Opts) {
  const dragX = useMotionValue(0)
  const isSwipingRef = useRef(false)
  const animatingRef = useRef(false)

  const g = useRef({
    active: false,
    axisLocked: null as 'h' | 'v' | null,
    startX: 0, startY: 0,
    lastX: 0, lastTime: 0, velocity: 0,
  })

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (animatingRef.current) return
    const t = e.touches[0]
    const s = g.current
    s.active = true
    s.axisLocked = null
    s.startX = t.clientX
    s.startY = t.clientY
    s.lastX = t.clientX
    s.lastTime = Date.now()
    s.velocity = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const s = g.current
    if (!s.active) return
    const t = e.touches[0]
    const dx = t.clientX - s.startX
    const dy = t.clientY - s.startY

    if (!s.axisLocked) {
      if (Math.abs(dx) > AXIS_LOCK_PX || Math.abs(dy) > AXIS_LOCK_PX) {
        s.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
      if (!s.axisLocked) return
    }
    if (s.axisLocked === 'v') return

    e.preventDefault()
    isSwipingRef.current = true

    const now = Date.now()
    const dt = now - s.lastTime
    if (dt > 0) {
      const iv = (t.clientX - s.lastX) / dt
      s.velocity = VEL_SMOOTH * s.velocity + (1 - VEL_SMOOTH) * iv
    }
    s.lastX = t.clientX
    s.lastTime = now

    let offset = t.clientX - s.startX
    if (offset > 0 && activeIdx === 0) offset *= RUBBER
    if (offset < 0 && activeIdx === dayCount - 1) offset *= RUBBER

    if (enabled) dragX.set(offset)
  }, [activeIdx, dayCount, dragX, enabled])

  const onTouchEnd = useCallback(() => {
    const s = g.current
    if (!s.active || s.axisLocked !== 'h') {
      s.active = false
      s.axisLocked = null
      isSwipingRef.current = false
      return
    }

    const offset = dragX.get()
    const v = s.velocity
    const threshold = containerWidth * SNAP_RATIO

    let targetIdx = activeIdx
    if (Math.abs(v) > SNAP_VEL) {
      targetIdx = v > 0 ? activeIdx - 1 : activeIdx + 1
    } else if (Math.abs(offset) > threshold) {
      targetIdx = offset > 0 ? activeIdx - 1 : activeIdx + 1
    }

    const valid = targetIdx >= 0 && targetIdx < dayCount && targetIdx !== activeIdx

    if (valid && enabled) {
      const tx = targetIdx < activeIdx ? containerWidth : -containerWidth
      animatingRef.current = true
      animate(dragX, tx, SNAP_SPRING).then(() => {
        animatingRef.current = false
        onSetActiveDay(targetIdx)
      })
    } else if (enabled) {
      animatingRef.current = true
      animate(dragX, 0, BOUNCE_SPRING).then(() => {
        animatingRef.current = false
      })
    } else {
      dragX.set(0)
    }

    s.active = false
    s.axisLocked = null
    setTimeout(() => { isSwipingRef.current = false }, 100)
  }, [activeIdx, dayCount, containerWidth, dragX, onSetActiveDay, enabled])

  return { dragX, onTouchStart, onTouchMove, onTouchEnd, isSwipingRef }
}
