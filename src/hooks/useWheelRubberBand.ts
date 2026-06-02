import { useEffect, useRef, useCallback } from 'react'
import { useMotionValue, useSpring, type MotionValue } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import { useIsMobile } from '@/hooks/useIsMobile'

const SPRING_CONFIG = { stiffness: 400, damping: 30, mass: 1 }
const MAX_DISPLACEMENT = 80
const IDLE_TIMEOUT = 200
const BOUNDARY_TOLERANCE = 1
const ACTIVE_THRESHOLD = 0.5
const DECEL_WINDOW = 8
const DECEL_DAMP_FACTOR = 0.02

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
}

export function useWheelRubberBand(): {
  ref: React.RefObject<HTMLDivElement | null>
  y: MotionValue<number>
} {
  const ref = useRef<HTMLDivElement | null>(null)
  const isMobile = useIsMobile()
  const { enabled } = useAnimation()

  const raw = useMotionValue(0)
  const y = useSpring(raw, SPRING_CONFIG)

  const state = useRef({
    accum: 0,
    timer: null as ReturnType<typeof setTimeout> | null,
    rafId: null as number | null,
    dirty: false,
    recentMags: [] as number[],
  })

  const flush = useCallback(() => {
    const s = state.current
    s.rafId = null
    if (s.dirty) {
      raw.set(s.accum)
      s.dirty = false
    }
  }, [raw])

  useEffect(() => {
    if (isMobile || !enabled) return
    const el = ref.current
    if (!el) return
    const onMac = isMac()

    const s = state.current
    s.accum = 0
    s.recentMags = []
    raw.set(0)

    /**
     * Detect inertia: track ALL wheel |deltaY|, check if the tail
     * of the history has dropped below 40% of the window's peak.
     * This catches exponential decay without requiring strict monotonic decrease.
     */
    const detectInertia = (): boolean => {
      if (!onMac || s.recentMags.length < DECEL_WINDOW) return false
      const h = s.recentMags
      const peak = Math.max(...h)
      const tail = h[h.length - 1]
      return tail < peak * 0.4
    }

    const applyDelta = (dy: number, inertia: boolean) => {
      // When actively releasing rubber-band (dy opposite to accum), always use normal damping
      const isReleasing = (s.accum > 0 && dy < 0) || (s.accum < 0 && dy > 0)
      const factor = (inertia && !isReleasing) ? DECEL_DAMP_FACTOR : 0.15
      const damped = -Math.sign(dy) * Math.pow(Math.abs(dy), 0.6) * factor
      const prevSign = s.accum > 0 ? 1 : s.accum < 0 ? -1 : 0
      s.accum = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, s.accum + damped))
      const newSign = s.accum > 0 ? 1 : s.accum < 0 ? -1 : 0
      if (prevSign !== 0 && newSign !== 0 && prevSign !== newSign) {
        s.accum = 0
      }
      s.dirty = true
      if (s.rafId == null) s.rafId = requestAnimationFrame(flush)
      if (s.timer) clearTimeout(s.timer)
      s.timer = setTimeout(() => {
        s.accum = 0
        s.recentMags = []
        s.dirty = true
        if (s.rafId == null) s.rafId = requestAnimationFrame(flush)
        s.timer = null
      }, IDLE_TIMEOUT)
    }

    const onWheel = (e: WheelEvent) => {
      // Track ALL events for inertia detection (before any filtering)
      s.recentMags.push(Math.abs(e.deltaY))
      if (s.recentMags.length > DECEL_WINDOW) s.recentMags.shift()

      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const inertia = detectInertia()

      if (Math.abs(s.accum) > ACTIVE_THRESHOLD) {
        applyDelta(e.deltaY, inertia)
        return
      }

      const atTop = scrollTop <= BOUNDARY_TOLERANCE && e.deltaY < 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - BOUNDARY_TOLERANCE && e.deltaY > 0

      if (atTop || atBottom) {
        applyDelta(e.deltaY, inertia)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (s.timer) { clearTimeout(s.timer); s.timer = null }
      if (s.rafId != null) { cancelAnimationFrame(s.rafId); s.rafId = null }
    }
  }, [isMobile, enabled, raw, flush])

  return { ref, y }
}
