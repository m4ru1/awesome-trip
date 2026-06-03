import { fmt } from '@/utils/time'
import type { Trip } from '@/types'

interface Props {
  trip: Trip
  activeDay: number
  nowMin: number
  onSetActiveDay: (i: number) => void
  onSetNowMin: (m: number) => void
}

export default function ExecuteBar({ trip, activeDay, nowMin, onSetActiveDay, onSetNowMin }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper2 px-4 py-2.5">
      <span className="text-xs font-bold text-ink2">🧭 模拟「现在」</span>
      <div className="flex gap-1.5">
        {trip.days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => onSetActiveDay(i)}
            className="cursor-pointer rounded-full border-none px-3 py-2 text-xs font-bold transition-all duration-200"
            style={{
              background: i === activeDay ? 'var(--color-brand)' : '#fff',
              color: i === activeDay ? '#fff' : 'var(--color-ink)',
              boxShadow: i === activeDay ? '0 2px 8px rgba(255,107,92,.3)' : 'var(--shadow-soft)',
            }}
          >
            D{i + 1}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={480}
        max={1260}
        step={5}
        value={nowMin}
        onChange={e => onSetNowMin(Number(e.target.value))}
        className="flex-1"
      />
      <span className="num text-sm font-bold text-brand">{fmt(nowMin)}</span>
    </div>
  )
}
