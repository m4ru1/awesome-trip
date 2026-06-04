import { useState, useRef, useCallback } from 'react'

const COLLAPSE_DELTA = 24    // net px down before hiding toolbar
const EXPAND_DELTA = 32      // net px up before showing toolbar
const SETTLE_MS = 300        // ignore scroll events while CSS transition runs (220ms + 80ms safety)

function getSettleMs(): number {
  if (typeof document === 'undefined') return SETTLE_MS
  return document.documentElement.classList.contains('animations-off') ? 0 : SETTLE_MS
}
const TOP_ZONE = 8           // scrollTop below this always shows toolbar
const ACCUMULATOR_MAX = 100  // safety ceiling

/**
 * Tracks net scroll movement to auto-hide/show a toolbar.
 * Single continuous accumulator with a settle period aligned to CSS transition duration.
 * All mutable state lives in refs so the callback has a stable identity (empty deps).
 */
export function useScrollCollapse() {
  const [collapsed, setCollapsed] = useState(false)
  const accum = useRef(0)
  const lastY = useRef(0)
  const settleUntil = useRef(0)

  const onScroll = useCallback((scrollTop: number) => {
    const y = Math.max(0, scrollTop)

    // Guard: a large jump between consecutive scroll events means the scrollable
    // content was replaced (day change). Reset internal state silently so stale
    // lastY/accum from the previous day don't cause a false expand/collapse jitter.
    if (Math.abs(y - lastY.current) > ACCUMULATOR_MAX) {
      accum.current = 0
      lastY.current = y
      return
    }

    // Top zone: always show toolbar, bypass settle
    if (y < TOP_ZONE) {
      setCollapsed(false)
      accum.current = 0
      lastY.current = y
      return
    }

    // Settle period: ignore scroll, preserve lastY for continuity
    if (Date.now() < settleUntil.current) {
      return
    }

    accum.current += y - lastY.current
    lastY.current = y
    if (accum.current > ACCUMULATOR_MAX) accum.current = ACCUMULATOR_MAX
    if (accum.current < -ACCUMULATOR_MAX) accum.current = -ACCUMULATOR_MAX

    if (accum.current >= COLLAPSE_DELTA) {
      setCollapsed(true)
      accum.current = 0
      settleUntil.current = Date.now() + getSettleMs()
    } else if (accum.current <= -EXPAND_DELTA) {
      setCollapsed(false)
      accum.current = 0
      settleUntil.current = Date.now() + getSettleMs()
    }
  }, [])

  const reset = useCallback(() => {
    setCollapsed(false)
    accum.current = 0
    lastY.current = 0
    settleUntil.current = 0
  }, [])

  return { collapsed, onScroll, reset }
}
