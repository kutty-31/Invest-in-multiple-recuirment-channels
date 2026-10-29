import 'dotenv/config'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import mongoose from 'mongoose'
import app from './app.js'
import connectDatabase from './config/database.js'

async function startServer() {
  await connectDatabase()
  const port = Number(process.env.PORT) || 5000
  const server = app.listen(port, () => {
    console.info(`Talentwise API listening on port ${port}.`)
  })

  const shutdown = (signal) => {
    console.info(`${signal} received; closing the Talentwise API.`)
    server.close(async (error) => {
      if (error) {
        console.error('Failed to close the HTTP server cleanly:', error)
        process.exitCode = 1
      }

      try {
        await mongoose.disconnect()
      } catch (disconnectError) {
        console.error('Failed to disconnect from MongoDB cleanly:', disconnectError)
        process.exitCode = 1
      }
    })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
  return server
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (invokedPath === import.meta.url) {
  startServer().catch((error) => {
    console.error('Unable to start Talentwise API:', error)
    process.exitCode = 1
  })
}

export default startServer
