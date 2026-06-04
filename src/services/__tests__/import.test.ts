import { describe, it, expect } from 'vitest'
import type { Trip, ExportEnvelope, ImportPreview, ConflictDecision } from '@/types'
import { validateEnvelope, detectConflicts, applyImport } from '@/services/import'
import { forkTrip } from '@/utils/clone'

function makeTrip(overrides?: Partial<Trip>): Trip {
  return {
    id: 't-1',
    title: 'Test Trip',
    subtitle: '',
    destinationCity: '',
    coverId: '',
    coverColor: '#FF8A4C',
    dateRange: '',
    party: '',
    days: [{ id: 'd-1', dateLabel: '6/1', weekday: '周一', weatherHint: '晴', weatherIcon: '☀️', blocks: [] }],
    ...overrides,
  }
}

function makeExportEnvelope(trips: Trip[]): ExportEnvelope {
  return {
    schemaVersion: 1,
    appVersion: '1.0.0',
    exportedAt: Date.now(),
    trips,
    tripCount: trips.length,
  }
}

describe('import service', () => {
  // ── validateEnvelope ──

  describe('validateEnvelope', () => {
    it('accepts a valid envelope', () => {
      const env = makeExportEnvelope([makeTrip()])
      const result = validateEnvelope(env)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.envelope.trips).toHaveLength(1)
      }
    })

    it('rejects null', () => {
      const result = validateEnvelope(null)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('JSON')
    })

    it('rejects undefined', () => {
      const result = validateEnvelope(undefined)
      expect(result.ok).toBe(false)
    })

    it('rejects non-object', () => {
      const result = validateEnvelope('not an object')
      expect(result.ok).toBe(false)
    })

    it('rejects missing schemaVersion', () => {
      const result = validateEnvelope({ appVersion: '1', trips: [makeTrip()], tripCount: 1 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('schemaVersion')
    })

    it('rejects missing appVersion', () => {
      const result = validateEnvelope({ schemaVersion: 1, trips: [makeTrip()], tripCount: 1 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('appVersion')
    })

    it('rejects missing trips array', () => {
      const result = validateEnvelope({ schemaVersion: 1, appVersion: '1', tripCount: 0 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('行程')
    })

    it('rejects empty trips array', () => {
      const result = validateEnvelope({ schemaVersion: 1, appVersion: '1', trips: [], tripCount: 0 })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('不包含')
    })

    it('rejects tripCount mismatch', () => {
      const env = makeExportEnvelope([makeTrip()])
      env.tripCount = 5
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('tripCount')
    })

    it('rejects trip without id', () => {
      const bad = { title: 'no-id', days: [] }
      const env = { schemaVersion: 1, appVersion: '1', trips: [bad], tripCount: 1 }
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('必要字段')
    })

    it('rejects trip without title', () => {
      const bad = { id: 't-x', days: [] }
      const env = { schemaVersion: 1, appVersion: '1', trips: [bad], tripCount: 1 }
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('必要字段')
    })

    it('rejects trip without days array', () => {
      const bad = { id: 't-x', title: 'x' }
      const env = { schemaVersion: 1, appVersion: '1', trips: [bad], tripCount: 1 }
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('必要字段')
    })

    it('rejects null element in trips', () => {
      const env = makeExportEnvelope([null as any, makeTrip()])
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('数据无效')
    })

    it('handles multiple trips and fails on second bad one', () => {
      const env = makeExportEnvelope([makeTrip({ id: 'ok' }), { id: 'bad' } as any, makeTrip({ id: 'also-ok' })])
      const result = validateEnvelope(env)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('第 2')
    })
  })

  // ── detectConflicts ──

  describe('detectConflicts', () => {
    it('classifies all as new when no existing trips', () => {
      const imported = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' })]
      const result = detectConflicts(imported, [])

      expect(result.newCount).toBe(2)
      expect(result.conflictCount).toBe(0)
      expect(result.items[0].status).toBe('new')
      expect(result.items[1].status).toBe('new')
    })

    it('classifies all as conflict when all IDs match', () => {
      const existing = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' })]
      const imported = [makeTrip({ id: 'a', title: 'Updated A' }), makeTrip({ id: 'b', title: 'Updated B' })]

      const result = detectConflicts(imported, existing)
      expect(result.newCount).toBe(0)
      expect(result.conflictCount).toBe(2)
      expect(result.items[0].status).toBe('conflict')
      expect(result.items[0].existingTrip).toBeDefined()
    })

    it('handles mixed new and conflict', () => {
      const existing = [makeTrip({ id: 'existing' })]
      const imported = [makeTrip({ id: 'existing', title: 'Updated' }), makeTrip({ id: 'new' })]

      const result = detectConflicts(imported, existing)
      expect(result.newCount).toBe(1)
      expect(result.conflictCount).toBe(1)
    })

    it('returns correct shape for import preview', () => {
      const imported = [makeTrip({ id: 'a' })]
      const result: ImportPreview = detectConflicts(imported, [])

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('newCount')
      expect(result).toHaveProperty('conflictCount')
      expect(Array.isArray(result.items)).toBe(true)
    })
  })

  // ── applyImport ──

  describe('applyImport', () => {
    it('adds new trips to existing', () => {
      const existing = [makeTrip({ id: 'a' })]
      const imported = [makeTrip({ id: 'b' })]

      const result = applyImport(imported, existing, [])
      expect(result).toHaveLength(2)
      expect(result.map(t => t.id)).toContain('a')
      expect(result.map(t => t.id)).toContain('b')
    })

    it('overwrites existing trip on overwrite decision', () => {
      const existing = [makeTrip({ id: 'a', title: 'Old' })]
      const imported = [makeTrip({ id: 'a', title: 'New' })]

      const result = applyImport(imported, existing, [{ tripId: 'a', action: 'overwrite' }])
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('New')
    })

    it('forks on keep-both decision', () => {
      const existing = [makeTrip({ id: 'a', title: 'Original' })]
      const imported = [makeTrip({ id: 'a', title: 'Import Version' })]

      const result = applyImport(imported, existing, [{ tripId: 'a', action: 'keep-both' }])
      expect(result).toHaveLength(2)
      // The original stays
      expect(result[0].title).toBe('Original')
      expect(result[0].id).toBe('a')
      // The import gets a new ID (forked)
      expect(result[1].title).toBe('Import Version')
      expect(result[1].id).not.toBe('a')
      // All block statuses should be 'planned' after fork
      for (const day of result[1].days) {
        for (const block of day.blocks) {
          expect(block.status).toBe('planned')
        }
      }
    })

    it('handles overwrite for ID not in existing (fallback)', () => {
      const existing = [makeTrip({ id: 'a' })]
      const imported = [makeTrip({ id: 'unknown', title: 'New One' })]

      const result = applyImport(imported, existing, [{ tripId: 'unknown', action: 'overwrite' }])
      expect(result).toHaveLength(2)
    })

    it('preserves existing trip order', () => {
      const existing = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' })]
      const imported = [makeTrip({ id: 'c' })]

      const result = applyImport(imported, existing, [])
      expect(result[0].id).toBe('a')
      expect(result[1].id).toBe('b')
      expect(result[2].id).toBe('c')
    })

    it('handles empty imported array', () => {
      const existing = [makeTrip({ id: 'a' })]
      const result = applyImport([], existing, [])
      expect(result).toEqual(existing)
    })

    it('handles mixed decisions (overwrite + keep-both + new)', () => {
      const existing = [
        makeTrip({ id: 'conflict-a', title: 'Local A' }),
        makeTrip({ id: 'conflict-b', title: 'Local B' }),
      ]
      const imported = [
        makeTrip({ id: 'conflict-a', title: 'Import A' }),
        makeTrip({ id: 'conflict-b', title: 'Import B' }),
        makeTrip({ id: 'new-c', title: 'New C' }),
      ]
      const decisions: ConflictDecision[] = [
        { tripId: 'conflict-a', action: 'overwrite' },
        { tripId: 'conflict-b', action: 'keep-both' },
      ]

      const result = applyImport(imported, existing, decisions)
      // conflict-a: overwrite → 1 trip with new title
      // conflict-b: keep-both → 2 trips (original + forked import)
      // new-c: new → 1 additional trip
      expect(result).toHaveLength(4)
      expect(result.find(t => t.id === 'conflict-a')!.title).toBe('Import A')
      expect(result.find(t => t.id === 'conflict-b')!.title).toBe('Local B')
      expect(result.find(t => t.title === 'Import B')).toBeDefined()
      expect(result.find(t => t.title === 'New C')).toBeDefined()
    })
  })
})
