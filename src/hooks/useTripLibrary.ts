import { useState, useCallback, useEffect } from 'react'
import type { Trip } from '@/types'

const TRIPS_KEY = 'tt_trips_v1'
const ACTIVE_KEY = 'tt_active_trip_v1'

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: Trip) => ({ ...t, coverId: t.coverId ?? '' }))
      }
    }
  } catch { /* ignore */ }
  return []
}

function saveTrips(trips: Trip[]) {
  try { localStorage.setItem(TRIPS_KEY, JSON.stringify(trips)) } catch { /* ignore */ }
}

function loadActiveId(trips: Trip[]): string {
  try {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (id && trips.some(t => t.id === id)) return id
  } catch { /* ignore */ }
  return trips[0]?.id ?? ''
}

function saveActiveId(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id) } catch { /* ignore */ }
}

export default function useTripLibrary() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips)
  const [activeTripId, setActiveTripIdState] = useState<string>(() => loadActiveId(loadTrips()))

  useEffect(() => { saveTrips(trips) }, [trips])

  const setActiveTrip = useCallback((id: string) => {
    setActiveTripIdState(id)
    saveActiveId(id)
  }, [])

  const saveTrip = useCallback((trip: Trip) => {
    setTrips(prev => {
      const idx = prev.findIndex(t => t.id === trip.id)
      if (idx === -1) return [...prev, trip]
      const next = [...prev]
      next[idx] = trip
      return next
    })
  }, [])

  const createTrip = useCallback((trip: Trip) => {
    setTrips(prev => [...prev, trip])
    setActiveTripIdState(trip.id)
    saveActiveId(trip.id)
    return trip
  }, [])

  const deleteTrip = useCallback((id: string) => {
    const next = trips.filter(t => t.id !== id)
    if (next.length === 0) {
      setTrips([])
      setActiveTripIdState('')
      saveActiveId('')
      return
    }
    const newActive = next.some(t => t.id === activeTripId) ? activeTripId : next[0].id
    setTrips(next)
    setActiveTripIdState(newActive)
    saveActiveId(newActive)
  }, [trips, activeTripId])

  const getTrip = useCallback((id: string) => {
    return trips.find(t => t.id === id)
  }, [trips])

  return { trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip, setTrips }
}
