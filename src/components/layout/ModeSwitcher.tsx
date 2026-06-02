import { motion } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import { MODES } from '@/data/constants'
import type { Mode } from '@/types'

interface Props {
  mode: Mode
  onChange: (m: Mode) => void
  compact?: boolean
}

export default function ModeSwitcher({ mode, onChange, compact }: Props) {
  const { enabled } = useAnimation()

  return (
    <div className="inline-flex gap-0.5 rounded-[14px] bg-paper2 p-1">
      {MODES.map(m => {
        const on = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className="relative cursor-pointer whitespace-nowrap rounded-[11px] border-none text-[13.5px] font-bold"
            style={{
              background: 'transparent',
              color: on ? 'var(--color-ink)' : 'var(--color-ink2)',
              padding: compact ? '7px 10px' : '8px 15px',
              fontFamily: 'var(--font-cn-body)',
              transition: 'color .2s ease',
            }}
          >
            {on && (
              <motion.div
                layoutId={enabled ? 'mode-indicator' : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 11,
                  background: '#fff',
                  boxShadow: '0 3px 9px rgba(75,55,40,.14)',
                  zIndex: 0,
                }}
              />
            )}
            <span className="relative z-[1]">
              {m.emoji}{compact ? '' : ' ' + m.zh}
            </span>
          </button>
        )
      })}
    </div>
  )
}
