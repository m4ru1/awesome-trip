import type { ReactNode } from 'react'
import type { Option } from '@/types'
import DetailRow from '@/components/ui/DetailRow'
import TagRow from '@/components/ui/TagRow'

interface Props {
  option: Option
}

export default function FreeDetail({ option: o }: Props): ReactNode {
  return (
    <div>
      {o.address && <DetailRow label="地址" value={o.address} />}
      {o.openHours && <DetailRow label="开放时间" value={o.openHours} />}
      {o.ticketPrice && (
        <DetailRow
          label="门票"
          value={<span className="num">{o.ticketPrice}</span>}
        />
      )}
      {o.suggestedDuration && (
        <DetailRow label="建议时长" value={o.suggestedDuration} />
      )}
      {o.tags && o.tags.length > 0 && (
        <div style={{ paddingTop: 10 }}>
          <TagRow tags={o.tags} color="var(--color-free)" />
        </div>
      )}
    </div>
  )
}
