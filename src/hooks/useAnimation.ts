import { useState, useEffect, useCallback } from 'react'
import type { Transition } from 'motion/react'

const STORAGE_KEY = 'tt_animations_v1'
const CSS_CLASS = 'animations-off'

type SpringVariant = 'gentle' | 'snappy' | 'bouncy'

interface SpringConfig {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

const SPRING_PRESETS: Record<SpringVariant, SpringConfig> = {
  gentle: { type: 'spring', stiffness: 200, damping: 26, mass: 1 },
  snappy: { type: 'spring', stiffness: 400, damping: 30, mass: 1 },
  bouncy: { type: 'spring', stiffness: 500, damping: 25, mass: 1 },
}

const INSTANT: Transition = { duration: 0 }

// Module-level singleton: shared across all components
const prefersReduced = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false
let sharedEnabled = prefersReduced ? false : localStorage.getItem(STORAGE_KEY) !== 'off'
const listeners = new Set<() => void>()

function syncCssClass() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(CSS_CLASS, !sharedEnabled)
}

function notify() { listeners.forEach(fn => fn()) }

// Initialize CSS class on load
if (typeof window !== 'undefined') {
  syncCssClass()
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      sharedEnabled = false
    } else {
      sharedEnabled = localStorage.getItem(STORAGE_KEY) !== 'off'
    }
    syncCssClass()
    notify()
  })
}

export function useAnimation() {
  const [enabled, setEnabled] = useState(sharedEnabled)

  useEffect(() => {
    const handler = () => setEnabled(sharedEnabled)
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  const toggle = useCallback(() => {
    sharedEnabled = !sharedEnabled
    localStorage.setItem(STORAGE_KEY, sharedEnabled ? 'on' : 'off')
    syncCssClass()
    notify()
  }, [])

  const spring = useCallback((variant: SpringVariant = 'snappy'): SpringConfig => {
    return SPRING_PRESETS[variant]
  }, [])

  /** Returns the given transition when enabled, or instant when disabled */
  const tr = useCallback((t: Transition): Transition => {
    return sharedEnabled ? t : INSTANT
  }, [])

  return { enabled, toggle, spring, tr, springPresets: SPRING_PRESETS }
}
