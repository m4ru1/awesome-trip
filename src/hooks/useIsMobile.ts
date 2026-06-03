import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    return mq.matches
  })

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
