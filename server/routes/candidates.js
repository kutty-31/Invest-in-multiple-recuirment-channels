import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import { fileTypeFromBuffer } from 'file-type'
import Candidate, { candidateStages } from '../models/Candidate.js'
import { uploadResume } from '../middleware/resumeUpload.js'
import RecruitingChannel from '../models/RecruitingChannel.js'
import {
  escapeRegex,
  isRecord,
  isValidObjectId,
  parseLimit,
  parsePage,
} from '../utils/requestValidation.js'
import { readResume, removeResume, storeResume } from '../utils/resumeStorage.js'

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

function resumeName(originalName) {
  const normalized = path.posix.basename(originalName.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
  return normalized.slice(0, 255) || 'resume.pdf'
}

router.post('/:id/resume', async (request, response, next) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }

  const candidate = await Candidate.findById(request.params.id)
  if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })

  uploadResume(request, response, async (uploadError) => {
    if (uploadError) return next(uploadError)
    if (!request.file) {
      return response.status(400).json({ error: 'Choose a PDF resume to upload.' })
    }

    try {
      const detectedType = await fileTypeFromBuffer(request.file.buffer)
      if (detectedType?.mime !== 'application/pdf') {
        return response.status(415).json({ error: 'The uploaded file is not a valid PDF.' })
      }

      const storedFile = await storeResume(request.file.buffer)
      const previousResume = candidate.resume
      candidate.resume = {
        storageKey: storedFile.storageKey,
        originalName: resumeName(request.file.originalname),
        size: request.file.size,
        contentType: 'application/pdf',
        uploadedAt: new Date(),
      }

      try {
        await candidate.save()
      } catch (error) {
        await unlink(storedFile.filepath).catch((cleanupError) => {
          console.error('Unable to remove unreferenced resume after save failure:', cleanupError)
        })
        throw error
      }

      if (previousResume?.storageKey) {
        await removeResume(previousResume.storageKey).catch((cleanupError) => {
          console.error('Unable to remove replaced resume file:', cleanupError)
        })
      }
      return response.status(201).json({ data: candidate.resume })
    } catch (error) {
      return next(error)
    }
  })
})

router.get('/:id/resume', async (request, response, next) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }

  try {
    const candidate = await Candidate.findById(request.params.id)
    if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })
    if (!candidate.resume) return response.status(404).json({ error: 'Candidate has no resume.' })

    const contents = await readResume(candidate.resume.storageKey)
    response.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="resume.pdf"; filename*=UTF-8''${encodeURIComponent(candidate.resume.originalName)}`,
      'Content-Length': contents.length,
      'X-Content-Type-Options': 'nosniff',
    })
    return response.send(contents)
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id/resume', async (request, response, next) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Candidate ID is invalid.' })
  }

  try {
    const candidate = await Candidate.findById(request.params.id)
    if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })
    if (!candidate.resume) return response.status(404).json({ error: 'Candidate has no resume.' })

    const { storageKey } = candidate.resume
    candidate.resume = undefined
    await candidate.save()
    await removeResume(storageKey)
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
})

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

router.post('/bulk', async (request, response) => {
  if (!isRecord(request.body) || !Array.isArray(request.body.candidates)) {
    return response.status(400).json({ error: 'Request body must include a candidates array.' })
  }

  const { candidates } = request.body
  if (candidates.length < 1 || candidates.length > 100) {
    return response.status(400).json({ error: 'Provide between 1 and 100 candidates per request.' })
  }

  const invalidRecords = []
  for (const [index, candidate] of candidates.entries()) {
    if (!isRecord(candidate)) {
      invalidRecords.push({ index, error: 'Candidate must be a JSON object.' })
      continue
    }

    const unexpected = invalidFields(candidate)
    if (unexpected.length) {
      invalidRecords.push({ index, error: `Unsupported field: ${unexpected.join(', ')}.` })
    }
  }
  if (invalidRecords.length) {
    return response.status(400).json({
      error: 'One or more candidate records are invalid.',
      records: invalidRecords,
    })
  }

  const validSourceIds = [...new Set(
    candidates
      .map(({ source }) => source)
      .filter(isValidObjectId)
      .map((source) => source.toString()),
  )]
  const existingSourceIds = new Set(
    (await RecruitingChannel.find({ _id: { $in: validSourceIds } }).distinct('_id'))
      .map((source) => source.toString()),
  )
  const invalidSources = candidates.flatMap(({ source }, index) => (
    isValidObjectId(source) && existingSourceIds.has(source.toString())
      ? []
      : [{ index, error: 'Source must refer to an existing recruiting channel.' }]
  ))
  if (invalidSources.length) {
    return response.status(422).json({
      error: 'One or more candidate records have an invalid source.',
      records: invalidSources,
    })
  }

  const documents = candidates.map((candidate) => new Candidate(candidate))
  const validationResults = await Promise.allSettled(
    documents.map((candidate) => candidate.validate()),
  )
  const validationErrors = validationResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return []

    return [{
      index,
      fields: Object.fromEntries(
        Object.entries(result.reason.errors).map(([field, detail]) => [field, detail.message]),
      ),
    }]
  })
  if (validationErrors.length) {
    return response.status(400).json({
      error: 'Request validation failed.',
      records: validationErrors,
    })
  }

  const created = await Candidate.insertMany(documents)
  await Candidate.populate(created, { path: 'source', select: 'name type' })
  return response.status(201).json({ data: created, count: created.length })
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

router.put('/:id', async (request, response) => {
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
  if (!await channelExists(request.body.source)) {
    return response.status(422).json({ error: 'Source must refer to an existing recruiting channel.' })
  }

  const candidate = await Candidate.findById(request.params.id)
  if (!candidate) return response.status(404).json({ error: 'Candidate not found.' })

  const replacement = new Candidate(request.body)
  for (const field of candidateFields) {
    candidate.set(field, replacement.get(field))
  }
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
  if (candidate.resume?.storageKey) {
    await removeResume(candidate.resume.storageKey).catch((error) => {
      console.error('Unable to remove resume for deleted candidate:', error)
    })
  }
  return response.status(204).end()
})

export default router
