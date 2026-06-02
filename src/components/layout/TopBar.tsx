import ModeSwitcher from './ModeSwitcher'
import ExecuteBar from './ExecuteBar'
import type { Trip, Mode } from '@/types'

interface Props {
  trip: Trip
  mode: Mode
  planB: boolean
  isMobile: boolean
  nowMin: number
  onSetMode: (m: Mode) => void
  onTogglePlanB: () => void
  onShowHelp: () => void
  onShowTrip: () => void
  activeDay: number
  onSetActiveDay: (i: number) => void
  onSetNowMin: (m: number) => void
}

export default function TopBar({
  trip, mode, planB, isMobile, nowMin,
  onSetMode, onTogglePlanB, onShowHelp, onShowTrip,
  activeDay, onSetActiveDay, onSetNowMin,
}: Props) {
  return (
    <header
      className="z-50 flex flex-col border-b border-line"
      style={{
        background: 'rgba(255,248,240,.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3 max-[860px]:px-3.5 max-[860px]:py-2.5">
        {/* Trip title button */}
        <button
          onClick={onShowTrip}
          className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent p-0 transition-transform active:scale-[.97]"
        >
          <span
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] text-xl"
            style={{ background: 'linear-gradient(140deg,#FF8A4C,#FF6B5C)' }}
          >
            {trip.coverEmoji}
          </span>
          <span className="text-left">
            <span className="title-cn block text-[19px] leading-tight text-ink max-[860px]:text-base">
              {trip.title}
            </span>
            <span className="block text-xs text-ink2">
              {trip.dateRange} · {trip.destinationCity} · {trip.days.length}天
            </span>
          </span>
        </button>

        <span className="flex-1" />

        {/* Desktop: mode switcher + help + planB */}
        {!isMobile && (
          <ModeSwitcher mode={mode} onChange={onSetMode} />
        )}

        <button
          onClick={onShowHelp}
          className="btn btn-ghost h-9 w-9 !p-0 text-base"
        >
          ?
        </button>
        <button
          onClick={onTogglePlanB}
          className="btn text-[13px]"
          style={{
            background: planB ? 'var(--color-brand)' : 'var(--color-paper2)',
            color: planB ? '#fff' : 'var(--color-ink)',
          }}
        >
          🅱️{!isMobile && ' Plan B'}
        </button>
      </div>

      {/* Mobile: mode switcher on second row */}
      {isMobile && (
        <div className="flex items-center justify-center px-3.5 pb-2.5">
          <ModeSwitcher mode={mode} onChange={onSetMode} compact />
        </div>
      )}

      {/* Execute mode bar */}
      {mode === 'execute' && (
        <ExecuteBar
          trip={trip}
          activeDay={activeDay}
          nowMin={nowMin}
          onSetActiveDay={onSetActiveDay}
          onSetNowMin={onSetNowMin}
        />
      )}
    </header>
  )
}
