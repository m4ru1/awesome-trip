import type { Option, BlockType } from '@/types'
import { TYPE_META } from '@/data/constants'
import ImageTile from '@/components/ui/ImageTile'

interface Props {
  option: Option
  type: BlockType
  dim?: boolean
  badge?: React.ReactNode
}

export default function OptionMiniCard({ option, type, dim, badge }: Props) {
  const m = TYPE_META[type]
  return (
    <div className="relative min-w-0 flex-1 rounded-[14px] border-[1.5px] border-line bg-white p-3"
      style={{ opacity: dim ? .62 : 1 }}>
      {badge && <div className="absolute -top-2 left-3">{badge}</div>}
      <div className="flex gap-2.5">
        <div className="h-11 w-11 shrink-0">
          <ImageTile type={type} emoji={option.emoji} height={44} radius={11} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="clamp-1 text-[13.5px] font-bold">{option.emoji} {option.name}</div>
          <div className="num mt-0.5 text-[11.5px] font-semibold" style={{ color: m.color }}>
            {option.perPersonCost ? `人均 ${option.perPersonCost}` : option.ticketPrice ? option.ticketPrice : option.pricePerNight ? `${option.pricePerNight}/晚` : '—'}
            {option.suggestedDuration ? ` · ${option.suggestedDuration}` : ''}
          </div>
        </div>
      </div>
      <div className="clamp-2 mt-1.5 text-[11.5px] leading-snug text-ink2">{option.highlight}</div>
    </div>
  )
}
