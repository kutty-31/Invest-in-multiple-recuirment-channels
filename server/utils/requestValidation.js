import mongoose from 'mongoose'

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parsePage(value) {
  if (value === undefined) return 1
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : null
}

function parseLimit(value) {
  if (value === undefined) return 50
  const limit = Number(value)
  return Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : null
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isValidObjectId(value) {
  return mongoose.isValidObjectId(value)
}

export { escapeRegex, isRecord, isValidObjectId, parseLimit, parsePage }
