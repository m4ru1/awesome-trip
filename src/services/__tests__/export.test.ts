import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Trip, ExportEnvelope } from '@/types'
import {
  buildExportEnvelope,
  sanitizeFilename,
  downloadJSON,
  getExportFilename,
} from '@/services/export'

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

describe('export service', () => {
  // ── buildExportEnvelope ──

  describe('buildExportEnvelope', () => {
    it('builds an envelope with correct shape', () => {
      const trips = [makeTrip()]
      const env = buildExportEnvelope(trips)

      expect(env.schemaVersion).toBe(1)
      expect(env.trips).toEqual(trips)
      expect(env.tripCount).toBe(1)
      expect(typeof env.appVersion).toBe('string')
      expect(typeof env.exportedAt).toBe('number')
    })

    it('accepts custom appVersion', () => {
      const env = buildExportEnvelope([makeTrip()], '2.0.0')
      expect(env.appVersion).toBe('2.0.0')
    })

    it('falls back to APP_VERSION from constants', () => {
      const env = buildExportEnvelope([makeTrip()])
      expect(env.appVersion).toBe('1.0.0')
    })

    it('preserves tripCount equal to trips.length', () => {
      const trips = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' }), makeTrip({ id: 'c' })]
      const env = buildExportEnvelope(trips)
      expect(env.tripCount).toBe(3)
    })
  })

  // ── sanitizeFilename ──

  describe('sanitizeFilename', () => {
    it('leaves clean names unchanged', () => {
      expect(sanitizeFilename('京都赏枫5日')).toBe('京都赏枫5日')
    })

    it('replaces forward slash', () => {
      expect(sanitizeFilename('京都/大阪')).toBe('京都-大阪')
    })

    it('replaces backslash', () => {
      expect(sanitizeFilename('京都\\大阪')).toBe('京都-大阪')
    })

    it('replaces colon', () => {
      expect(sanitizeFilename('京都:赏枫')).toBe('京都-赏枫')
    })

    it('replaces asterisk and question mark', () => {
      expect(sanitizeFilename('test*name?')).toBe('test-name-')
    })

    it('replaces angle brackets', () => {
      expect(sanitizeFilename('<test>')).toBe('-test-')
    })

    it('replaces pipe character', () => {
      expect(sanitizeFilename('a|b')).toBe('a-b')
    })

    it('replaces double quote', () => {
      expect(sanitizeFilename('"hello"')).toBe('-hello-')
    })

    it('merges consecutive hyphens', () => {
      expect(sanitizeFilename('a//b::c')).toBe('a-b-c')
    })

    it('handles empty string', () => {
      expect(sanitizeFilename('')).toBe('')
    })

    it('handles CJK characters', () => {
      expect(sanitizeFilename('東京・京都')).toBe('東京・京都')
    })
  })

  // ── downloadJSON ──

  describe('downloadJSON', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('creates a Blob and triggers download', () => {
      const env: ExportEnvelope = {
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: Date.now(),
        trips: [makeTrip()],
        tripCount: 1,
      }

      const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n)
      const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n)

      // Capture the click
      let clicked = false
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, _opts?: any) => {
        const el = origCreateElement(tag)
        if (tag === 'a') {
          vi.spyOn(el, 'click').mockImplementation(() => { clicked = true })
        }
        return el
      })

      downloadJSON(env, 'test-file.ajourney')

      expect(createObjectURL).toHaveBeenCalled()
      expect(clicked).toBe(true)
      expect(appendChild).toHaveBeenCalled()
      expect(removeChild).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    })

    it('sets correct download filename', () => {
      const env: ExportEnvelope = {
        schemaVersion: 1, appVersion: '1.0.0', exportedAt: Date.now(),
        trips: [makeTrip()], tripCount: 1,
      }

      let downloadAttr = ''
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, _opts?: any) => {
        const el = origCreateElement(tag)
        if (tag === 'a') {
          Object.defineProperty(el, 'download', {
            set(val: string) { downloadAttr = val },
            get() { return downloadAttr },
          })
          vi.spyOn(el, 'click').mockImplementation(() => {})
        }
        return el
      })
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n)
      vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n)

      downloadJSON(env, '京都赏楓.ajourney')
      expect(downloadAttr).toBe('京都赏楓.ajourney')
    })
  })

  // ── getExportFilename ──

  describe('getExportFilename', () => {
    it('uses sanitized trip title for single trip', () => {
      const filename = getExportFilename([makeTrip({ title: '京都赏枫5日' })])
      expect(filename).toMatch(/^京都赏枫5日-\d{8}\.ajourney$/)
    })

    it('sanitizes title in filename', () => {
      const filename = getExportFilename([makeTrip({ title: 'a/b:c' })])
      expect(filename).toMatch(/^a-b-c-\d{8}\.ajourney$/)
    })

    it('uses generic name for multiple trips', () => {
      const filename = getExportFilename([makeTrip({ id: 'a' }), makeTrip({ id: 'b' })])
      expect(filename).toMatch(/^全部行程-\d{8}\.ajourney$/)
    })

    it('uses generic name for zero trips', () => {
      const filename = getExportFilename([])
      expect(filename).toMatch(/^全部行程-\d{8}\.ajourney$/)
    })
  })
})
