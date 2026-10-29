import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import analyticsRouter from './routes/analytics.js'
import authRouter from './routes/auth.js'
import candidatesRouter from './routes/candidates.js'
import channelsRouter from './routes/channels.js'
import { requireAuth } from './middleware/requireAuth.js'

const app = express()

app.disable('x-powered-by')
app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : true,
}))
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (request, response) => {
  const connected = mongoose.connection.readyState === 1
  return response.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database_unavailable',
    database: connected ? 'connected' : 'disconnected',
  })
})

app.use('/api/auth', authRouter)
app.use('/api/candidates', requireAuth, candidatesRouter)
app.use('/api/channels', requireAuth, channelsRouter)
app.use('/api/analytics', requireAuth, analyticsRouter)

app.use((request, response) => {
  response.status(404).json({ error: 'API route not found.' })
})

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error)

  if (error?.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' })
  }
  if (error?.name === 'ValidationError') {
    const fields = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [field, detail.message]),
    )
    return response.status(400).json({ error: 'Request validation failed.', fields })
  }
  if (error?.name === 'CastError') {
    return response.status(400).json({ error: `Invalid value for ${error.path}.` })
  }
  if (error?.code === 11000) {
    return response.status(409).json({ error: 'A record with that unique value already exists.' })
  }

  console.error('Unhandled API error:', error)
  return response.status(500).json({ error: 'An unexpected server error occurred.' })
})

export default app
