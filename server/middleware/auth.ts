import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import db from '../db'

const TOKEN_EXTEND_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function requireToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(403).json({ error: '缺少鉴权 token' })
    return
  }

  const raw = auth.slice(7)
  if (!raw) {
    res.status(403).json({ error: '无效 token' })
    return
  }

  const h = hashToken(raw)
  const row = db.prepare(
    'SELECT token_hash, token_expires_at FROM marketplace WHERE share_id = ?'
  ).get(req.params.shareId) as { token_hash: string; token_expires_at: number } | undefined

  if (!row) {
    res.status(404).json({ error: '分享不存在' })
    return
  }

  if (row.token_hash !== h) {
    res.status(403).json({ error: 'token 不匹配，无权操作' })
    return
  }

  if (Date.now() > row.token_expires_at) {
    res.status(403).json({ error: 'token 已过期，请重新发布' })
    return
  }

  // Extend token expiry on each valid request
  const newExpiry = Date.now() + TOKEN_EXTEND_MS
  db.prepare('UPDATE marketplace SET token_expires_at = ? WHERE share_id = ?').run(newExpiry, req.params.shareId)

  // Attach raw token to request for route handlers that need it
  ;(req as Request & { _token: string })._token = raw

  next()
}
