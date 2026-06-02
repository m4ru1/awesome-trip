import type { ReactNode } from 'react'
import type { Option, BlockType } from '@/types'
import SightDetail from '@/components/cards/SightDetail'
import MealDetail from '@/components/cards/MealDetail'
import RestDetail from '@/components/cards/RestDetail'
import FreeDetail from '@/components/cards/FreeDetail'

interface Props {
  option: Option
  type: BlockType
}

export default function OptionDetailBody({ option, type }: Props): ReactNode {
  switch (type) {
    case 'sight':
      return <SightDetail option={option} />
    case 'meal':
      return <MealDetail option={option} />
    case 'rest':
      return <RestDetail option={option} />
    case 'transport':
      return <FreeDetail option={option} />
    case 'free':
      return <FreeDetail option={option} />
    default:
      return null
  }
}
