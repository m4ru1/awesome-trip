import { useState } from 'react'
import type { Trip, Day } from '@/types'
import EdInput from '@/components/ui/EdInput'
import EdField from '@/components/ui/EdField'

interface Props {
  trip: Trip
  isMobile: boolean
  onClose: () => void
  onUpdateTrip: (patch: Partial<Trip>) => void
  onUpdateDay: (dayIdx: number, patch: Partial<Day>) => void
  onAddDay: () => void
  onDeleteDay: (dayIdx: number) => void
  onPickDay: (idx: number) => void
}

export default function TripPanel({ trip, isMobile, onClose, onUpdateTrip, onUpdateDay, onAddDay, onDeleteDay, onPickDay }: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)

  const content = (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 rounded-t-none px-5 py-4" style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}>
        <span className="text-2xl">{trip.coverEmoji}</span>
        <span className="title-cn text-xl font-extrabold text-white">行程设置</span>
        <span className="flex-1" />
        <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border-none bg-white/30 text-white">✕</button>
      </div>

      <div className="overflow-y-auto px-5 py-4">
        {/* Trip meta */}
        <EdField label="标题"><EdInput value={trip.title} onChange={v => onUpdateTrip({ title: v })} /></EdField>
        <EdField label="副标题"><EdInput value={trip.subtitle} onChange={v => onUpdateTrip({ subtitle: v })} /></EdField>
        <EdField label="目的地"><EdInput value={trip.destinationCity} onChange={v => onUpdateTrip({ destinationCity: v })} /></EdField>
        <EdField label="出行人"><EdInput value={trip.party} onChange={v => onUpdateTrip({ party: v })} /></EdField>

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
              <EdField label="日期"><EdInput value={day.dateLabel} onChange={v => onUpdateDay(di, { dateLabel: v })} /></EdField>
              <EdField label="星期"><EdInput value={day.weekday} onChange={v => onUpdateDay(di, { weekday: v })} /></EdField>
              <EdField label="天气图标"><EdInput value={day.weatherIcon} onChange={v => onUpdateDay(di, { weatherIcon: v })} /></EdField>
              <EdField label="天气"><EdInput value={day.weatherHint} onChange={v => onUpdateDay(di, { weatherHint: v })} /></EdField>
            </div>
          </div>
        ))}
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
    <>
      <div className="absolute inset-0 z-40" style={{ background: 'rgba(43,45,51,.28)', animation: 'fadeIn .2s ease' }} onClick={onClose} />
      <div className="absolute inset-y-0 right-0 z-41 w-[440px] max-w-[92vw] overflow-y-auto bg-white" style={{ boxShadow: '-12px 0 40px rgba(75,55,40,.2)', animation: 'drawerIn .34s var(--ease-spring)' }}>
        {content}
      </div>
    </>
  )
}
