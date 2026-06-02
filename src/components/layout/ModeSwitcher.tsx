import { MODES } from '@/data/constants'
import type { Mode } from '@/types'

interface Props {
  mode: Mode
  onChange: (m: Mode) => void
  compact?: boolean
}

export default function ModeSwitcher({ mode, onChange, compact }: Props) {
  return (
    <div className="inline-flex gap-0.5 rounded-[14px] bg-paper2 p-1">
      {MODES.map(m => {
        const on = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className="cursor-pointer whitespace-nowrap rounded-[11px] border-none px-4 py-2 text-[13.5px] font-bold transition-all duration-200"
            style={{
              background: on ? '#fff' : 'transparent',
              color: on ? 'var(--color-ink)' : 'var(--color-ink2)',
              boxShadow: on ? '0 3px 9px rgba(75,55,40,.14)' : 'none',
              padding: compact ? '7px 10px' : '8px 15px',
              fontFamily: 'var(--font-cn-body)',
            }}
          >
            {m.emoji}{compact ? '' : ' ' + m.zh}
          </button>
        )
      })}
    </div>
  )
}
