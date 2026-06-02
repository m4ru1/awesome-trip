import type { ReactNode } from 'react'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
}

export default function NumberSpinner({ value, onChange, placeholder, min = -Infinity, max = Infinity, step = 1, suffix }: Props): ReactNode {
  const dec = () => {
    const cur = value ?? (placeholder ? 0 : min === -Infinity ? 0 : min)
    onChange(clamp(cur - step))
  }
  const inc = () => {
    const cur = value ?? (placeholder ? 0 : min === -Infinity ? 0 : min)
    onChange(clamp(cur + step))
  }
  const clamp = (v: number) => Math.max(min, Math.min(max, v))

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={dec}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-line bg-white text-base font-bold text-ink3 hover:border-brand hover:text-brand"
        style={{ transition: 'all .15s' }}
      >
        −
      </button>
      <div
        className="num flex h-[38px] flex-1 items-center justify-center rounded-xl border-[1.5px] border-line bg-white text-sm font-semibold"
        style={{ minWidth: 40 }}
      >
        {value != null ? `${value}${suffix ?? ''}` : <span className="text-ink3 font-normal">{placeholder ?? ''}</span>}
      </div>
      <button
        onClick={inc}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-line bg-white text-base font-bold text-ink3 hover:border-brand hover:text-brand"
        style={{ transition: 'all .15s' }}
      >
        +
      </button>
    </div>
  )
}
