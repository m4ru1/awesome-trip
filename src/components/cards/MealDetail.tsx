import type { ReactNode } from 'react'
import type { Option } from '@/types'
import DetailRow from '@/components/ui/DetailRow'
import TagRow from '@/components/ui/TagRow'
import BudgetDots from '@/components/ui/BudgetDots'
import MiniChip from '@/components/ui/MiniChip'

interface Props {
  option: Option
}

export default function MealDetail({ option: o }: Props): ReactNode {
  return (
    <div>
      <DetailRow label="菜系" value={o.cuisine || '—'} />
      <DetailRow
        label="人均花费"
        value={
          <>
            <span className="num" style={{ color: 'var(--color-meal)' }}>
              {o.perPersonCost || '—'}
            </span>
            &nbsp;
            <BudgetDots level={o.budgetLevel || 1} />
          </>
        }
      />
      {o.signatureDishes && o.signatureDishes.length > 0 && (
        <div
          style={{
            padding: '9px 0',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <div
            style={{
              color: 'var(--color-ink2)',
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            重点品尝
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {o.signatureDishes.map((d, i) => (
              <MiniChip key={i} color="#B57A00">
                🍽️ {d}
              </MiniChip>
            ))}
          </div>
        </div>
      )}
      <DetailRow
        label="是否预订"
        value={
          o.reservationNeeded ? (
            <span style={{ color: 'var(--color-brand)' }}>建议提前预订</span>
          ) : (
            '无需预订'
          )
        }
      />
      {o.tags && o.tags.length > 0 && (
        <div style={{ paddingTop: 10 }}>
          <TagRow tags={o.tags} color="var(--color-meal)" />
        </div>
      )}
    </div>
  )
}
