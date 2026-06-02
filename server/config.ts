const config = {
  port: Number(process.env.PORT) || 3000,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  rateLimit: {
    getPerMin: Number(process.env.RATE_LIMIT_GET_PER_MIN) || 60,
    postPerHour: Number(process.env.RATE_LIMIT_POST_PER_HOUR) || 10,
  },
  maxBodySize: Number(process.env.MAX_BODY_SIZE) || 1_048_576, // 1MB
  dbPath: process.env.DB_PATH || './data/marketplace.db',
}

export default config
