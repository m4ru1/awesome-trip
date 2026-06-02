import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config'
import marketplace from './routes/marketplace'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Trust proxy for correct IP behind reverse proxy
app.set('trust proxy', 1)

// Body parsing
app.use(express.json({ limit: config.maxBodySize }))

// Cookie parsing for rate limiting
app.use(cookieParser())

// CORS
app.use((_req, res, next) => {
  const origin = _req.headers.origin
  if (origin && config.allowedOrigins.length > 0 && !config.allowedOrigins.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed' })
    return
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (_req.method === 'OPTIONS') {
    res.status(204).send()
    return
  }
  next()
})

// API routes
app.use('/api/marketplace', marketplace)

// Serve static files in production
const distPath = path.resolve(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`)
})
