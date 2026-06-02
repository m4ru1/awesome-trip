import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Day } from '@/types'
import EdInput from '@/components/ui/EdInput'
import EdField from '@/components/ui/EdField'

interface Props {
  dayIdx: number
  day: Day
  isMobile: boolean
  onClose: () => void
  onUpdate: (patch: Partial<Day>) => void
}

export default function DayPanel({ dayIdx, day, isMobile, onClose, onUpdate }: Props): ReactNode {
  const [weatherIcon, setWeatherIcon] = useState(day.weatherIcon)
  const [weatherHint, setWeatherHint] = useState(day.weatherHint)

  const handleSave = () => {
    onUpdate({ weatherIcon, weatherHint })
    onClose()
  }

  const dateDisplay = `${day.dateLabel} · ${day.weekday}`

  const content = (
    <div>
      <div className="flex items-center gap-3 rounded-t-none px-5 py-4" style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}>
        <span className="title-cn text-lg font-extrabold text-white">Day {dayIdx + 1}</span>
        <span className="flex-1" />
        <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border-none bg-white/30 text-white">✕</button>
      </div>

      <div className="px-5 py-4">
        <EdField label="日期">
          <div className="num flex h-[42px] items-center rounded-2xl bg-paper2 px-3 text-sm text-ink2">
            {dateDisplay}
          </div>
        </EdField>
        <EdField label="天气图标">
          <EdInput value={weatherIcon} onChange={setWeatherIcon} placeholder="☀️" />
        </EdField>
        <EdField label="天气描述">
          <EdInput value={weatherHint} onChange={setWeatherHint} placeholder="晴 18°C" />
        </EdField>

        <button
          onClick={handleSave}
          className="mt-2 w-full rounded-2xl py-2.5 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
        >
          保存
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="absolute inset-0 z-40" style={{ background: 'rgba(43,45,51,.32)' }} onClick={onClose} />
        <div className="absolute inset-x-0 bottom-0 z-41 max-h-[92%] overflow-y-auto rounded-t-3xl bg-white" style={{ boxShadow: '0 -12px 40px rgba(75,55,40,.22)', animation: 'sheetIn .34s var(--ease-spring)' }}>
          <div className="flex justify-center pt-2 pb-0"><div className="h-[5px] w-10 rounded-full bg-black/12" /></div>
          {content}
        </div>
      </>
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          width: 320,
          maxWidth: '90%',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
          overflow: 'hidden',
        }}
      >
        {content}
      </div>
    </div>
  )
}
