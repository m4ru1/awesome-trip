export function toMin(t: string): number | null {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function fmt(min: number): string {
  min = ((min % 1440) + 1440) % 1440
  const h = Math.floor(min / 60)
  const m = min % 60
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
}

export function parseTransportMin(s: string): number {
  if (!s) return 0
  const str = String(s)
  // Handle "Xh Ymin" or "XhYmin" format (e.g. "1h20min")
  const hm = str.match(/(\d+)\s*h\s*(\d+)\s*min/i)
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10)
  const m = str.match(/(\d+)\s*min/i)
  if (m) return parseInt(m[1], 10)
  const h = str.match(/(\d+(?:\.\d+)?)\s*小时/)
  if (h) return Math.round(parseFloat(h[1]) * 60)
  // Bare hour format "Xh" (e.g. "2h")
  const bh = str.match(/(\d+)\s*h\b/i)
  if (bh) return parseInt(bh[1], 10) * 60
  return 0
}

export function parseYen(s: string): number {
  if (!s) return 0
  const m = String(s).replace(/,/g, '').match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

export function parseOpenHours(s: string): { open: number; close: number } | null {
  if (!s) return null
  const m = String(s).match(/(\d{1,2}:\d{2})\s*[–\-~至]\s*(\d{1,2}:\d{2})/)
  if (!m) return null
  const open = toMin(m[1])
  const close = toMin(m[2])
  if (open === null || close === null) return null
  return { open, close }
}
