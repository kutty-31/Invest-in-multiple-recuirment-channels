import { Router } from 'express'
import Candidate from '../models/Candidate.js'
import RecruitingChannel from '../models/RecruitingChannel.js'
import { isRecord, isValidObjectId, parseLimit, parsePage } from '../utils/requestValidation.js'

const channelFields = new Set(['name', 'type', 'monthlySpend', 'isActive', 'description'])
const router = Router()

function invalidFields(body, allowedFields) {
  return Object.keys(body).filter((field) => !allowedFields.has(field))
}

router.get('/', async (request, response) => {
  const page = parsePage(request.query.page)
  const limit = parseLimit(request.query.limit)
  if (!page || !limit) {
    return response.status(400).json({ error: 'Page and limit must be positive integers.' })
  }

  const filter = {}
  if (request.query.isActive !== undefined) {
    if (!['true', 'false'].includes(request.query.isActive)) {
      return response.status(400).json({ error: 'isActive must be true or false.' })
    }
    filter.isActive = request.query.isActive === 'true'
  }

  const [data, total] = await Promise.all([
    RecruitingChannel.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RecruitingChannel.countDocuments(filter),
  ])

  return response.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

router.get('/:id/candidates', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Channel ID is invalid.' })
  }

  const page = parsePage(request.query.page)
  const limit = parseLimit(request.query.limit)
  if (!page || !limit) {
    return response.status(400).json({ error: 'Page and limit must be positive integers.' })
  }

  const [channel, total] = await Promise.all([
    RecruitingChannel.findById(request.params.id).populate({
      path: 'candidates',
      select: 'fullName email role source stage qualityScore appliedAt hiredAt',
      options: { sort: { appliedAt: -1 }, skip: (page - 1) * limit, limit },
    }),
    Candidate.countDocuments({ source: request.params.id }),
  ])
  if (!channel) return response.status(404).json({ error: 'Recruiting channel not found.' })

  return response.json({
    data: {
      channel: {
        _id: channel._id,
        name: channel.name,
        type: channel.type,
        isActive: channel.isActive,
        monthlySpend: channel.monthlySpend,
      },
      candidates: channel.candidates,
    },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

router.post('/', async (request, response) => {
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }
  const unexpected = invalidFields(request.body, channelFields)
  if (unexpected.length) {
    return response.status(400).json({ error: `Unsupported field: ${unexpected.join(', ')}.` })
  }

  const channel = await RecruitingChannel.create(request.body)
  return response.status(201).json({ data: channel })
})

router.get('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Channel ID is invalid.' })
  }

  const channel = await RecruitingChannel.findById(request.params.id).lean()
  if (!channel) return response.status(404).json({ error: 'Recruiting channel not found.' })
  return response.json({ data: channel })
})

router.patch('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Channel ID is invalid.' })
  }
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }
  const unexpected = invalidFields(request.body, channelFields)
  if (unexpected.length) {
    return response.status(400).json({ error: `Unsupported field: ${unexpected.join(', ')}.` })
  }
  if (!Object.keys(request.body).length) {
    return response.status(400).json({ error: 'Provide at least one channel field to update.' })
  }

  const channel = await RecruitingChannel.findByIdAndUpdate(
    request.params.id,
    { $set: request.body },
    { new: true, runValidators: true },
  )
  if (!channel) return response.status(404).json({ error: 'Recruiting channel not found.' })
  return response.json({ data: channel })
})

router.put('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Channel ID is invalid.' })
  }
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }
  const unexpected = invalidFields(request.body, channelFields)
  if (unexpected.length) {
    return response.status(400).json({ error: `Unsupported field: ${unexpected.join(', ')}.` })
  }

  const channel = await RecruitingChannel.findById(request.params.id)
  if (!channel) return response.status(404).json({ error: 'Recruiting channel not found.' })

  const replacement = new RecruitingChannel(request.body)
  for (const field of channelFields) {
    channel.set(field, replacement.get(field))
  }
  await channel.save()
  return response.json({ data: channel })
})

router.delete('/:id', async (request, response) => {
  if (!isValidObjectId(request.params.id)) {
    return response.status(400).json({ error: 'Channel ID is invalid.' })
  }

  const channel = await RecruitingChannel.findById(request.params.id)
  if (!channel) return response.status(404).json({ error: 'Recruiting channel not found.' })

  if (await Candidate.exists({ source: channel._id })) {
    channel.isActive = false
    await channel.save()
    return response.status(409).json({
      error: 'This channel has candidate records and cannot be deleted. It was archived instead.',
    })
  }

  await channel.deleteOne()
  return response.status(204).end()
})

export default router
