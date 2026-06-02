import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'

interface MotionDivProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  children: ReactNode
  className?: string
  /** Motion props to apply when animations are enabled */
  motionProps?: HTMLMotionProps<'div'>
  style?: React.CSSProperties
}

export function MotionDiv({
  children,
  className,
  motionProps,
  style,
  ...rest
}: MotionDivProps) {
  const { enabled } = useAnimation()

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        ...(enabled ? { willChange: 'transform' } : {}),
      }}
      {...(enabled ? motionProps : { transition: { duration: 0 } })}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
