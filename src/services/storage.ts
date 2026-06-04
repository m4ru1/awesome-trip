import type { Trip, StorageEnvelope, StorageStats, IntegrityResult } from '@/types'

export function wrapEnvelope(trips: Trip[]): StorageEnvelope {
  return {
    version: 2,
    savedAt: Date.now(),
    tripCount: trips.length,
    trips,
  }
}

export function readEnvelope(key: string): StorageEnvelope | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const envelope = data as StorageEnvelope
    const result = verifyEnvelope(envelope)
    if (!result.ok) return null
    return envelope
  } catch {
    return null
  }
}

export function writeEnvelope(key: string, trips: Trip[]): void {
  const envelope = wrapEnvelope(trips)
  localStorage.setItem(key, JSON.stringify(envelope))
}

export function verifyEnvelope(envelope: StorageEnvelope): IntegrityResult {
  if (typeof envelope.version !== 'number' || envelope.version < 2)
    return { ok: false, error: 'Unsupported or missing version' }
  if (!Array.isArray(envelope.trips))
    return { ok: false, error: 'trips is not an array' }
  if (envelope.trips.length !== envelope.tripCount)
    return { ok: false, error: 'tripCount does not match trips.length' }
  for (let i = 0; i < envelope.trips.length; i++) {
    const t = envelope.trips[i]
    if (!t || typeof t.id !== 'string')
      return { ok: false, error: `Trip at index ${i} is missing id` }
    if (typeof t.title !== 'string')
      return { ok: false, error: `Trip "${t.id}" is missing title` }
    if (!Array.isArray(t.days))
      return { ok: false, error: `Trip "${t.id}" is missing days array` }
  }
  return { ok: true }
}

export function getStorageStats(): StorageStats {
  const tripSizes: StorageStats['tripSizes'] = []
  let usedBytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('tt_')) {
      const value = localStorage.getItem(key) || ''
      usedBytes += value.length * 2 // UTF-16
    }
  }
  // Parse trip sizes from the primary key
  const envelope = readEnvelope('tt_trips_v2')
  if (envelope) {
    for (const t of envelope.trips) {
      tripSizes.push({ id: t.id, title: t.title, bytes: JSON.stringify(t).length * 2 })
    }
  }
  return {
    usedBytes,
    tripCount: tripSizes.length,
    tripSizes,
  }
}
