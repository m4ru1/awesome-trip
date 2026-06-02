interface Props {
  baseline: { money: number; transportMin: number; sightMin: number }
  current: { money: number; transportMin: number; sightMin: number }
  affected: number
}

export default function DiffSummary({ baseline, current, affected }: Props) {
  const dMoney = current.money - baseline.money
  const dTime = current.transportMin - baseline.transportMin

  function pill(label: string, val: number, unit: '¥' | 'min', good: boolean) {
    const sign = val > 0 ? '+' : ''
    const color = val === 0 ? 'var(--color-ink2)' : (good ? '#0E9E70' : 'var(--color-brand)')
    return (
      <div className="min-w-[92px] rounded-[14px] bg-white px-3.5 py-2 text-center shadow-soft">
        <div className="text-[11px] text-ink2">{label}</div>
        <div className="num roll-num text-[17px] font-bold" style={{ color }} key={val}>
          {val === 0 ? '—' : sign + (unit === '¥' ? '¥' + Math.abs(val).toLocaleString() : val + unit)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {pill('总花费变化', dMoney, '¥', dMoney <= 0)}
      {pill('总交通耗时', dTime, 'min', dTime <= 0)}
      <div className="min-w-[92px] rounded-[14px] bg-white px-3.5 py-2 text-center shadow-soft">
        <div className="text-[11px] text-ink2">受影响的块</div>
        <div className="num roll-num text-[17px] font-bold" style={{ color: affected ? 'var(--color-sight)' : 'var(--color-ink2)' }} key={affected}>{affected} 个</div>
      </div>
    </div>
  )
}
