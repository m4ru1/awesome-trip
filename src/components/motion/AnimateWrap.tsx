import { type ReactNode } from 'react'
import { AnimatePresence, AnimatePresenceProps } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'

interface AnimateWrapProps extends AnimatePresenceProps {
  children: ReactNode
}

export function AnimateWrap({ children, ...presenceProps }: AnimateWrapProps) {
  const { enabled } = useAnimation()

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <AnimatePresence {...presenceProps}>
      {children}
    </AnimatePresence>
  )
}
