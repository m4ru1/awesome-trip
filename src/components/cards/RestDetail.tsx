import type { ReactNode } from 'react'
import type { Option } from '@/types'
import DetailRow from '@/components/ui/DetailRow'
import Stars from '@/components/ui/Stars'
import MiniChip from '@/components/ui/MiniChip'

interface Props {
  option: Option
}

export default function RestDetail({ option: o }: Props): ReactNode {
  return (
    <div>
      <DetailRow
        label="每晚价"
        value={
          <span className="num" style={{ color: 'var(--color-rest)' }}>
            {o.pricePerNight || '—'}
          </span>
        }
      />
      <DetailRow label="评分" value={<Stars value={o.rating ?? 0} />} />
      <DetailRow
        label="入住 / 退房"
        value={
          <span className="num">
            {o.checkIn || '—'} / {o.checkOut || '—'}
          </span>
        }
      />
      {o.amenities && o.amenities.length > 0 && (
        <div style={{ padding: '9px 0' }}>
          <div
            style={{
              color: 'var(--color-ink2)',
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            设施
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {o.amenities.map((a, i) => (
              <MiniChip key={i} color="#0E7E72">
                ✓ {a}
              </MiniChip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
