import ModeSwitcher from './ModeSwitcher'
import ExecuteBar from './ExecuteBar'
import CoverIcon from '@/components/covers/CoverIcon'
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
  onGoHome?: () => void
  activeDay: number
  onSetActiveDay: (i: number) => void
  onSetNowMin: (m: number) => void
  toolbarCollapsed?: boolean
}

export default function TopBar({
  trip, mode, planB, isMobile, nowMin,
  onSetMode, onTogglePlanB, onShowHelp, onShowTrip, onGoHome,
  activeDay, onSetActiveDay, onSetNowMin,
  toolbarCollapsed,
}: Props) {
  return (
    <header
      className="z-50 flex flex-col border-b border-line"
      style={{
        background: 'rgba(255,248,240,.9)',
        backdropFilter: 'blur(8px)',
        paddingTop: 'var(--safe-top)',
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3 max-[860px]:px-3.5 max-[860px]:py-2.5">
        {/* Back to home */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="btn btn-ghost h-9 w-9 !p-0 text-base flex items-center justify-center"
            title="返回首页"
          >
            {'←'}
          </button>
        )}

        {/* Trip title button */}
        <button
          onClick={onShowTrip}
          className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent p-0 transition-transform active:scale-[.97]"
        >
          <CoverIcon
            coverId={trip.coverId}
            coverColor={trip.coverColor}
            coverEmoji={trip.coverEmoji}
            size={42}
          />
          <span className="text-left">
            <span className="title-cn block text-[19px] leading-tight text-ink max-[860px]:text-base clamp-1">
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

        {!isMobile && (
          <>
            <button
              onClick={onShowHelp}
              className="btn btn-ghost h-9 w-9 !p-0 text-base flex items-center justify-center"
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
              🅱️ Plan B
            </button>
          </>
        )}
      </div>

      {/* Mobile: mode switcher + actions on second row */}
      {isMobile && (
        <div
          className="toolbar-collapse overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: toolbarCollapsed ? '0fr' : '1fr',
            transition: 'grid-template-rows 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 px-3.5 pb-2.5">
              <ModeSwitcher mode={mode} onChange={onSetMode} compact />
              <div className="mx-0.5 h-5 w-px rounded-full bg-line" />
              <button
                onClick={onShowHelp}
                className="btn btn-ghost h-9 w-9 !p-0 text-base flex items-center justify-center"
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
                🅱️
              </button>
            </div>
          </div>
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
