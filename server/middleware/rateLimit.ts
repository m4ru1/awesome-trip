import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import config from '../config'

interface Window {
  timestamps: number[]
}

const getStore = new Map<string, Window>()
const postStore = new Map<string, Window>()

function getKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown'
}

function slidingWindow(store: Map<string, Window>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  let w = store.get(key)
  if (!w) {
    w = { timestamps: [] }
    store.set(key, w)
  }
  // Evict expired
  w.timestamps = w.timestamps.filter(t => now - t < windowMs)
  if (w.timestamps.length >= limit) return false
  w.timestamps.push(now)
  return true
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now()
  for (const store of [getStore, postStore]) {
    for (const [key, w] of store) {
      w.timestamps = w.timestamps.filter(t => now - t < 5 * 60_000)
      if (w.timestamps.length === 0) store.delete(key)
    }
  }
}, 5 * 60_000)

export function rateLimitGet(req: Request, res: Response, next: NextFunction) {
  const key = getKey(req)
  if (!slidingWindow(getStore, key, config.rateLimit.getPerMin, 60_000)) {
    res.status(429).json({ error: '请求过于频繁，请稍后再试' })
    return
  }
  next()
}

export function rateLimitPost(req: Request, res: Response, next: NextFunction) {
  const key = getKey(req)
  if (!slidingWindow(postStore, key, config.rateLimit.postPerHour, 3_600_000)) {
    res.status(429).json({ error: '发布操作过于频繁，请稍后再试' })
    return
  }
  next()
}
