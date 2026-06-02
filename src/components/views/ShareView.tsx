import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import type { Trip } from '@/types'
import { TYPE_META, SCENARIO_META, TRANSPORT_META } from '@/data/constants'
import { tripTotals } from '@/utils/totals'
import { parseTransportMin } from '@/utils/time'
import ImageTile from '@/components/ui/ImageTile'
import TypeTag from '@/components/ui/TypeTag'

interface Props { trip: Trip }

export default function ShareView({ trip }: Props) {
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()
  const totals = useMemo(() => tripTotals(trip), [trip])
  const [showAlts, setShowAlts] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <motion.div ref={rubberRef} className="overscroll-none h-full overflow-y-auto bg-paper2" style={{ y: rubberY }}>
      {/* Action bar */}
      <div className="sticky top-0 z-5 flex flex-wrap justify-center gap-2 bg-[rgba(251,239,226,.86)] p-3" style={{ backdropFilter: 'blur(8px)' }}>
        <button className="btn btn-primary" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }}>
          🔗 {copied ? '已复制只读链接！' : '复制只读链接'}
        </button>
        <button className="btn btn-ghost">📥 导出竖版长图</button>
        <label className="btn btn-ghost cursor-pointer">
          <input type="checkbox" checked={showAlts} onChange={e => setShowAlts(e.target.checked)} className="mr-1 accent-brand" />
          公开备选 Plan B
        </label>
      </div>

      <div className="mx-auto max-w-[460px] px-3.5 pb-12">
        {/* Postcard cover */}
        <div className="relative overflow-hidden rounded-3xl p-7 pb-6 text-white" style={{ background: 'linear-gradient(150deg, #FF8A4C 0%, #FF6B5C 60%, #F5A300 130%)', boxShadow: '0 14px 36px rgba(255,138,76,.3)' }}>
          <div className="absolute -top-5 -right-2.5 text-[150px] opacity-[.18]" style={{ transform: 'rotate(12deg)' }}>{trip.coverEmoji}</div>
          <div className="num text-[13px] font-semibold tracking-[3px] opacity-90">TRAVEL TIMETABLE</div>
          <h1 className="title-cn m-0 mt-2 text-[38px] leading-tight">{trip.title}</h1>
          <div className="mt-1.5 text-sm opacity-95">{trip.subtitle}</div>
          <div className="mt-[18px] flex flex-wrap gap-2">
            <span className="chip sticker" style={{ color: 'var(--color-brand)' }}>📍 {trip.destinationCity}</span>
            <span className="chip sticker num" style={{ color: 'var(--color-sight)' }}>{trip.dateRange}</span>
            <span className="chip sticker" style={{ color: 'var(--color-rest)' }}>🗓️ {trip.days.length} 天</span>
            <span className="chip sticker" style={{ color: 'var(--color-free)' }}>👫 {trip.party}</span>
          </div>
          <div className="mt-[18px] flex gap-[18px] border-t border-white/30 pt-4">
            <div><div className="num text-[22px] font-bold">¥{totals.money.toLocaleString()}</div><div className="text-[11px] opacity-90">预计人均花费</div></div>
            <div><div className="num text-[22px] font-bold">{Math.round(totals.sightMin / 60)}h</div><div className="text-[11px] opacity-90">观光时长</div></div>
            <div><div className="num text-[22px] font-bold">{Math.round(totals.transportMin / 60 * 10) / 10}h</div><div className="text-[11px] opacity-90">在路上</div></div>
          </div>
        </div>

        {/* Per day */}
        {trip.days.map((day, di) => (
          <div key={day.id} className="mt-[18px]">
            <div className="mx-1 mb-2.5 flex items-center gap-2.5">
              <span className="num flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white" style={{ boxShadow: '0 5px 12px rgba(255,107,92,.3)' }}>{di + 1}</span>
              <div className="flex-1">
                <span className="num text-[15px] font-bold">{day.dateLabel} <span className="text-xs text-ink2">{day.weekday}</span></span>
              </div>
              <span className="chip bg-white text-ink2 shadow-soft">{day.weatherIcon} {day.weatherHint}</span>
            </div>
            <div className="flex flex-col gap-0">
              {day.blocks.map(b => {
                const m = TYPE_META[b.type]
                const p = b.primary
                return (
                  <div key={b.id}>
                    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft" style={{ borderLeft: `5px solid ${m.color}` }}>
                      <div className="h-[58px] w-[58px] shrink-0"><ImageTile type={b.type} emoji={p.emoji} height={58} radius={13} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-[7px]">
                          <span className="num text-[13px] font-bold" style={{ color: m.color }}>{b.startTime}{b.endTime !== '次日' ? '–' + b.endTime : ''}</span>
                          <TypeTag type={b.type} />
                        </div>
                        <div className="clamp-1 mt-[3px] text-[15px] font-bold">{p.emoji} {p.name}</div>
                        <div className="clamp-2 mt-0.5 text-xs leading-snug text-ink2">{p.highlight}</div>
                        {showAlts && b.alternatives.length > 0 && (
                          <div className="mt-[7px] flex flex-wrap gap-1.5">
                            {b.alternatives.map((a, ai) => (
                              <span key={ai} className="chip text-[11px]" style={{ background: m.soft, color: m.color }}>
                                {a.swapReason ? SCENARIO_META[a.swapReason].emoji : '↔'} {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {b.transportToNext.length > 0 && (() => {
                      const segs = b.transportToNext.filter(t => t?.primary)
                      if (segs.length === 0) return null
                      const label = segs.length === 1
                        ? `${segs[0].primary.duration} · ${segs[0].primary.cost}`
                        : `${segs.map(t => (TRANSPORT_META[t.primary.mode] ?? { emoji: '•' }).emoji).join('→')} ${segs.reduce((s, t) => s + parseTransportMin(t.primary.duration), 0)}min`
                      return (
                        <div className="mx-auto my-1 flex items-center gap-1.5 text-[11px] text-ink2">
                          <span className="text-ink3">- -</span> {label}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-8 text-center text-ink2">
          <div className="text-3xl">{trip.coverEmoji}</div>
          <div className="title-cn mt-1 text-lg">祝旅途愉快</div>
          <div className="mt-0.5 text-xs">TRAVEL TIMETABLE · 旅行课程表</div>
        </div>
      </div>
    </motion.div>
  )
}
