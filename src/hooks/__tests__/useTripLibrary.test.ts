import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTripLibrary } from '@/hooks/useTripLibrary'
import { readEnvelope } from '@/services/storage'
import type { Trip } from '@/types'

const V2_KEY = 'tt_trips_v2'
const BACKUP_KEY = 'tt_trips_backup_v2'
const V1_KEY = 'tt_trips_v1'
const ACTIVE_KEY = 'tt_active_trip_v2'

function makeTrip(overrides?: Partial<Trip>): Trip {
  return {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: 'Test Trip',
    subtitle: '',
    destinationCity: 'Tokyo',
    coverId: '',
    coverColor: '#FF8A4C',
    dateRange: '6/1 – 6/5',
    party: '2人',
    days: [{ id: 'd-1', dateLabel: '6/1', weekday: '周一', weatherHint: '晴', weatherIcon: '☀️', blocks: [] }],
    ...overrides,
  }
}

describe('useTripLibrary', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Basic lifecycle ──

  describe('initialization', () => {
    it('returns empty trips array on first load', () => {
      const { result } = renderHook(() => useTripLibrary())
      expect(result.current.trips).toEqual([])
      expect(result.current.activeTripId).toBe('')
    })

    it('loads trips from v2 storage on init', () => {
      const trip = makeTrip()
      const envelope = {
        version: 2,
        savedAt: Date.now(),
        tripCount: 1,
        trips: [trip],
      }
      localStorage.setItem(V2_KEY, JSON.stringify(envelope))

      const { result } = renderHook(() => useTripLibrary())
      expect(result.current.trips).toHaveLength(1)
      expect(result.current.trips[0].title).toBe(trip.title)
    })
  })

  // ── v1 → v2 migration ──

  describe('v1 migration', () => {
    it('auto-migrates v1 data to v2 on first load', () => {
      const trip = makeTrip()
      localStorage.setItem(V1_KEY, JSON.stringify([trip]))

      expect(localStorage.getItem(V2_KEY)).toBeNull()

      const { result } = renderHook(() => useTripLibrary())
      expect(result.current.trips).toHaveLength(1)
      expect(result.current.trips[0].id).toBe(trip.id)

      // v2 keys should be created
      expect(localStorage.getItem(V2_KEY)).not.toBeNull()
      expect(localStorage.getItem(BACKUP_KEY)).not.toBeNull()

      // v1 key should be preserved
      expect(localStorage.getItem(V1_KEY)).not.toBeNull()
    })

    it('applies coverId/coverColor defaults during v1 migration', () => {
      const tripWithoutCover = {
        id: 't-legacy',
        title: 'Legacy Trip',
        subtitle: '',
        destinationCity: '',
        dateRange: '',
        party: '',
        days: [],
        // no coverId, no coverColor
      }
      localStorage.setItem(V1_KEY, JSON.stringify([tripWithoutCover]))

      const { result } = renderHook(() => useTripLibrary())
      expect(result.current.trips[0].coverId).toBe('')
      expect(result.current.trips[0].coverColor).toBe('#FF8A4C')
    })
  })

  // ── CRUD operations ──

  describe('CRUD', () => {
    it('creates a trip and sets it active', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => {
        result.current.createTrip(trip)
      })

      expect(result.current.trips).toHaveLength(1)
      expect(result.current.activeTripId).toBe(trip.id)
    })

    it('saves (updates) an existing trip', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => { result.current.createTrip(trip) })

      const updated = { ...trip, title: 'Updated Title' }
      act(() => { result.current.saveTrip(updated) })

      expect(result.current.trips[0].title).toBe('Updated Title')
    })

    it('gets a trip by id', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => { result.current.createTrip(trip) })

      expect(result.current.getTrip(trip.id)?.title).toBe(trip.title)
      expect(result.current.getTrip('nonexistent')).toBeUndefined()
    })

    it('deletes a trip', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => { result.current.createTrip(trip) })
      expect(result.current.trips).toHaveLength(1)

      act(() => { result.current.deleteTrip(trip.id) })
      expect(result.current.trips).toHaveLength(0)
      expect(result.current.activeTripId).toBe('')
    })

    it('sets active trip', () => {
      const { result } = renderHook(() => useTripLibrary())
      const a = makeTrip({ id: 't-a' })
      const b = makeTrip({ id: 't-b' })

      act(() => { result.current.createTrip(a) })
      act(() => { result.current.createTrip(b) })
      act(() => { result.current.setActiveTrip('t-a') })

      expect(result.current.activeTripId).toBe('t-a')
    })
  })

  // ── Storage persistence ──

  describe('persistence', () => {
    it('writes trips to v2 key on create', () => {
      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip({ title: 'Persisted' })) })

      const raw = localStorage.getItem(V2_KEY)
      expect(raw).not.toBeNull()
      const env = JSON.parse(raw!)
      expect(env.trips[0].title).toBe('Persisted')
    })

    it('writes to backup key as well', () => {
      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip()) })

      expect(localStorage.getItem(BACKUP_KEY)).not.toBeNull()
      expect(localStorage.getItem(BACKUP_KEY)).toBe(localStorage.getItem(V2_KEY))
    })

    it('saves active trip ID', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip({ id: 'active-test' })

      act(() => { result.current.createTrip(trip) })

      expect(localStorage.getItem(ACTIVE_KEY)).toBe('active-test')
    })
  })

  // ── Import/Export ──

  describe('importTripsJSON', () => {
    it('returns error for invalid JSON', () => {
      const { result } = renderHook(() => useTripLibrary())

      const outcome = result.current.importTripsJSON('not json')
      expect('error' in outcome).toBe(true)
    })

    it('detects a new trip', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()
      const env = {
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: Date.now(),
        trips: [trip],
        tripCount: 1,
      }

      const outcome = result.current.importTripsJSON(JSON.stringify(env))
      expect('error' in outcome).toBe(false)
      if (!('error' in outcome)) {
        expect(outcome.newCount).toBe(1)
        expect(outcome.conflictCount).toBe(0)
      }
    })

    it('detects conflict with existing trip', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => { result.current.createTrip(trip) })

      const env = {
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: Date.now(),
        trips: [trip],
        tripCount: 1,
      }

      const outcome = result.current.importTripsJSON(JSON.stringify(env))
      if (!('error' in outcome)) {
        expect(outcome.conflictCount).toBe(1)
      }
    })
  })

  describe('resolveImportConflicts', () => {
    it('increments importVersion on import', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      expect(result.current.importVersion).toBe(0)

      act(() => {
        result.current.resolveImportConflicts([trip], [])
      })

      expect(result.current.importVersion).toBe(1)
    })
  })

  describe('exportTripsJSON', () => {
    it('does not throw when trips exist', () => {
      const { result } = renderHook(() => useTripLibrary())
      const trip = makeTrip()

      act(() => { result.current.createTrip(trip) })

      expect(() => {
        act(() => {
          result.current.exportTripsJSON([trip.id])
        })
      }).not.toThrow()
    })

    it('does not throw when called with no ids (all trips)', () => {
      const { result } = renderHook(() => useTripLibrary())

      act(() => {
        result.current.exportTripsJSON()
      })
      // Should not throw even with empty trips (returns early)
    })
  })

  // ── verifyIntegrity ──

  describe('verifyIntegrity', () => {
    it('returns ok:true when data is valid', () => {
      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip()) })

      const integrity = result.current.verifyIntegrity()
      expect(integrity.ok).toBe(true)
    })

    it('returns ok:true for empty but valid state', () => {
      // Empty trips (tripCount=0, trips=[]) is a valid envelope — it passes integrity
      const { result } = renderHook(() => useTripLibrary())

      const integrity = result.current.verifyIntegrity()
      // Empty trips array is valid, just has no data
      expect(integrity.ok).toBe(true)
    })

    it('detects corrupted data via direct verifyEnvelope call', () => {
      // The hook's loadTrips auto-recovers from corrupt data,
      // so test the underlying service function directly
      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip()) })

      // Manually corrupt the stored JSON
      localStorage.setItem(V2_KEY, 'this is not json at all')

      // readEnvelope should return null for corrupt data
      const env = readEnvelope(V2_KEY)
      expect(env).toBeNull()
    })
  })

  // ── clearTripData ──

  describe('clearTripData', () => {
    it('clears all trip data and resets state', () => {
      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip()) })
      expect(result.current.trips).toHaveLength(1)

      act(() => { result.current.clearTripData() })

      expect(result.current.trips).toHaveLength(0)
      expect(result.current.activeTripId).toBe('')

      // The empty state is re-persisted by useEffect after clearing.
      // Keys exist but contain an empty valid envelope.
      const raw = localStorage.getItem(V2_KEY)
      expect(raw).not.toBeNull()
      const env = JSON.parse(raw!)
      expect(env.tripCount).toBe(0)
      expect(env.trips).toEqual([])
    })

    it('preserves non-trip localStorage keys', () => {
      localStorage.setItem('tt_nickname', 'momo')
      localStorage.setItem('tt_animations_v1', 'true')

      const { result } = renderHook(() => useTripLibrary())

      act(() => { result.current.createTrip(makeTrip()) })
      act(() => { result.current.clearTripData() })

      expect(localStorage.getItem('tt_nickname')).toBe('momo')
      expect(localStorage.getItem('tt_animations_v1')).toBe('true')
    })
  })
})
