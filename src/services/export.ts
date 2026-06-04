import type { Trip, ExportEnvelope } from '@/types'
import { APP_VERSION } from '@/data/constants'

export function buildExportEnvelope(trips: Trip[], appVersion?: string): ExportEnvelope {
  return {
    schemaVersion: 1,
    appVersion: appVersion ?? APP_VERSION,
    exportedAt: Date.now(),
    trips,
    tripCount: trips.length,
  }
}

const ILLEGAL_CHARS = /[\/\\:*?"<>|]/g

export function sanitizeFilename(title: string): string {
  return title.replace(ILLEGAL_CHARS, '-').replace(/-{2,}/g, '-')
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function downloadJSON(envelope: ExportEnvelope, filename: string): void {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getExportFilename(trips: Trip[]): string {
  const date = formatDate(new Date())
  if (trips.length === 1) {
    return `${sanitizeFilename(trips[0].title)}-${date}.ajourney`
  }
  return `全部行程-${date}.ajourney`
}
