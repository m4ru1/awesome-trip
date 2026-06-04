import type { Trip, ExportEnvelope, ImportPreview, ImportPreviewItem, ConflictDecision } from '@/types'
import { forkTrip } from '@/utils/clone'

export function validateEnvelope(
  data: unknown,
): { ok: false; error: string } | { ok: true; envelope: ExportEnvelope } {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: '文件格式无效：不是有效的 JSON 对象' }
  }
  const obj = data as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number') {
    return { ok: false, error: '文件缺少 schemaVersion 字段' }
  }
  if (typeof obj.appVersion !== 'string') {
    return { ok: false, error: '文件缺少 appVersion 字段' }
  }
  if (!Array.isArray(obj.trips)) {
    return { ok: false, error: '文件中未找到行程数据' }
  }
  if (obj.trips.length === 0) {
    return { ok: false, error: '文件中不包含任何行程' }
  }
  if (typeof obj.tripCount !== 'number' || obj.tripCount !== obj.trips.length) {
    return { ok: false, error: '文件数据不完整：tripCount 与实际数量不匹配' }
  }
  for (let i = 0; i < obj.trips.length; i++) {
    const t = obj.trips[i]
    if (!t || typeof t !== 'object') {
      return { ok: false, error: `第 ${i + 1} 个行程数据无效` }
    }
    const trip = t as Record<string, unknown>
    if (typeof trip.id !== 'string' || typeof trip.title !== 'string' || !Array.isArray(trip.days)) {
      return { ok: false, error: `第 ${i + 1} 个行程「${String(trip.title || '未知')}」缺少必要字段` }
    }
  }

  return { ok: true, envelope: obj as unknown as ExportEnvelope }
}

export function detectConflicts(importTrips: Trip[], existingTrips: Trip[]): ImportPreview {
  const existingMap = new Map(existingTrips.map(t => [t.id, t]))
  const items: ImportPreviewItem[] = importTrips.map(importTrip => {
    const existingTrip = existingMap.get(importTrip.id)
    return {
      importTrip,
      status: existingTrip ? 'conflict' : 'new',
      existingTrip,
    }
  })
  return {
    items,
    newCount: items.filter(i => i.status === 'new').length,
    conflictCount: items.filter(i => i.status === 'conflict').length,
  }
}

export function applyImport(
  importTrips: Trip[],
  existingTrips: Trip[],
  decisions: ConflictDecision[],
): Trip[] {
  const decisionMap = new Map(decisions.map(d => [d.tripId, d.action]))
  const existingMap = new Map(existingTrips.map(t => [t.id, t]))
  const result = [...existingTrips]

  for (const importTrip of importTrips) {
    const decision = decisionMap.get(importTrip.id)
    if (decision === 'overwrite') {
      const idx = result.findIndex(t => t.id === importTrip.id)
      if (idx >= 0) {
        result[idx] = importTrip
      } else {
        result.push(importTrip)
      }
    } else if (existingMap.has(importTrip.id)) {
      // keep-both: fork with new ID
      result.push(forkTrip(importTrip))
    } else {
      // new trip
      result.push(importTrip)
    }
  }

  return result
}
