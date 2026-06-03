import { useState } from 'react'
import type { ReactNode } from 'react'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function computeWeekday(dateLabel: string): string {
  const m = /(\d{1,2})\/(\d{1,2})/.exec(dateLabel)
  if (m) {
    const d = new Date(2025, +m[1] - 1, +m[2])
    return WEEKDAYS[d.getDay()]
  }
  return ''
}

interface Props {
  dateLabel: string
  weekday: string
  onChange: (patch: { dateLabel: string; weekday: string }) => void
}

export default function CompactDatePicker({ dateLabel, weekday, onChange }: Props): ReactNode {
  const [open, setOpen] = useState(false)
  const m = /(\d{1,2})\/(\d{1,2})/.exec(dateLabel)
  const curMonth = m ? +m[1] : 6
  const curDay = m ? +m[2] : 1
  const [selMonth, setSelMonth] = useState(curMonth)
  const [selDay, setSelDay] = useState(curDay)

  const handleConfirm = () => {
    const dl = `${selMonth}/${selDay}`
    const wd = computeWeekday(dl)
    onChange({ dateLabel: dl, weekday: wd })
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => {
          setSelMonth(curMonth)
          setSelDay(curDay)
          setOpen(o => !o)
        }}
        className="num flex h-[42px] w-full cursor-pointer items-center rounded-2xl border-[1.5px] border-line bg-white px-3 text-sm font-semibold text-ink hover:border-brand"
        style={{ transition: 'border-color .2s' }}
      >
        {dateLabel} · {weekday}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1002,
            background: 'rgba(0,0,0,.3)',
            animation: 'fadeIn .18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              borderRadius: 18,
              padding: '20px 18px 16px',
              width: 270,
              maxWidth: '92%',
              boxShadow: '0 16px 40px rgba(43,45,51,.25)',
              animation: 'floatIn .28s var(--ease-spring)',
            }}
          >
            <div className="text-sm font-bold text-ink mb-3">选择日期</div>

            {/* Month grid */}
            <div className="text-[11px] font-bold text-ink2 mb-1.5">月份</div>
            <div className="grid grid-cols-6 gap-1 mb-4">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <button
                  key={month}
                  onClick={() => setSelMonth(month)}
                  className="cursor-pointer rounded-[10px] py-2 text-[13px] font-bold transition-all"
                  style={{
                    border: `1.5px solid ${month === selMonth ? 'var(--color-brand)' : 'var(--color-line)'}`,
                    background: month === selMonth ? 'rgba(255,107,92,.12)' : '#fff',
                    color: month === selMonth ? 'var(--color-brand)' : 'var(--color-ink2)',
                  }}
                >
                  {month}月
                </button>
              ))}
            </div>

            {/* Day grid */}
            <div className="text-[11px] font-bold text-ink2 mb-1.5">日期</div>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => setSelDay(day)}
                  className="num cursor-pointer rounded-[10px] py-1.5 text-[13px] font-semibold transition-all"
                  style={{
                    border: `1.5px solid ${day === selDay ? 'var(--color-brand)' : 'transparent'}`,
                    background: day === selDay ? 'rgba(255,107,92,.12)' : '#fff',
                    color: day === selDay ? 'var(--color-brand)' : 'var(--color-ink)',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="num text-center text-sm font-bold text-brand mb-3">
              {selMonth}/{selDay} · {computeWeekday(`${selMonth}/${selDay}`)}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="btn btn-ghost text-sm">取消</button>
              <button onClick={handleConfirm} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--color-brand)' }}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
