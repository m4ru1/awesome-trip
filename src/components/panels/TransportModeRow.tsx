import type { ReactNode } from 'react'
import type { TransportMode } from '@/types'
import { TRANSPORT_META } from '@/data/constants'

interface Props {
  current: TransportMode
  onPick: (mode: TransportMode) => void
}

export default function TransportModeRow({ current, onPick }: Props): ReactNode {
  const keys = Object.keys(TRANSPORT_META) as TransportMode[]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {keys.map((k) => {
        const tm = TRANSPORT_META[k]
        const on = current === k
        return (
          <button
            key={k}
            onClick={() => onPick(k)}
            title={tm.zh}
            style={{
              border: `1.5px solid ${on ? 'var(--color-transport)' : 'var(--color-line)'}`,
              cursor: 'pointer',
              borderRadius: 10,
              padding: '6px 9px',
              background: on ? 'var(--color-transport-soft)' : '#fff',
              color: on ? 'var(--color-transport)' : 'var(--color-ink2)',
              fontFamily: 'var(--font-cn-body)',
              fontWeight: 700,
              fontSize: 12.5,
              lineHeight: 1,
              transition: 'all .15s',
            }}
          >
            {tm.emoji} {tm.zh}
          </button>
        )
      })}
    </div>
  )
}
