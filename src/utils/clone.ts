import type { Trip } from '@/types'

export function cloneTrip(trip: Trip): Trip {
  return JSON.parse(JSON.stringify(trip))
}
