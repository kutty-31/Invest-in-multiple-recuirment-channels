import { Router } from 'express'
import Candidate, { candidateStages } from '../models/Candidate.js'
import RecruitingChannel from '../models/RecruitingChannel.js'
import {
  escapeRegex,
  isRecord,
  isValidObjectId,
  parseLimit,
  parsePage,
} from '../utils/requestValidation.js'

const candidateFields = new Set([
  'fullName',
  'email',
  'role',
  'source',
  'stage',
  'qualityScore',
  'appliedAt',
  'hiredAt',
  'notes',
])
const router = Router()

function invalidFields(body) {
  return Object.keys(body).filter((field) => !candidateFields.has(field))
}

function parseDate(value, fieldName) {
  if (value === undefined) return { valid: true }
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return { valid: false, error: `${fieldName} must be a valid date.` }
  }
  return { valid: true, value: date }
}

async function channelExists(sourceId) {
  if (!isValidObjectId(sourceId)) return false
  return Boolean(await RecruitingChannel.exists({ _id: sourceId }))
}

router.get('/', async (request, response) => {
  const page = parsePage(request.query.page)
  const limit = parseLimit(request.query.limit)
  if (!page || !limit) {
    return response.status(400).json({ error: 'Page and limit must be positive integers.' })
  }

  const filter = {}
  if (request.query.stage !== undefined) {
    if (!candidateStages.includes(request.query.stage)) {
      return response.status(400).json({ error: `Stage must be one of: ${candidateStages.join(', ')}.` })
    }
    filter.stage = request.query.stage
  }
  if (request.query.source !== undefined) {
    if (!isValidObjectId(request.query.source)) {
      return response.status(400).json({ error: 'Source must be a valid recruiting channel ID.' })
    }
    filter.source = request.query.source
  }
  if (request.query.q !== undefined) {
    const query = request.query.q.trim()
    if (query.length > 100) {
      return response.status(400).json({ error: 'Search query cannot exceed 100 characters.' })
    }
    if (query) {
      const expression = new RegExp(escapeRegex(query), 'i')
      filter.$or = [{ fullName: expression }, { role: expression }, { email: expression }]
    }
  }

  const appliedFrom = parseDate(request.query.appliedFrom, 'appliedFrom')
  const appliedTo = parseDate(request.query.appliedTo, 'appliedTo')
  if (!appliedFrom.valid) return response.status(400).json({ error: appliedFrom.error })
  if (!appliedTo.valid) return response.status(400).json({ error: appliedTo.error })
  if (appliedFrom.value && appliedTo.value && appliedFrom.value > appliedTo.value) {
    return response.status(400).json({ error: 'appliedFrom cannot be later than appliedTo.' })
  }
  if (appliedFrom.value || appliedTo.value) {
    filter.appliedAt = {}
    if (appliedFrom.value) filter.appliedAt.$gte = appliedFrom.value
    if (appliedTo.value) filter.appliedAt.$lte = appliedTo.value
  }

  const [data, total] = await Promise.all([
    Candidate.find(filter)
      .populate('source', 'name type')
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    Candidate.countDocuments(filter),
  ])

  return response.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

router.post('/', async (request, response) => {
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }
  const unexpected = invalidFields(request.body)
  if (unexpected.length) {
    return response.status(400).json({ error: `Unsupported field: ${unexpected.join(', ')}.` })
  }
  if (!await channelExists(request.body.source)) {
    return response.status(422).json({ error: 'Source must refer to an existing recruiting channel.' })
  }

  const candidate = await Candidate.create(request.body)
  const populated = await candidate.populate('source', 'name type')
  return response.status(201).json({ data: populated })
})

router.get('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }

  const candidate = await Candidate.findById(request.params.id).populate('source', 'name type')
  if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })
  return response.json({ data: candidate })
})

router.patch('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }
  const unexpected = invalidFields(request.body)
  if (unexpected.length) {
    return response.status(400).json({ error: `Unsupported field: ${unexpected.join(', ')}.` })
  }
  if (!Object.keys(request.body).length) {
    return response.status(400).json({ error: 'Provide at least one candidate field to update.' })
  }
  if (request.body.source !== undefined && !await channelExists(request.body.source)) {
    return response.status(422).json({ error: 'Source must refer to an existing recruiting channel.' })
  }

  const candidate = await Candidate.findById(request.params.id)
  if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })
  candidate.set(request.body)
  await candidate.save()
  await candidate.populate('source', 'name type')
  return response.json({ data: candidate })
})

router.delete('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }

  const candidate = await Candidate.findByIdAndDelete(request.params.id)
  if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })
  return response.status(204).end()
})

export default router
