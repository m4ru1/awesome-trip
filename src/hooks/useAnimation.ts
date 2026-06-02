import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'tt_animations_v1'

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

export function useAnimation() {
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const [enabled, setEnabled] = useState(() => {
    if (prefersReduced) return false
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setEnabled(false)
      } else {
        setEnabled(localStorage.getItem(STORAGE_KEY) !== 'off')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      return next
    })
  }, [])

  const spring = useCallback((variant: SpringVariant = 'snappy'): SpringConfig => {
    return SPRING_PRESETS[variant]
  }, [])

  return { enabled, toggle, spring, springPresets: SPRING_PRESETS }
}
