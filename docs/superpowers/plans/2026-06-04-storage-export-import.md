# Trip 本地存储管理与导出迁移 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add v2 storage envelope with integrity checks, JSON export/import with conflict resolution, and a settings panel for storage management.

**Architecture:** `useTripLibrary` remains the sole public API. Three new internal service modules (`storage.ts`, `export.ts`, `import.ts`) provide pure helpers imported by the hook. UI is a SettingsPanel overlay + ExportDialog/ImportDialog modals, following existing TripCreateDialog/HelpOverlay patterns. Zero new dependencies.

**Tech Stack:** React 19, TypeScript, motion, Tailwind CSS, browser-native APIs (FileReader, Blob, crypto.subtle not used)

**Spec:** `docs/superpowers/specs/2026-06-04-storage-export-import-design.md`

---

## File Map

| File | Role |
|------|------|
| `src/types/index.ts` | New interfaces: StorageEnvelope, ExportEnvelope, StorageStats, IntegrityResult, ImportPreview, ImportPreviewItem, ConflictDecision |
| `src/data/constants.ts` | New: `APP_VERSION` |
| `src/services/storage.ts` | Envelope wrap/read/write/verify, getStorageStats |
| `src/services/export.ts` | buildExportEnvelope, sanitizeFilename, downloadJSON |
| `src/services/import.ts` | validateEnvelope, detectConflicts, applyImport |
| `src/hooks/useTripLibrary.ts` | Refactored: v2 keys, envelope save/load, v1→v2 migration, new API methods, importVersion |
| `src/components/settings/SettingsPanel.tsx` | Full-screen overlay with storage overview + actions |
| `src/components/settings/ExportDialog.tsx` | Modal: scope/format selection → download |
| `src/components/settings/ImportDialog.tsx` | Two-stage modal: file picker → preview/conflict resolution |
| `src/App.tsx` | Add showSettings state, importVersion effect, render SettingsPanel |
| `src/components/home/HomeView.tsx` | Add gear icon + onOpenSettings prop |

---

### Task 1: Add new types to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

**Verify:** `npx tsc --noEmit` (zero errors)

- [ ] **Step 1: Append new interfaces to types/index.ts**

Read the current `src/types/index.ts` to find the end of the file (after the last `Trip` interface), then append the following types:

```ts
// ─── Storage v2 ───
export interface StorageEnvelope {
  version: number
  savedAt: number
  tripCount: number
  trips: Trip[]
}

// ─── Export ───
export interface ExportEnvelope {
  schemaVersion: number         // current = 1
  appVersion: string
  exportedAt: number
  trips: Trip[]
  tripCount: number
}

// ─── Storage stats ───
export interface StorageStats {
  usedBytes: number
  tripCount: number
  tripSizes: { id: string; title: string; bytes: number }[]
}

export interface IntegrityResult {
  ok: boolean
  error?: string
}

// ─── Import ───
export type ImportStatus = 'new' | 'conflict'

export interface ImportPreviewItem {
  importTrip: Trip
  status: ImportStatus
  existingTrip?: Trip
}

export interface ImportPreview {
  items: ImportPreviewItem[]
  newCount: number
  conflictCount: number
}

export interface ConflictDecision {
  tripId: string
  action: 'keep-both' | 'overwrite'
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors (types reference existing `Trip` interface, no code changes)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add storage/export/import type definitions"
```

---

### Task 2: Create `src/services/storage.ts`

**Files:**
- Create: `src/services/storage.ts`

**Verify:** `npx tsc --noEmit`

- [ ] **Step 1: Create the file with all functions**

