import { useState, useCallback, useMemo } from 'react'
import type { Trip } from '@/types'
import { publishTrip, syncTrip, unpublishTrip } from '@/api/marketplace'

const STORAGE_KEY = 'tt_published_v1'

interface PublishedInfo {
  share_id: string
  share_code: string
  token: string
  version: number
  snapshot: string // JSON.stringify(trip) at last sync/publish
}

type PublishedMap = Record<string, PublishedInfo>

function loadMap(): PublishedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMap(map: PublishedMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch { /* ignore */ }
}

export default function usePublished(showToast: (msg: string) => void) {
  const [map, setMap] = useState<PublishedMap>(loadMap)
  const [publishing, setPublishing] = useState(false)

  const updateMap = useCallback((fn: (prev: PublishedMap) => PublishedMap) => {
    setMap(prev => {
      const next = fn(prev)
      saveMap(next)
      return next
    })
  }, [])

  const getInfo = useCallback((tripId: string): PublishedInfo | null => {
    return map[tripId] ?? null
  }, [map])

  const isPublished = useCallback((tripId: string): boolean => {
    return !!map[tripId]
  }, [map])

  const isDirty = useCallback((trip: Trip): boolean => {
    const info = map[trip.id]
    if (!info) return false
    return JSON.stringify(trip) !== info.snapshot
  }, [map])

  const findByShareId = useCallback((shareId: string): PublishedInfo | null => {
    for (const key of Object.keys(map)) {
      if (map[key].share_id === shareId) return map[key]
    }
    return null
  }, [map])

  const handlePublish = useCallback(async (
    trip: Trip,
    opts?: { publisher_nickname?: string; original_author?: string; original_share_id?: string; original_share_code?: string },
  ) => {
    setPublishing(true)
    try {
      const result = await publishTrip(trip, opts)
      const snapshot = JSON.stringify(trip)
      updateMap(prev => ({
        ...prev,
        [trip.id]: {
          share_id: result.share_id, share_code: result.share_code,
          token: result.token, version: result.version, snapshot,
        },
      }))
      showToast('已发布到方案市场')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '发布失败')
      throw e
    } finally {
      setPublishing(false)
    }
  }, [showToast, updateMap])

  const handleSync = useCallback(async (trip: Trip, nickname?: string) => {
    const info = map[trip.id]
    if (!info) return
    setPublishing(true)
    try {
      const result = await syncTrip(info.share_id, info.token, trip, { publisher_nickname: nickname })
      const snapshot = JSON.stringify(trip)
      updateMap(prev => ({
        ...prev,
        [trip.id]: { ...info, version: result.version, snapshot },
      }))
      showToast('已同步到市场')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '同步失败')
      throw e
    } finally {
      setPublishing(false)
    }
  }, [map, showToast, updateMap])

  const handleUnpublish = useCallback(async (tripId: string) => {
    const info = map[tripId]
    if (!info) return
    setPublishing(true)
    try {
      await unpublishTrip(info.share_id, info.token)
      updateMap(prev => {
        const next = { ...prev }
        delete next[tripId]
        return next
      })
      showToast('已取消发布')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '取消发布失败')
      throw e
    } finally {
      setPublishing(false)
    }
  }, [map, showToast, updateMap])

  const updateSnapshot = useCallback((tripId: string, tripSnapshot: string) => {
    updateMap(prev => {
      const info = prev[tripId]
      if (!info) return prev
      return { ...prev, [tripId]: { ...info, snapshot: tripSnapshot } }
    })
  }, [updateMap])

  // Build a set of share_ids owned by this client for quick lookup
  const myShareIds = useMemo(() => {
    const ids = new Set<string>()
    for (const key of Object.keys(map)) {
      ids.add(map[key].share_id)
    }
    return ids
  }, [map])

  return {
    map,
    publishing,
    getInfo,
    isPublished,
    isDirty,
    findByShareId,
    myShareIds,
    updateSnapshot,
    handlePublish,
    handleSync,
    handleUnpublish,
  }
}
