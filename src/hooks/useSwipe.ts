import { useRef, useCallback } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  velocityThreshold?: number
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
  velocityThreshold = 0.3,
}: SwipeOptions) {
  const state = useRef<{
    startX: number
    startY: number
    startTime: number
    axisLocked: 'h' | 'v' | null
  } | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    state.current = {
      startX: t.clientX,
      startY: t.clientY,
      startTime: Date.now(),
      axisLocked: null,
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const s = state.current
    if (!s) return
    const t = e.touches[0]
    const dx = t.clientX - s.startX
    const dy = t.clientY - s.startY

    if (!s.axisLocked) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        s.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      }
    }

    if (s.axisLocked === 'h') {
      e.preventDefault()
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = state.current
    if (!s || s.axisLocked !== 'h') {
      state.current = null
      return
    }

    const t = e.changedTouches[0]
    const dx = t.clientX - s.startX
    const dt = Date.now() - s.startTime
    const velocity = Math.abs(dx) / Math.max(dt, 1)

    if (Math.abs(dx) >= threshold || velocity >= velocityThreshold) {
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    }

    state.current = null
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold])

  return { onTouchStart, onTouchMove, onTouchEnd }
}
