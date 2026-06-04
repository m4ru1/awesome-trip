import { describe, it, expect, beforeEach } from 'vitest'
import {
  wrapEnvelope,
  readEnvelope,
  writeEnvelope,
  verifyEnvelope,
  getStorageStats,
} from '@/services/storage'
import type { Trip, StorageEnvelope } from '@/types'

const TRIPS_KEY = 'tt_trips_v2'

function makeTrip(overrides?: Partial<Trip>): Trip {
  return {
    id: 't-1',
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

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ── wrapEnvelope ──

  describe('wrapEnvelope', () => {
    it('wraps trips in a v2 envelope', () => {
      const trips = [makeTrip()]
      const env = wrapEnvelope(trips)

      expect(env.version).toBe(2)
      expect(env.trips).toEqual(trips)
      expect(env.tripCount).toBe(1)
      expect(typeof env.savedAt).toBe('number')
    })

    it('sets tripCount equal to trips.length', () => {
      const trips = [makeTrip({ id: 't-1' }), makeTrip({ id: 't-2' })]
      const env = wrapEnvelope(trips)

      expect(env.tripCount).toBe(2)
    })

    it('sets savedAt to current time', () => {
      const before = Date.now()
      const env = wrapEnvelope([makeTrip()])
      const after = Date.now()

      expect(env.savedAt).toBeGreaterThanOrEqual(before)
      expect(env.savedAt).toBeLessThanOrEqual(after)
    })
  })

  // ── readEnvelope + writeEnvelope ──

  describe('writeEnvelope / readEnvelope round-trip', () => {
    it('round-trips trips through write and read', () => {
      const trips = [makeTrip(), makeTrip({ id: 't-2', title: 'Trip 2' })]
      writeEnvelope(TRIPS_KEY, trips)

      const env = readEnvelope(TRIPS_KEY)
      expect(env).not.toBeNull()
      expect(env!.trips).toHaveLength(2)
      expect(env!.trips[0].title).toBe('Test Trip')
      expect(env!.trips[1].title).toBe('Trip 2')
    })

    it('preserves trip data fields through round-trip', () => {
      const trip = makeTrip({
        days: [{
          id: 'd-1', dateLabel: '6/1', weekday: '周一',
          weatherHint: '晴', weatherIcon: '☀️',
          blocks: [{
            id: 'b-1', type: 'sight' as const,
            startTime: '09:00', endTime: '11:30',
            status: 'planned' as const,
            primary: { id: 'o-1', name: '清水寺', emoji: '🏯', tags: [], address: '京都' },
            alternatives: [],
            transportToNext: [],
          }],
        }],
      })
      writeEnvelope(TRIPS_KEY, [trip])

      const env = readEnvelope(TRIPS_KEY)
      expect(env!.trips[0].days[0].blocks[0].primary.name).toBe('清水寺')
    })

    it('returns null when key does not exist', () => {
      const env = readEnvelope('nonexistent-key')
      expect(env).toBeNull()
    })
  })

  // ── verifyEnvelope ──

  describe('verifyEnvelope', () => {
    it('returns ok for a valid envelope', () => {
      const env = wrapEnvelope([makeTrip()])
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(true)
    })

    it('rejects version < 2', () => {
      const env = { version: 1, savedAt: Date.now(), tripCount: 0, trips: [] } as unknown as StorageEnvelope
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('version')
    })

    it('rejects non-number version', () => {
      const env = { version: '2', savedAt: Date.now(), tripCount: 0, trips: [] } as unknown as StorageEnvelope
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
    })

    it('rejects when trips is not an array', () => {
      const env = { version: 2, savedAt: Date.now(), tripCount: 0, trips: {} } as unknown as StorageEnvelope
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('not an array')
    })

    it('rejects when tripCount does not match trips.length', () => {
      const env = wrapEnvelope([makeTrip()])
      env.tripCount = 999
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('tripCount')
    })

    it('rejects a trip missing id', () => {
      const bad = makeTrip()
      ;(bad as any).id = undefined
      const env = wrapEnvelope([bad])
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('id')
    })

    it('rejects a trip missing title', () => {
      const bad = makeTrip()
      ;(bad as any).title = 123
      const env = wrapEnvelope([bad])
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('title')
    })

    it('rejects a trip missing days array', () => {
      const bad = makeTrip()
      ;(bad as any).days = 'not-an-array'
      const env = wrapEnvelope([bad])
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('days')
    })

    it('rejects a null trip in the array', () => {
      const env = wrapEnvelope([null as any])
      const result = verifyEnvelope(env)
      expect(result.ok).toBe(false)
    })
  })

  // ── readEnvelope auto-verification ──

  describe('readEnvelope integrity', () => {
    it('returns null for corrupted JSON', () => {
      localStorage.setItem(TRIPS_KEY, '{not valid json')
      const env = readEnvelope(TRIPS_KEY)
      expect(env).toBeNull()
    })

    it('returns null for JSON that is not an object', () => {
      localStorage.setItem(TRIPS_KEY, '"just a string"')
      const env = readEnvelope(TRIPS_KEY)
      expect(env).toBeNull()
    })

    it('returns null for an envelope that fails verification', () => {
      localStorage.setItem(TRIPS_KEY, JSON.stringify({ version: 2, savedAt: 0, tripCount: 0, trips: 'bad' }))
      const env = readEnvelope(TRIPS_KEY)
      expect(env).toBeNull()
    })
  })

  // ── getStorageStats ──

  describe('getStorageStats', () => {
    it('tracks only tt_* keys', () => {
      localStorage.setItem('tt_trips_v2', 'x')
      localStorage.setItem('tt_other', 'yy')
      localStorage.setItem('unrelated', 'zzz')

      const stats = getStorageStats()
      // 'x'.length * 2 = 2, 'yy'.length * 2 = 4 → total 6
      expect(stats.usedBytes).toBeGreaterThanOrEqual(4)
    })

    it('returns zero tripCount with empty storage', () => {
      const stats = getStorageStats()
      expect(stats.tripCount).toBe(0)
      expect(stats.tripSizes).toHaveLength(0)
    })

    it('parses individual trip sizes from tt_trips_v2', () => {
      const trips = [makeTrip({ title: 'Big Trip' }), makeTrip({ id: 't-2', title: 'Small' })]
      writeEnvelope(TRIPS_KEY, trips)

      const stats = getStorageStats()
      expect(stats.tripCount).toBe(2)
      expect(stats.tripSizes).toHaveLength(2)
      expect(stats.tripSizes[0].title).toBe('Big Trip')
      expect(stats.tripSizes[1].title).toBe('Small')
    })
  })
})
