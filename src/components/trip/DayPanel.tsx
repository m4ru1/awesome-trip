import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Day } from '@/types'
import { WEATHER_PRESETS } from '@/data/constants'
import EdInput from '@/components/ui/EdInput'
import EdField from '@/components/ui/EdField'
import EmojiPicker from '@/components/ui/EmojiPicker'
import NumberSpinner from '@/components/ui/NumberSpinner'
import CompactDatePicker from '@/components/ui/CompactDatePicker'

interface Props {
  dayIdx: number
  day: Day
  isMobile: boolean
  onClose: () => void
  onUpdate: (patch: Partial<Day>) => void
  onDelete?: () => void
  dayCount?: number
}

export default function DayPanel({ dayIdx, day, isMobile, onClose, onUpdate, onDelete, dayCount }: Props): ReactNode {
  const [weatherIcon, setWeatherIcon] = useState(day.weatherIcon)
  const [weatherHint, setWeatherHint] = useState(day.weatherHint)
  const [temperature, setTemperature] = useState<number | null>(day.temperature ?? null)
  const [subtitle, setSubtitle] = useState(day.subtitle ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSave = () => {
    onUpdate({ weatherIcon, weatherHint, temperature, subtitle: subtitle.trim() || undefined })
    onClose()
  }

  const content = (
    <div>
      <div className="flex items-center gap-3 rounded-t-none px-5 py-4" style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}>
        <span className="title-cn text-lg font-extrabold text-white">Day {dayIdx + 1}</span>
        <span className="flex-1" />
        <button onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-white/30 text-white">✕</button>
      </div>

      <div className="px-5 py-4">
        <EdField label="日期">
          <CompactDatePicker
            dateLabel={day.dateLabel}
            weekday={day.weekday}
            onChange={patch => onUpdate(patch)}
          />
        </EdField>

        <EdField label="小标题" hint="选填，15字以内">
          <EdInput value={subtitle} onChange={setSubtitle} placeholder="例如：咸阳西线、爬华山" />
        </EdField>

        <EdField label="天气">
          <div className="flex flex-wrap gap-2">
            {WEATHER_PRESETS.map(wp => {
              const active = weatherIcon === wp.emoji && weatherHint === wp.zh
              return (
                <button
                  key={wp.id}
                  onClick={() => { setWeatherIcon(wp.emoji); setWeatherHint(wp.zh) }}
                  className="cursor-pointer rounded-full px-3 py-2.5 text-[13px] font-bold transition-all duration-150"
                  style={{
                    border: `1.5px solid ${active ? 'var(--color-brand)' : 'var(--color-line)'}`,
                    background: active ? 'rgba(255,107,92,.12)' : '#fff',
                    color: active ? 'var(--color-brand)' : 'var(--color-ink2)',
                  }}
                >
                  {wp.emoji} {wp.zh}
                </button>
              )
            })}
          </div>
        </EdField>

        <EdField label="自定义图标" hint="不选预设时可手动输入">
          <EmojiPicker value={weatherIcon} onChange={setWeatherIcon} placeholder="☀️" />
        </EdField>

        <EdField label="温度" hint="选填">
          <NumberSpinner
            value={temperature}
            onChange={setTemperature}
            placeholder="不显示"
            min={-30}
            max={55}
            suffix="°C"
          />
        </EdField>

        <button
          onClick={handleSave}
          className="mt-2 w-full rounded-2xl py-2.5 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
        >
          保存
        </button>

        {onDelete && dayCount != null && dayCount > 1 && (
          <div className="mt-3 flex items-center justify-center">
            {confirmingDelete ? (
              <div className="flex gap-2">
                <button onClick={() => { onDelete(); setConfirmingDelete(false) }}
                  className="text-xs font-bold text-brand">确认删除 Day {dayIdx + 1}</button>
                <button onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-ink2">取消</button>
              </div>
            ) : (
              <button onClick={() => setConfirmingDelete(true)}
                className="text-xs text-ink3 opacity-60 hover:opacity-100 hover:text-brand">
                🗑️ 删除这一天
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="absolute inset-0 z-40" style={{ background: 'rgba(43,45,51,.32)' }} onClick={onClose} />
        <div className="overscroll-contain absolute inset-x-0 bottom-0 z-41 max-h-[92%] overflow-y-auto rounded-t-3xl bg-white" style={{ boxShadow: '0 -12px 40px rgba(75,55,40,.22)', animation: 'sheetIn .34s var(--ease-spring)', paddingBottom: 'var(--safe-bottom)' }}>
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
          width: 360,
          maxWidth: '90%',
          maxHeight: '90%',
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        {content}
      </div>
    </div>
  )
}
