import { useState } from 'react'
import { motion } from 'motion/react'
import type { Trip, Day } from '@/types'
import { WEATHER_PRESETS } from '@/data/constants'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import { useAnimation } from '@/hooks/useAnimation'
import EdInput from '@/components/ui/EdInput'
import EdField from '@/components/ui/EdField'
import EmojiPicker from '@/components/ui/EmojiPicker'
import NumberSpinner from '@/components/ui/NumberSpinner'
import CompactDatePicker from '@/components/ui/CompactDatePicker'

interface Props {
  trip: Trip
  isMobile: boolean
  onClose: () => void
  onUpdateTrip: (patch: Partial<Trip>) => void
  onUpdateDay: (dayIdx: number, patch: Partial<Day>) => void
  onAddDay: () => void
  onDeleteDay: (dayIdx: number) => void
  onPickDay: (idx: number) => void
  allTrips?: Trip[]
  activeTripId?: string
  onSwitchTrip?: (id: string) => void
  onGoHome?: () => void
  onDuplicateTrip?: () => void
}

export default function TripPanel({ trip, isMobile, onClose, onUpdateTrip, onUpdateDay, onAddDay, onDeleteDay, onPickDay, allTrips, activeTripId, onSwitchTrip, onGoHome, onDuplicateTrip }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()
  const { enabled: animEnabled, tr: animTr } = useAnimation()

  const content = (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-none px-5 py-4" style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}>
        <span className="text-2xl">{trip.coverEmoji}</span>
        <span className="title-cn text-xl font-extrabold text-white">行程设置</span>
        <span className="flex-1" />
        <button onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-white/30 text-white">✕</button>
      </div>

      <div className="px-5 py-4">
        {/* Trip switcher */}
        {allTrips && allTrips.length > 1 && (
          <div className="mb-4">
            <button
              onClick={() => setShowSwitcher(s => !s)}
              className="flex w-full items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink2"
            >
              {'切换旅行'}
              <span style={{ transform: showSwitcher ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>{'▾'}</span>
            </button>
            {showSwitcher && (
              <div className="mt-2 rounded-2xl border border-line bg-white overflow-hidden">
                {allTrips.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { onSwitchTrip?.(t.id); setShowSwitcher(false) }}
                    className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left cursor-pointer"
                    style={{
                      background: t.id === activeTripId ? 'var(--color-paper2)' : '#fff',
                      borderBottom: '1px solid var(--color-line)',
                    }}
                  >
                    <span>{t.coverEmoji}</span>
                    <span className="text-sm font-bold text-ink">{t.title}</span>
                    <span className="text-xs text-ink3">{t.days.length}天</span>
                    {t.id === activeTripId && <span className="ml-auto text-xs text-ink3">(当前)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {onGoHome && (
          <div className="mb-4">
            <button
              onClick={onGoHome}
              className="flex w-full items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink2 cursor-pointer hover:border-brand hover:text-brand transition-colors duration-150"
            >
              {'← 返回主页'}
            </button>
          </div>
        )}

        {/* Trip meta */}
        <EdField label="标题"><EdInput value={trip.title} onChange={v => onUpdateTrip({ title: v })} /></EdField>
        <EdField label="副标题"><EdInput value={trip.subtitle} onChange={v => onUpdateTrip({ subtitle: v })} /></EdField>
        <EdField label="目的地"><EdInput value={trip.destinationCity} onChange={v => onUpdateTrip({ destinationCity: v })} /></EdField>
        <EdField label="出行人"><EdInput value={trip.party} onChange={v => onUpdateTrip({ party: v })} /></EdField>

        {/* Duplicate */}
        {onDuplicateTrip && (
          <div className="mb-4">
            <button
              onClick={() => { onDuplicateTrip(); onClose() }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink2 cursor-pointer hover:border-brand hover:text-brand transition-colors duration-150"
            >
              {'⧉ 复制此行程'}
            </button>
          </div>
        )}

        {/* Days */}
        <div className="mb-3 mt-5 flex items-center gap-2">
          <span className="text-sm font-bold text-ink">天数管理</span>
          <span className="num chip bg-paper2 text-xs">{trip.days.length} 天</span>
          <span className="flex-1" />
          <button onClick={onAddDay} className="btn btn-ghost text-xs">+ 加一天</button>
        </div>

        {trip.days.map((day, di) => (
          <div key={day.id} className="mb-2 rounded-2xl border border-line bg-white p-3">
            <div className="flex items-center gap-2">
              <button onClick={() => onPickDay(di)} className="num flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">D{di + 1}</button>
              <span className="text-xs text-ink2">{day.blocks.length} 项</span>
              <span className="flex-1" />
              {deleting === di ? (
                <div className="flex gap-1">
                  <button onClick={() => { onDeleteDay(di); setDeleting(null) }} className="text-xs font-bold text-brand">确认删除</button>
                  <button onClick={() => setDeleting(null)} className="text-xs text-ink2">取消</button>
                </div>
              ) : (
                trip.days.length > 1 && (
                  <button onClick={() => setDeleting(di)} className="cursor-pointer text-base text-ink3 opacity-50 hover:opacity-100">🗑️</button>
                )
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <EdField label="日期">
                <CompactDatePicker
                  dateLabel={day.dateLabel}
                  weekday={day.weekday}
                  onChange={patch => onUpdateDay(di, patch)}
                />
              </EdField>
              <EdField label="小标题"><EdInput value={day.subtitle ?? ''} onChange={v => onUpdateDay(di, { subtitle: v.trim() || undefined })} placeholder="活动概况" /></EdField>
            </div>
            <div className="mt-2">
              <EdField label="天气">
                <div className="flex flex-wrap gap-1.5">
                  {WEATHER_PRESETS.map(wp => {
                    const active = day.weatherIcon === wp.emoji && day.weatherHint === wp.zh
                    return (
                      <button
                        key={wp.id}
                        onClick={() => onUpdateDay(di, { weatherIcon: wp.emoji, weatherHint: wp.zh })}
                        className="cursor-pointer rounded-full px-2.5 py-[4px] text-[11.5px] font-bold transition-all duration-150"
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
            </div>
            <div className="mt-2">
              <EdField label="自定义图标" hint="不选预设时可手动输入">
                <EmojiPicker value={day.weatherIcon} onChange={v => onUpdateDay(di, { weatherIcon: v })} placeholder="☀️" />
              </EdField>
            </div>
            <div className="mt-2">
              <EdField label="温度" hint="选填">
                <NumberSpinner
                  value={day.temperature ?? null}
                  onChange={v => onUpdateDay(di, { temperature: v })}
                  placeholder="不显示"
                  min={-30}
                  max={55}
                  suffix="°C"
                />
              </EdField>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="absolute inset-0 z-50" style={{ background: 'rgba(43,45,51,.32)' }} onClick={onClose} />
        <div className="overscroll-contain absolute inset-x-0 bottom-0 z-60 max-h-[92%] overflow-y-auto rounded-t-3xl bg-white" style={{ boxShadow: '0 -12px 40px rgba(75,55,40,.22)', animation: 'sheetIn .34s var(--ease-spring)', paddingBottom: 'var(--safe-bottom)' }}>
          <div className="flex justify-center pt-2 pb-0"><div className="h-[5px] w-10 rounded-full bg-black/12" /></div>
          {content}
        </div>
      </>
    )
  }

  return (
    <>
      <motion.div
        className="absolute inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={animTr({ duration: 0.2 })}
        style={{ background: 'rgba(43,45,51,.28)' }}
        onClick={onClose}
      />
      <motion.div
        ref={rubberRef}
        className="absolute inset-y-0 right-0 z-41 w-[440px] max-w-[92vw] overflow-y-auto bg-white"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={animEnabled ? { type: 'spring', stiffness: 200, damping: 26, mass: 1 } : { duration: 0 }}
        style={{ y: rubberY, boxShadow: '-12px 0 40px rgba(75,55,40,.2)', overscrollBehaviorY: 'none' }}
      >
        {content}
      </motion.div>
    </>
  )
}
