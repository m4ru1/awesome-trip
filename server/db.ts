import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import config from './config'

const dir = path.dirname(config.dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(config.dbPath)

db.pragma('journal_mode = WAL')
db.pragma('busy_timeout = 3000')

db.exec(`
  CREATE TABLE IF NOT EXISTS marketplace (
    id                TEXT PRIMARY KEY,
    trip_json         TEXT NOT NULL,
    title             TEXT NOT NULL,
    destination       TEXT NOT NULL,
    party             TEXT NOT NULL,
    days_count        INTEGER NOT NULL,
    cover_emoji       TEXT NOT NULL,
    published_at      INTEGER NOT NULL,
    copy_count        INTEGER DEFAULT 0,
    share_id          TEXT UNIQUE,
    share_code        TEXT UNIQUE,
    version           INTEGER DEFAULT 1,
    token_hash        TEXT,
    token_expires_at  INTEGER,
    publisher_nickname TEXT DEFAULT 'momo',
    original_author   TEXT,
    original_share_id TEXT,
    original_share_code TEXT,
    updated_at        INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_published_at ON marketplace(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_marketplace_copy_count ON marketplace(copy_count DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_share_id ON marketplace(share_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_share_code ON marketplace(share_code);
`)

// Safe migration for existing databases
function migrate() {
  const cols = db.prepare("PRAGMA table_info('marketplace')").all() as { name: string }[]
  const names = new Set(cols.map(c => c.name))
  const additions: string[] = []

  if (!names.has('share_id')) additions.push('ADD COLUMN share_id TEXT UNIQUE')
  if (!names.has('share_code')) additions.push('ADD COLUMN share_code TEXT UNIQUE')
  if (!names.has('version')) additions.push('ADD COLUMN version INTEGER DEFAULT 1')
  if (!names.has('token_hash')) additions.push('ADD COLUMN token_hash TEXT')
  if (!names.has('token_expires_at')) additions.push('ADD COLUMN token_expires_at INTEGER')
  if (!names.has('publisher_nickname')) additions.push("ADD COLUMN publisher_nickname TEXT DEFAULT 'momo'")
  if (!names.has('original_author')) additions.push('ADD COLUMN original_author TEXT')
  if (!names.has('original_share_id')) additions.push('ADD COLUMN original_share_id TEXT')
  if (!names.has('original_share_code')) additions.push('ADD COLUMN original_share_code TEXT')
  if (!names.has('updated_at')) additions.push('ADD COLUMN updated_at INTEGER')

  for (const add of additions) {
    try { db.exec(`ALTER TABLE marketplace ${add}`) } catch { /* column exists due to race */ }
  }
}
migrate()

export default db
