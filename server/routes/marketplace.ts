import { Router, type Request } from 'express'
import crypto from 'crypto'
import db from '../db'
import { rateLimitGet, rateLimitPost } from '../middleware/rateLimit'
import { validatePublish } from '../middleware/validate'
import { requireToken } from '../middleware/auth'

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function genShareCode(): string {
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)]
    if (!db.prepare('SELECT 1 FROM marketplace WHERE share_code = ?').get(code)) return code
  }
  return crypto.randomBytes(4).toString('base64url').toUpperCase().slice(0, 6)
}

const router = Router()

// List published trips (with optional search)
router.get('/', rateLimitGet, (_req, res) => {
  const q = typeof _req.query.q === 'string' ? _req.query.q.trim() : ''
  const sort = _req.query.sort === 'popular' ? 'copy_count DESC' : 'updated_at DESC, published_at DESC'
  const SELECT = `
    SELECT id, share_id, share_code, title, destination, party, days_count, cover_emoji,
           published_at, updated_at, copy_count, version,
           publisher_nickname, original_author, original_share_id, original_share_code
    FROM marketplace`
  const ORDER = `ORDER BY ${sort} LIMIT 20`

  let rows: unknown[]
  if (q) {
    const upper = q.toUpperCase()
    rows = db.prepare(`${SELECT} WHERE share_code = ? OR title LIKE ? ${ORDER}`).all(upper, `%${q}%`)
  } else {
    rows = db.prepare(`${SELECT} ${ORDER}`).all()
  }
  res.json(rows)
})

// Get a single published trip
router.get('/:shareId', rateLimitGet, (req, res) => {
  const row = db.prepare(
    'SELECT trip_json, version, updated_at FROM marketplace WHERE share_id = ?'
  ).get(req.params.shareId) as { trip_json: string; version: number; updated_at: number } | undefined
  if (!row) {
    res.status(404).json({ error: '行程不存在' })
    return
  }
  res.json({ trip: JSON.parse(row.trip_json), version: row.version, updated_at: row.updated_at })
})

// Publish a trip → creates share_id + token
router.post('/', rateLimitPost, validatePublish, (req, res) => {
  const { trip_json, publisher_nickname, original_author, original_share_id, original_share_code } = req.body
  const trip = JSON.parse(trip_json)

  const shareId = crypto.randomUUID()
  const shareCode = genShareCode()
  const rawToken = crypto.randomUUID()
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = Date.now()
  const tokenExpiresAt = now + 7 * 24 * 60 * 60 * 1000

  const stmt = db.prepare(`
    INSERT INTO marketplace (id, share_id, share_code, trip_json, title, destination, party,
      days_count, cover_emoji, published_at, updated_at, version,
      token_hash, token_expires_at, publisher_nickname,
      original_author, original_share_id, original_share_code, copy_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 0)
  `)
  stmt.run(
    trip.id,
    shareId,
    shareCode,
    trip_json,
    trip.title || '',
    trip.destinationCity || '',
    trip.party || '',
    trip.days?.length || 0,
    trip.coverEmoji || '🗺️',
    now,
    now,
    tokenHash,
    tokenExpiresAt,
    publisher_nickname || 'momo',
    original_author || null,
    original_share_id || null,
    original_share_code || null,
  )
  res.status(201).json({ share_id: shareId, share_code: shareCode, token: rawToken, version: 1 })
})

// Sync (update) a published trip
router.put('/:shareId', rateLimitPost, requireToken, (req, res) => {
  const { trip_json, publisher_nickname } = req.body
  const trip = JSON.parse(trip_json)
  const now = Date.now()

  const row = db.prepare('SELECT version FROM marketplace WHERE share_id = ?').get(req.params.shareId) as
    { version: number } | undefined
  if (!row) {
    res.status(404).json({ error: '分享不存在' })
    return
  }
  const newVersion = row.version + 1

  db.prepare(`
    UPDATE marketplace SET
      trip_json = ?, title = ?, destination = ?, party = ?, days_count = ?,
      cover_emoji = ?, updated_at = ?, version = ?,
      publisher_nickname = COALESCE(?, publisher_nickname)
    WHERE share_id = ?
  `).run(
    trip_json,
    trip.title || '',
    trip.destinationCity || '',
    trip.party || '',
    trip.days?.length || 0,
    trip.coverEmoji || '🗺️',
    now,
    newVersion,
    publisher_nickname || null,
    req.params.shareId,
  )
  res.json({ version: newVersion, updated_at: now })
})

// Unpublish → but keep share_id + token valid for re-publish
router.delete('/:shareId', rateLimitPost, requireToken, (req, res) => {
  const result = db.prepare('DELETE FROM marketplace WHERE share_id = ?').run(req.params.shareId)
  if (result.changes === 0) {
    res.status(404).json({ error: '分享不存在' })
    return
  }
  res.status(204).send()
})

// Increment copy count
router.post('/:shareId/copy', rateLimitGet, (req, res) => {
  db.prepare('UPDATE marketplace SET copy_count = copy_count + 1 WHERE share_id = ?').run(req.params.shareId)
  res.status(204).send()
})

export default router
