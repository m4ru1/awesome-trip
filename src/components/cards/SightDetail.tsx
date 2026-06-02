import type { ReactNode } from 'react'
import type { Option } from '@/types'
import DetailRow from '@/components/ui/DetailRow'
import TagRow from '@/components/ui/TagRow'

interface Props {
  option: Option
}

export default function SightDetail({ option: o }: Props): ReactNode {
  return (
    <div>
      <DetailRow label="地址" value={o.address || '—'} />
      <DetailRow label="开放时间" value={o.openHours || '—'} />
      <DetailRow
        label="门票"
        value={<span className="num">{o.ticketPrice || '—'}</span>}
      />
      <DetailRow label="建议时长" value={o.suggestedDuration || '—'} />
      {o.tags && o.tags.length > 0 && (
        <div style={{ paddingTop: 10 }}>
          <TagRow tags={o.tags} color="var(--color-sight)" />
        </div>
      )}
    </div>
  )
}
