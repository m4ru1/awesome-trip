import type { Trip } from '@/types'

export function cloneTrip(trip: Trip): Trip {
  return JSON.parse(JSON.stringify(trip))
}

export function forkTrip(trip: Trip): Trip {
  const fresh = cloneTrip(trip)
  fresh.id = 't-' + Date.now()
  fresh.days.forEach(day => {
    day.blocks.forEach(block => {
      block.status = 'planned'
    })
  })
  return fresh
}
