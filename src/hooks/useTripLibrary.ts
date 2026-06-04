import { useState, useCallback, useEffect } from 'react'
import type {
  Trip, IntegrityResult,
  ImportPreview, ConflictDecision,
} from '@/types'
import { readEnvelope, writeEnvelope, verifyEnvelope, getStorageStats } from '@/services/storage'
import { buildExportEnvelope, getExportFilename, downloadJSON } from '@/services/export'
import { validateEnvelope, detectConflicts, applyImport } from '@/services/import'

const TRIPS_KEY = 'tt_trips_v2'
const TRIPS_BACKUP_KEY = 'tt_trips_backup_v2'
const ACTIVE_KEY = 'tt_active_trip_v2'
const LEGACY_TRIPS_KEY = 'tt_trips_v1'
const LEGACY_ACTIVE_KEY = 'tt_active_trip_v1'

// ── helpers ──

function loadTrips(): Trip[] {
  // 1. Try v2 primary key (readEnvelope already verifies internally)
  const envelope = readEnvelope(TRIPS_KEY)
  if (envelope) return envelope.trips

  // 2. Try v2 backup key, restore primary if valid
  const backup = readEnvelope(TRIPS_BACKUP_KEY)
  if (backup) {
    writeEnvelope(TRIPS_KEY, backup.trips)
    return backup.trips
  }

  // 3. Try v1 legacy key, migrate to v2
  try {
    const raw = localStorage.getItem(LEGACY_TRIPS_KEY)
    if (raw) {
      const trips = JSON.parse(raw)
      if (Array.isArray(trips) && trips.length > 0) {
        const migrated = trips.map((t: Trip) => ({
          ...t,
          coverId: t.coverId ?? '',
          coverColor: t.coverColor ?? '#FF8A4C',
        }))
        writeEnvelope(TRIPS_KEY, migrated)
        writeEnvelope(TRIPS_BACKUP_KEY, migrated)
        return migrated
      }
    }
  } catch { /* v1 data corrupt */ }

  return []
}

function loadActiveId(trips: Trip[]): string {
  // Try v2 first
  try {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (id && trips.some(t => t.id === id)) return id
  } catch {}
  // Try legacy v1
  try {
    const id = localStorage.getItem(LEGACY_ACTIVE_KEY)
    if (id && trips.some(t => t.id === id)) return id
  } catch {}
  return trips[0]?.id ?? ''
}

// ── hook ──

export function useTripLibrary() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips)
  const [activeTripId, setActiveTripIdState] = useState<string>(() => loadActiveId(trips))
  const [importVersion, setImportVersion] = useState(0)

  // Persist trips (v2 envelope, primary + backup)
  useEffect(() => {
    writeEnvelope(TRIPS_KEY, trips)
    writeEnvelope(TRIPS_BACKUP_KEY, trips)
  }, [trips])

  // Persist active ID
  useEffect(() => {
    try { localStorage.setItem(ACTIVE_KEY, activeTripId) } catch {}
  }, [activeTripId])

  // ── existing API (unchanged signatures) ──

  const setActiveTrip = useCallback((id: string) => {
    setActiveTripIdState(id)
  }, [])

  const getTrip = useCallback((id: string): Trip | undefined => {
    return trips.find(t => t.id === id)
  }, [trips])

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
    return trip
  }, [])

  const deleteTrip = useCallback((id: string) => {
    setTrips(prev => {
      const next = prev.filter(t => t.id !== id)
      if (next.length === 0) {
        setActiveTripIdState('')
      } else if (id === activeTripId) {
        setActiveTripIdState(next[0].id)
      }
      return next
    })
  }, [activeTripId])

  // ── new API ──

  const exportTripsJSON = useCallback((tripIds?: string[]) => {
    const selected = tripIds
      ? trips.filter(t => tripIds.includes(t.id))
      : trips
    if (selected.length === 0) return
    const envelope = buildExportEnvelope(selected)
    const filename = getExportFilename(selected)
    downloadJSON(envelope, filename)
  }, [trips])

  const importTripsJSON = useCallback((json: string): ImportPreview | { error: string } => {
    let data: unknown
    try { data = JSON.parse(json) } catch {
      return { error: '文件格式无效：无法解析 JSON' }
    }
    const result = validateEnvelope(data)
    if (!result.ok) return { error: result.error }
    return detectConflicts(result.envelope.trips, trips)
  }, [trips])

  const resolveImportConflicts = useCallback((importTrips: Trip[], decisions: ConflictDecision[]) => {
    const newTrips = applyImport(importTrips, trips, decisions)
    setTrips(newTrips)
    setImportVersion(v => v + 1)
  }, [trips])

  const verifyIntegrity = useCallback((): IntegrityResult => {
    const envelope = readEnvelope(TRIPS_KEY)
    if (!envelope) return { ok: false, error: '未找到行程数据' }
    return verifyEnvelope(envelope)
  }, [])

  const clearTripData = useCallback(() => {
    const keys = [TRIPS_KEY, TRIPS_BACKUP_KEY, ACTIVE_KEY, LEGACY_TRIPS_KEY, LEGACY_ACTIVE_KEY]
    for (const k of keys) {
      try { localStorage.removeItem(k) } catch {}
    }
    setTrips([])
    setActiveTripIdState('')
  }, [])

  return {
    // existing
    trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip, setTrips,
    // new
    exportTripsJSON, importTripsJSON, resolveImportConflicts,
    getStorageStats, verifyIntegrity, clearTripData,
    importVersion,
  }
}

export default useTripLibrary
