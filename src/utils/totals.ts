import type { Trip, Block, Day } from '@/types'
import { toMin, parseTransportMin, parseYen } from './time'

export function tripTotals(trip: Trip) {
  let money = 0
  let transportMin = 0
  let sightMin = 0
  for (const day of trip.days) {
    for (const b of day.blocks) {
      const p = b.primary
      money += parseYen(p.perPersonCost ?? '') + parseYen(p.ticketPrice ?? '') + parseYen(p.pricePerNight ?? '')
      for (const seg of b.transportToNext) {
        if (!seg.primary) continue
        money += parseYen(seg.primary.cost)
        transportMin += parseTransportMin(seg.primary.duration)
      }
      const s = toMin(b.startTime), e = toMin(b.endTime)
      if (b.type === 'sight' && s != null && e != null) sightMin += e - s
    }
  }
  return { money, transportMin, sightMin }
}

export function planBStats(trip: Trip): Array<{ dayIdx: number; blockIdx: number; block: Block; day: Day }> {
  const list: Array<{ dayIdx: number; blockIdx: number; block: Block; day: Day }> = []
  trip.days.forEach((day, di) => {
    day.blocks.forEach((b, bi) => {
      if (b.alternatives?.length) list.push({ dayIdx: di, blockIdx: bi, block: b, day })
    })
  })
  return list
}