```ts
import type { Trip, StorageEnvelope, StorageStats } from '@/types'

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
    return data as StorageEnvelope
  } catch {
    return null
  }
}

export function writeEnvelope(key: string, trips: Trip[]): void {
  const envelope = wrapEnvelope(trips)
  localStorage.setItem(key, JSON.stringify(envelope))
}

export function verifyEnvelope(envelope: StorageEnvelope): boolean {
  if (typeof envelope.version !== 'number' || envelope.version < 2) return false
  if (!Array.isArray(envelope.trips)) return false
  if (envelope.trips.length !== envelope.tripCount) return false
  for (const t of envelope.trips) {
    if (!t || typeof t.id !== 'string' || typeof t.title !== 'string' || !Array.isArray(t.days)) {
      return false
    }
  }
  return true
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/services/storage.ts
git commit -m "feat: add storage v2 envelope read/write/verify + stats"
```

---

### Task 3: Create `src/services/export.ts`

**Files:**
- Create: `src/services/export.ts`

**Verify:** `npx tsc --noEmit`

- [ ] **Step 1: Create the file with all functions**

```ts
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
```

- [ ] **Step 2: Add APP_VERSION to constants.ts**

Read `src/data/constants.ts`, add after existing exports:

```ts
export const APP_VERSION = '1.0.0'
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/services/export.ts src/data/constants.ts
git commit -m "feat: add JSON export service with filename sanitization"
```

---

### Task 4: Create `src/services/import.ts`

**Files:**
- Create: `src/services/import.ts`

**Verify:** `npx tsc --noEmit`

