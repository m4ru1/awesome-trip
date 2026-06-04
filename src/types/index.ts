export type BlockType = 'sight' | 'meal' | 'rest' | 'transport' | 'free'
export type BlockStatus = 'planned' | 'done' | 'skipped'
export type TransportMode = 'walk' | 'subway' | 'bus' | 'taxi' | 'train' | 'flight' | 'bike'
export type SwapReason = 'rain' | 'save' | 'time' | 'closed' | 'like'
export type Mode = 'plan' | 'view' | 'execute' | 'share'
export type ConflictKind = 'open' | 'close'

// Cover illustration types
export type CoverCategory = 'city' | 'nature' | 'culture' | 'food' | 'coastal' | 'seasonal'

export interface CoverMeta {
  id: string
  name: string
  tags: string[]
  category: CoverCategory
  defaultColor: string
}

export interface CoverModule {
  meta: CoverMeta
  svg: (accentColor: string) => string
}

export interface Conflict {
  kind: ConflictKind
  msg: string
}

export interface TransportLeg {
  mode: TransportMode
  cost: string
  duration: string
  distance: string
  note?: string
}

export interface Transport {
  primary: TransportLeg
  alternatives: TransportLeg[]
}

export interface Option {
  id: string
  name: string
  emoji: string
  tags: string[]
  highlight?: string
  swapReason?: SwapReason
  address?: string
  openHours?: string
  ticketPrice?: string
  suggestedDuration?: string
  cuisine?: string
  perPersonCost?: string
  budgetLevel?: 1 | 2 | 3
  signatureDishes?: string[]
  reservationNeeded?: boolean
  pricePerNight?: string
  rating?: number
  checkIn?: string
  checkOut?: string
  amenities?: string[]
}

export interface Block {
  id: string
  type: BlockType
  startTime: string
  endTime: string
  status: BlockStatus
  primary: Option
  alternatives: Option[]
  transportToNext: Transport[]
  conflict?: Conflict | null
  _durMin?: number
}

export interface Day {
  id: string
  dateLabel: string
  weekday: string
  weatherHint: string
  weatherIcon: string
  temperature?: number | null
  subtitle?: string
  blocks: Block[]
}

export interface Trip {
  id: string
  title: string
  subtitle: string
  destinationCity: string
  coverEmoji?: string
  coverId: string
  coverColor: string
  dateRange: string
  party: string
  days: Day[]
}

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
