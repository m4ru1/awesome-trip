const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface MarketplaceItem {
  id: string
  share_id: string
  share_code: string
  title: string
  destination: string
  party: string
  days_count: number
  cover_emoji: string
  cover_id: string
  cover_color: string
  published_at: number
  updated_at: number | null
  copy_count: number
  version: number
  publisher_nickname: string
  original_author: string | null
  original_share_id: string | null
  original_share_code: string | null
}

export interface PublishResult {
  share_id: string
  share_code: string
  token: string
  version: number
}

export interface SyncResult {
  version: number
  updated_at: number
}

export interface MarketTripResult {
  trip: Record<string, unknown>
  version: number
  updated_at: number
}

export async function fetchMarketplace(sort: 'newest' | 'popular' = 'newest', q?: string): Promise<MarketplaceItem[]> {
  const params = new URLSearchParams({ sort })
  if (q) params.set('q', q)
  const res = await fetch(`${BASE}/marketplace?${params}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '请求失败')
  }
  return res.json()
}

export async function fetchMarketTrip(shareId: string): Promise<MarketTripResult> {
  const res = await fetch(`${BASE}/marketplace/${shareId}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '行程不存在')
  }
  return res.json()
}

export async function publishTrip(
  trip: unknown,
  opts?: { publisher_nickname?: string; original_author?: string; original_share_id?: string; original_share_code?: string },
): Promise<PublishResult> {
  const res = await fetch(`${BASE}/marketplace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trip_json: JSON.stringify(trip),
      publisher_nickname: opts?.publisher_nickname || 'momo',
      original_author: opts?.original_author || undefined,
      original_share_id: opts?.original_share_id || undefined,
      original_share_code: opts?.original_share_code || undefined,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '发布失败')
  }
  return res.json()
}

export async function syncTrip(
  shareId: string,
  token: string,
  trip: unknown,
  opts?: { publisher_nickname?: string },
): Promise<SyncResult> {
  const res = await fetch(`${BASE}/marketplace/${shareId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      trip_json: JSON.stringify(trip),
      publisher_nickname: opts?.publisher_nickname,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '同步失败')
  }
  return res.json()
}

export async function unpublishTrip(shareId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/marketplace/${shareId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '取消发布失败')
  }
}

export async function incrementCopyCount(shareId: string): Promise<void> {
  await fetch(`${BASE}/marketplace/${shareId}/copy`, { method: 'POST' }).catch(() => {})
}
