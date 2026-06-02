import type { Request, Response, NextFunction } from 'express'

export function validatePublish(req: Request, res: Response, next: NextFunction) {
  const { trip_json } = req.body

  if (!trip_json || typeof trip_json !== 'string') {
    res.status(400).json({ error: '缺少 trip_json 字段' })
    return
  }

  let trip: unknown
  try {
    trip = JSON.parse(trip_json)
  } catch {
    res.status(400).json({ error: 'trip_json 不是合法的 JSON' })
    return
  }

  if (!trip || typeof trip !== 'object') {
    res.status(400).json({ error: 'trip_json 格式错误' })
    return
  }

  const t = trip as Record<string, unknown>
  if (!t.id || typeof t.id !== 'string') {
    res.status(400).json({ error: '行程缺少 id' })
    return
  }
  if (!t.title || typeof t.title !== 'string') {
    res.status(400).json({ error: '行程缺少 title' })
    return
  }
  if (!Array.isArray(t.days)) {
    res.status(400).json({ error: '行程缺少 days 数组' })
    return
  }

  next()
}