- [ ] **Step 1: Create the file with all functions**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/services/import.ts
git commit -m "feat: add JSON import service with schema validation and conflict detection"
```

---

### Task 5: Refactor `src/hooks/useTripLibrary.ts`

**Files:**
- Modify: `src/hooks/useTripLibrary.ts`

**Verify:** `npx tsc --noEmit` + manual smoke test (app opens, existing trips load)

**Important:** This is the core change. Must maintain backward compatibility with existing callers in App.tsx.

- [ ] **Step 1: Rewrite useTripLibrary.ts**

Replace the entire file content:

```ts
import { useState, useCallback, useEffect } from 'react'
import type {
  Trip, StorageStats, IntegrityResult,
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
  // 1. Try v2 primary key
  let envelope = readEnvelope(TRIPS_KEY)
  if (envelope && verifyEnvelope(envelope)) return envelope.trips

  // 2. Try v2 backup key, restore primary if valid
  envelope = readEnvelope(TRIPS_BACKUP_KEY)
  if (envelope && verifyEnvelope(envelope)) {
    writeEnvelope(TRIPS_KEY, envelope.trips)
    return envelope.trips
  }

  // 3. Try v1 legacy key, migrate to v2
  try {
    const raw = localStorage.getItem(LEGACY_TRIPS_KEY)
    if (raw) {
      const trips = JSON.parse(raw)
      if (Array.isArray(trips) && trips.length > 0) {
        writeEnvelope(TRIPS_KEY, trips)
        writeEnvelope(TRIPS_BACKUP_KEY, trips)
        return trips
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
      return idx >= 0 ? prev.toSpliced(idx, 1, trip) : [...prev, trip]
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
    if (!verifyEnvelope(envelope)) return { ok: false, error: '数据完整性校验失败，建议从备份恢复' }
    return { ok: true }
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors. If errors about `toSpliced`, ensure tsconfig targets ES2023+.

- [ ] **Step 3: Manual smoke test**

1. Run `npm run dev`
2. Open app in browser — existing trips should load normally (v1→v2 auto migration)
3. Create a new trip, edit it, switch trips — all existing functionality should work
4. Check browser DevTools > Application > Local Storage — should see `tt_trips_v2` and `tt_trips_backup_v2` keys

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTripLibrary.ts
git commit -m "feat: refactor useTripLibrary to v2 storage envelope with export/import API"
```

---

### Task 6: Create `src/components/settings/SettingsPanel.tsx`

**Files:**
- Create: `src/components/settings/SettingsPanel.tsx`

**Verify:** `npx tsc --noEmit`

**Pattern:** Follow `HelpOverlay` pattern — full-screen fixed overlay with backdrop. The component takes callbacks for actions; state management lives in App.tsx.

- [ ] **Step 1: Create SettingsPanel.tsx**

```ts
import type { ReactNode } from 'react'
import type { StorageStats, IntegrityResult } from '@/types'

interface Props {
  stats: StorageStats | null
  integrity: IntegrityResult | null
  onVerifyIntegrity: () => void
  onExport: () => void
  onImport: () => void
  onClearData: () => void
  onClose: () => void
}

export default function SettingsPanel({
  stats, integrity, onVerifyIntegrity, onExport, onImport, onClearData, onClose,
}: Props): ReactNode {
  const pct = stats ? Math.min(stats.usedBytes / (5 * 1024 * 1024) * 100, 100) : 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px 22px',
          maxWidth: 400,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        {/* Header */}
        <div className="title-cn mb-5 flex items-center justify-between">
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>设置</span>
          <button onClick={onClose} className="btn btn-ghost h-8 w-8 !p-0 text-lg leading-none">&times;</button>
        </div>

        {/* Storage overview */}
        <div className="mb-5 rounded-xl border border-line bg-bg p-4">
          <div className="mb-2 text-[13px] font-bold text-ink">存储空间</div>
          <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-bg2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(pct, 2)}%`,
                background: pct > 80 ? 'linear-gradient(90deg, #FF8A4C, #FF6B5C)' : 'linear-gradient(90deg, #15B8A6, #4C7DFF)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink3">
            <span>{stats ? `${(stats.usedBytes / 1024).toFixed(1)} KB` : '...'}</span>
            <span>共 {stats?.tripCount ?? 0} 个行程</span>
          </div>
          {pct > 80 && (
            <div className="mt-2 rounded-lg border border-[#FF8A4C]/30 bg-[#FF8A4C]/5 px-2.5 py-1.5 text-[11px] text-[#CC6A30]">
              存储空间即将用尽，建议导出行程备份后清理
            </div>
          )}
        </div>

        {/* Trip sizes */}
        {stats && stats.tripSizes.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 text-[13px] font-bold text-ink">行程明细</div>
            <div className="space-y-1.5">
              {stats.tripSizes.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-xs">
                  <span className="font-semibold text-ink truncate mr-2">{t.title}</span>
                  <span className="shrink-0 text-ink3">{(t.bytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrity check */}
        <div className="mb-5 rounded-xl border border-line bg-bg p-4">
          <div className="mb-2 text-[13px] font-bold text-ink">数据完整性</div>
          <div className="flex items-center gap-2">
            <button onClick={onVerifyIntegrity} className="btn btn-ghost h-8 !px-3 text-xs font-bold">
              验证数据
            </button>
            {integrity && (
              <span
                className="text-xs font-bold"
                style={{ color: integrity.ok ? '#15B8A6' : '#FF6B5C' }}
              >
                {integrity.ok ? '✓ 数据正常' : `✗ ${integrity.error}`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-3 flex flex-col gap-2">
          <button onClick={onExport} className="btn btn-ghost justify-start !px-4 text-sm font-bold">
            导出行程
          </button>
          <button onClick={onImport} className="btn btn-ghost justify-start !px-4 text-sm font-bold">
            导入行程
          </button>
        </div>

        <div className="border-t border-line pt-3">
          <button
            onClick={onClearData}
            className="btn btn-ghost justify-start !px-4 text-sm font-bold text-[#FF6B5C]"
          >
            清除全部行程数据
          </button>
          <div className="mt-1 px-4 text-[11px] text-ink3">
            仅清除行程数据，不影响发布状态和应用偏好
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/SettingsPanel.tsx
git commit -m "feat: add SettingsPanel overlay with storage overview and actions"
```

---

### Task 7: Create `src/components/settings/ExportDialog.tsx`

**Files:**
- Create: `src/components/settings/ExportDialog.tsx`

**Verify:** `npx tsc --noEmit`

**Pattern:** Modal dialog following `TripCreateDialog` pattern.

- [ ] **Step 1: Create ExportDialog.tsx**

```ts
import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  tripCount: number
  currentTripTitle: string
  onExport: (scope: 'current' | 'all') => void
  onClose: () => void
}

export default function ExportDialog({
  open, tripCount, currentTripTitle, onExport, onClose,
}: Props): ReactNode {
  const [scope, setScope] = useState<'current' | 'all'>('current')

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px 22px',
          maxWidth: 380,
          width: '90%',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        <div className="title-cn mb-5" style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>
          导出行程
        </div>

        <div className="mb-4 space-y-2">
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand"
            style={{ borderColor: scope === 'current' ? 'var(--color-brand)' : undefined }}
            onClick={() => setScope('current')}
          >
            <input type="radio" name="scope" checked={scope === 'current'} onChange={() => setScope('current')}
              className="accent-brand" />
            <div>
              <div className="text-sm font-bold text-ink">当前行程</div>
              <div className="text-xs text-ink3">{currentTripTitle}</div>
            </div>
          </label>
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand"
            style={{ borderColor: scope === 'all' ? 'var(--color-brand)' : undefined }}
            onClick={() => setScope('all')}
          >
            <input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')}
              className="accent-brand" />
            <div>
              <div className="text-sm font-bold text-ink">全部行程</div>
              <div className="text-xs text-ink3">{tripCount} 个行程</div>
            </div>
          </label>
        </div>

        <div className="mb-4 rounded-lg bg-bg px-3 py-2 text-xs text-ink3">
          导出为 .ajourney 文件（JSON 格式），可用于备份或导入到其他设备
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            className="btn text-white"
            onClick={() => onExport(scope)}
            style={{
              background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)',
              boxShadow: '0 6px 16px rgba(255,107,92,.32)',
            }}
          >
            下载
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ExportDialog.tsx
git commit -m "feat: add ExportDialog modal with scope selection"
```

---

### Task 8: Create `src/components/settings/ImportDialog.tsx`

**Files:**
- Create: `src/components/settings/ImportDialog.tsx`

**Verify:** `npx tsc --noEmit`

**Pattern:** Two-stage modal following `TripCreateDialog` pattern.

- [ ] **Step 1: Create ImportDialog.tsx**

```ts
import { useState, useCallback } from 'react'
import type { ReactNode, ChangeEvent, DragEvent } from 'react'
import type { Trip, ImportPreview, ConflictDecision } from '@/types'

interface Props {
  open: boolean
  onImportFile: (json: string) => ImportPreview | { error: string }
  onConfirmImport: (importTrips: Trip[], decisions: ConflictDecision[]) => void
  onClose: () => void
}

type Stage = 'select' | 'preview' | 'conflict'

export default function ImportDialog({
  open, onImportFile, onConfirmImport, onClose,
}: Props): ReactNode {
  const [stage, setStage] = useState<Stage>('select')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importTrips, setImportTrips] = useState<Trip[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conflictDecisions, setConflictDecisions] = useState<ConflictDecision[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = onImportFile(reader.result as string)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setError(null)
      setPreview(result)
      // Extract trips from preview items
      const trips = result.items.map(i => i.importTrip)
      setImportTrips(trips)
      if (result.conflictCount > 0) {
        setConflictDecisions(
          result.items.map(item => ({
            tripId: item.importTrip.id,
            action: item.status === 'conflict' ? 'keep-both' as const : ('keep-both' as const),
          })),
        )
        setStage('conflict')
      } else {
        setStage('preview')
      }
    }
    reader.readAsText(file)
  }, [onImportFile])

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleConfirm = () => {
    onConfirmImport(importTrips, conflictDecisions)
    reset()
  }

  const reset = () => {
    setStage('select')
    setPreview(null)
    setImportTrips([])
    setError(null)
    setConflictDecisions([])
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px 22px',
          maxWidth: 420,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        <div className="title-cn mb-5 flex items-center justify-between">
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>导入行程</span>
          <button onClick={handleClose} className="btn btn-ghost h-8 w-8 !p-0 text-lg leading-none">&times;</button>
        </div>

        {stage === 'select' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-brand)' : 'var(--color-line)'}`,
                borderRadius: 14,
                padding: '32px 16px',
                textAlign: 'center',
                background: dragOver ? 'rgba(255,138,76,.05)' : 'var(--color-bg)',
                transition: 'all .15s ease',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('import-file-input')?.click()}
            >
              <div className="mb-2 text-3xl">📂</div>
              <div className="text-sm font-bold text-ink">点击或拖拽文件到此处</div>
              <div className="mt-1 text-xs text-ink3">支持 .ajourney / .json 文件</div>
              <input
                id="import-file-input"
                type="file"
                accept=".ajourney,.json"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
            {error && (
              <div className="mt-3 rounded-lg border border-[#FF6B5C]/30 bg-[#FF6B5C]/5 px-3 py-2 text-xs text-[#FF6B5C]">
                {error}
              </div>
            )}
          </>
        )}

        {stage === 'preview' && preview && (
          <>
            <div className="mb-4 rounded-xl bg-bg2/60 p-4 text-center">
              <div className="mb-1 text-lg font-extrabold text-ink">{preview.newCount} 个新行程</div>
              <div className="text-xs text-ink3">导入后将添加到你的行程列表</div>
            </div>
            <div className="mb-4 space-y-1.5">
              {preview.items.map(item => (
                <div key={item.importTrip.id} className="flex items-center gap-2.5 rounded-lg bg-bg px-3 py-2 text-sm">
                  <span className="text-green" style={{ color: '#15B8A6' }}>+</span>
                  <span className="font-semibold text-ink truncate">{item.importTrip.title}</span>
                  <span className="shrink-0 text-xs text-ink3">{item.importTrip.days.length}天</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={handleClose}>取消</button>
              <button
                className="btn text-white"
                onClick={handleConfirm}
                style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
              >
                确认导入
              </button>
            </div>
          </>
        )}

        {stage === 'conflict' && preview && (
          <>
            <div className="mb-1 text-sm font-bold text-ink">
              发现 {preview.conflictCount} 个行程冲突
            </div>
            <div className="mb-4 text-xs text-ink3">选择每个冲突行程的处理方式：</div>
            <div className="mb-4 space-y-2">
              {preview.items.filter(i => i.status === 'conflict').map((item, idx) => {
                const decision = conflictDecisions.find(d => d.tripId === item.importTrip.id)
                const action = decision?.action ?? 'keep-both'
                return (
                  <div key={item.importTrip.id} className="rounded-xl border border-[#F5A300]/40 bg-[#F5A300]/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-ink3">导入版</span>
                      <span className="text-sm font-bold text-ink">{item.importTrip.title}</span>
                      <span className="text-xs text-ink3">{item.importTrip.days.length}天</span>
                    </div>
                    {item.existingTrip && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-ink3">本地版</span>
                        <span className="text-sm font-bold text-ink">{item.existingTrip.title}</span>
                        <span className="text-xs text-ink3">{item.existingTrip.days.length}天</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`conflict-${item.importTrip.id}`}
                          checked={action === 'keep-both'}
                          onChange={() => {
                            setConflictDecisions(prev =>
                              prev.map(d => d.tripId === item.importTrip.id ? { ...d, action: 'keep-both' as const } : d),
                            )
                          }}
                          className="accent-brand"
                        />
                        保留两者
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`conflict-${item.importTrip.id}`}
                          checked={action === 'overwrite'}
                          onChange={() => {
                            setConflictDecisions(prev =>
                              prev.map(d => d.tripId === item.importTrip.id ? { ...d, action: 'overwrite' as const } : d),
                            )
                          }}
                          className="accent-brand"
                        />
                        覆盖本地
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Show new items too */}
            {preview.items.filter(i => i.status === 'new').length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-xs font-bold text-ink3">
                  新增 {preview.newCount} 个行程
                </div>
                <div className="space-y-1">
                  {preview.items.filter(i => i.status === 'new').map(item => (
                    <div key={item.importTrip.id} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-1.5 text-xs">
                      <span style={{ color: '#15B8A6' }}>+</span>
                      <span className="font-semibold text-ink">{item.importTrip.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={handleClose}>取消</button>
              <button
                className="btn text-white"
                onClick={handleConfirm}
                style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
              >
                确认导入
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ImportDialog.tsx
git commit -m "feat: add ImportDialog with two-stage file picker and conflict resolution"
```

---

### Task 9: Modify `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Verify:** `npx tsc --noEmit` + manual test (settings opens, export/import flows work)

**Changes:**
1. Destructure new API from `useTripLibrary`
2. Add `showSettings` state
3. Add `importVersion` useEffect to reload active trip
4. Add state for import flow (`importPreviewData`, `importError`)
5. Render `SettingsPanel`, `ExportDialog`, `ImportDialog`
6. Wire callbacks

- [ ] **Step 1: Update useTripLibrary destructuring (line 35)**

Read `src/App.tsx` line 35. Replace:
```tsx
const { trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip } = useTripLibrary()
```
With:
```tsx
const {
  trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip,
  exportTripsJSON, importTripsJSON, resolveImportConflicts,
  getStorageStats, verifyIntegrity, clearTripData,
  importVersion,
} = useTripLibrary()
```

- [ ] **Step 2: Add importVersion sync effect (after line 45)**

After the existing `useEffect(() => { if (trip?.id) saveTrip(trip) }, [trip, saveTrip])` line, add:

```tsx
// Reload active trip from library after import
useEffect(() => {
  if (activeTripId) {
    const fresh = getTrip(activeTripId)
    if (fresh) setTrip(structuredClone(fresh))
  }
}, [importVersion])
```

Note: `structuredClone` is available in all modern browsers. If the codebase only uses `JSON.parse(JSON.stringify(...))` via `cloneTrip`, use that instead:
```tsx
import { cloneTrip } from '@/utils/clone'
// ...
useEffect(() => {
  if (activeTripId) {
    const fresh = getTrip(activeTripId)
    if (fresh) setTrip(cloneTrip(fresh))
  }
}, [importVersion])
```

Place this right after the existing save sync effect (after line 45 current code).

- [ ] **Step 3: Add settings/export/import state (after line 78)**

After the existing `const [showCreateTrip, setShowCreateTrip] = useState(false)` line, add:

```tsx
const [showSettings, setShowSettings] = useState(false)
const [showExportDialog, setShowExportDialog] = useState(false)
const [showImportDialog, setShowImportDialog] = useState(false)
const [storageStats, setStorageStats] = useState<ReturnType<typeof getStorageStats> | null>(null)
const [integrityResult, setIntegrityResult] = useState<{ ok: boolean; error?: string } | null>(null)
```

- [ ] **Step 4: Add settings-related callbacks (in the useCallback section, around line 85-100)**

Add these callbacks near the other `handle*` functions:

```tsx
const handleOpenSettings = useCallback(() => {
  setStorageStats(getStorageStats())
  setIntegrityResult(null)
  setShowSettings(true)
}, [getStorageStats])

const handleVerifyIntegrity = useCallback(() => {
  const result = verifyIntegrity()
  setIntegrityResult(result)
}, [verifyIntegrity])

const handleExport = useCallback((scope: 'current' | 'all') => {
  if (scope === 'current' && trip?.id) {
    exportTripsJSON([trip.id])
  } else {
    exportTripsJSON()
  }
  setShowExportDialog(false)
}, [exportTripsJSON, trip])

const handleImportFile = useCallback((json: string) => {
  return importTripsJSON(json)
}, [importTripsJSON])

const handleConfirmImport = useCallback((importTrips: Trip[], decisions: ConflictDecision[]) => {
  resolveImportConflicts(importTrips, decisions)
  setShowImportDialog(false)
}, [resolveImportConflicts])

const handleClearData = useCallback(() => {
  clearTripData()
  setShowSettings(false)
  setTrip({
    id: '', title: '', subtitle: '', destinationCity: '',
    coverEmoji: '', coverId: '', coverColor: '#FF8A4C',
    dateRange: '', party: '', days: [],
  } as Trip)
  setView('home')
}, [clearTripData])
```

Note: `Trip` and `ConflictDecision` types need to be imported. Add to the existing import from `@/types`:
```tsx
import type { Trip, Day, Block, ..., ConflictDecision } from '@/types'
```
(Add `ConflictDecision` to the existing type import)

- [ ] **Step 5: Render SettingsPanel and dialogs**

Add after the `{showCreateTrip && ...}` block (around line 882):

```tsx
{showSettings && (
  <SettingsPanel
    stats={storageStats}
    integrity={integrityResult}
    onVerifyIntegrity={handleVerifyIntegrity}
    onExport={() => { setShowSettings(false); setShowExportDialog(true) }}
    onImport={() => { setShowSettings(false); setShowImportDialog(true) }}
    onClearData={handleClearData}
    onClose={() => setShowSettings(false)}
  />
)}

{showExportDialog && (
  <ExportDialog
    open={showExportDialog}
    tripCount={trips.length}
    currentTripTitle={trip?.title ?? ''}
    onExport={handleExport}
    onClose={() => setShowExportDialog(false)}
  />
)}

{showImportDialog && (
  <ImportDialog
    open={showImportDialog}
    onImportFile={handleImportFile}
    onConfirmImport={handleConfirmImport}
    onClose={() => setShowImportDialog(false)}
  />
)}
```

- [ ] **Step 6: Add imports at top of App.tsx**

Add component imports:

```tsx
import SettingsPanel from '@/components/settings/SettingsPanel'
import ExportDialog from '@/components/settings/ExportDialog'
import ImportDialog from '@/components/settings/ImportDialog'
```

In the existing type import from `@/types`, add `ConflictDecision`:

```tsx
import type { Trip, Day, Block, BlockType, Option, ConflictKind, ConflictDecision } from '@/types'
```

(Add only the new `ConflictDecision` — keep existing type imports as-is.)

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors. Fix any type issues.

- [ ] **Step 8: Manual smoke test**

1. `npm run dev`
2. Open Home page — verify existing trips load (v1→v2 migration)
3. Open Settings (gear icon not yet added, test via browser console: trigger showSettings)
4. Click "验证数据" — should show green check
5. Click "导出行程" → select scope → download — verify .ajourney file is valid JSON
6. Click "导入行程" → select the exported file — should show 1 conflict (same trip)
7. Choose "保留两者" → confirm — should create a duplicate trip
8. Verify storage stats display correct KB sizes

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire SettingsPanel, ExportDialog, ImportDialog into App.tsx"
```

---

### Task 10: Modify `src/components/home/HomeView.tsx`

**Files:**
- Modify: `src/components/home/HomeView.tsx`

**Verify:** `npx tsc --noEmit` + visual check (gear icon appears on Home page)

- [ ] **Step 1: Add onOpenSettings prop**

In `src/components/home/HomeView.tsx`, update the `Props` interface (around line 9-17) to add:

```tsx
interface Props {
  trips: Trip[]
  onSelectTrip: (id: string) => void
  onCreateTrip: () => void
  onDeleteTrip: (id: string) => void
  onForkTemplate?: () => void
  onDuplicateTrip?: (id: string) => void
  onOpenMarketplace?: () => void
  onOpenSettings?: () => void             // ← add this
}
```

- [ ] **Step 2: Add gear icon button in header**

In the header div (around line 35-52), add a gear button before the marketplace button:

```tsx
<div
  className="flex items-center gap-3 px-5 py-4 max-[860px]:gap-2 max-[860px]:px-3.5 max-[860px]:py-2.5"
  style={{ borderBottom: '1px solid var(--color-line)' }}
>
  <span className="title-cn flex-1 text-[22px] font-extrabold text-ink max-[860px]:text-[18px]">旅行课程表</span>
  <span className="text-2xl">{'✈️'}</span>
  {onOpenSettings && (
    <button onClick={onOpenSettings} className="btn btn-ghost h-9 w-9 !p-0 text-lg leading-none" title="设置">
      {'⚙'}
    </button>
  )}
  {onOpenMarketplace && (
    <button onClick={onOpenMarketplace} className="btn btn-ghost h-9 !px-3 text-sm font-bold">
      🏪 市场
    </button>
  )}
  {/* ... rest of header ... */}
```

- [ ] **Step 3: Destructure onOpenSettings in function signature**

Update the function signature (around line 28) to include `onOpenSettings`:

```tsx
export default function HomeView({
  trips, onSelectTrip, onCreateTrip, onDeleteTrip,
  onForkTemplate, onDuplicateTrip, onOpenMarketplace,
  onOpenSettings,
}: Props): ReactNode {
```

- [ ] **Step 4: Pass onOpenSettings from App.tsx**

Find where `HomeView` is rendered in `src/App.tsx` and add the prop:

```tsx
<HomeView
  // ... existing props
  onOpenSettings={handleOpenSettings}
/>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 6: Manual test**

1. Open app on home page — gear icon ⚙ should be visible in the header
2. Click it — SettingsPanel should open
3. Verify Export and Import buttons open their respective dialogs

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HomeView.tsx src/App.tsx
git commit -m "feat: add settings gear icon to HomeView header"
```

---

### Task 11: Final verification and edge case testing

**Verify:** `npx tsc --noEmit && npm run build`

- [ ] **Step 1: Full type-check and build**

Run: `npm run build`
Expected: clean build, zero errors

- [ ] **Step 2: Edge case — v1→v2 migration**

1. Open app that has existing v1 data (`tt_trips_v1` in localStorage)
2. Verify `tt_trips_v2` and `tt_trips_backup_v2` are created
3. Verify `tt_trips_v1` is still present (not deleted)
4. Refresh — trips should load from v2

- [ ] **Step 3: Edge case — integrity failure recovery**

1. Manually corrupt `tt_trips_v2` in DevTools (add garbage to JSON)
2. Refresh — app should load from `tt_trips_backup_v2`
3. Verify `tt_trips_v2` is restored

- [ ] **Step 4: Edge case — export/import round trip**

1. Export all trips
2. Clear all trip data via Settings
3. Import the exported file
4. Verify all trips are restored with original data

- [ ] **Step 5: Edge case — import while editing**

1. Open a trip in plan mode, make edits but don't save
2. Import a conflicting trip with "覆盖本地"
3. Verify the editing state resets to the imported version
4. No stale data overwrites the import

- [ ] **Step 6: Edge case — filename sanitization**

1. Create a trip with title containing special chars: `京都/东京: 2026`
2. Export — filename should be `京都-东京- 2026-YYYYMMDD.ajourney`
3. Verify the file downloads and is importable

- [ ] **Step 7: Edge case — clear data confirmation flow**

1. Click "清除全部行程数据"
2. Verify trip data keys are removed from localStorage
3. Verify `tt_nickname`, `tt_animations_v1`, `tt_seeded_v1` are still present
4. Verify app returns to home view

- [ ] **Step 8: Commit (if any fixes were made)**

```bash
git add -A
git commit -m "fix: edge case fixes from storage feature verification"
```
