import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import app from './app.js'
import Candidate from './models/Candidate.js'
import RecruitingChannel from './models/RecruitingChannel.js'

let mongo

before(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

beforeEach(async () => {
  await Promise.all([
    Candidate.deleteMany({}),
    RecruitingChannel.deleteMany({}),
  ])
})

after(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

async function createChannel(overrides = {}) {
  const response = await request(app)
    .post('/api/channels')
    .send({ name: 'Employee referral', type: 'referral', ...overrides })

  assert.equal(response.status, 201)
  return response.body.data
}

test('health endpoint reports the active MongoDB connection', async () => {
  const response = await request(app).get('/api/health')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok', database: 'connected' })
})

test('bulk candidate POST creates and populates all valid records', async () => {
  const channel = await createChannel()
  const response = await request(app)
    .post('/api/candidates/bulk')
    .send({
      candidates: [
        { fullName: 'Avery Brooks', role: 'Designer', source: channel._id },
        { fullName: 'Jordan Lee', role: 'Engineer', source: channel._id, stage: 'Screening' },
      ],
    })

  assert.equal(response.status, 201)
  assert.equal(response.body.count, 2)
  assert.equal(response.body.data.length, 2)
  assert.deepEqual(response.body.data.map(({ fullName, source }) => ({
    fullName,
    source: source.name,
  })), [
    { fullName: 'Avery Brooks', source: 'Employee referral' },
    { fullName: 'Jordan Lee', source: 'Employee referral' },
  ])
  assert.equal(await Candidate.countDocuments(), 2)
})

test('bulk candidate POST rejects invalid batches without partial writes', async () => {
  const channel = await createChannel()
  const missingFields = await request(app)
    .post('/api/candidates/bulk')
    .send({
      candidates: [
        { fullName: 'Valid Candidate', role: 'Designer', source: channel._id },
        { fullName: 'Missing Role', source: channel._id },
      ],
    })

  assert.equal(missingFields.status, 400)
  assert.equal(missingFields.body.error, 'Request validation failed.')
  assert.deepEqual(missingFields.body.records[0].fields, { role: 'Role is required.' })
  assert.equal(await Candidate.countDocuments(), 0)

  const missingSource = await request(app)
    .post('/api/candidates/bulk')
    .send({
      candidates: [
        { fullName: 'Candidate With Unknown Source', role: 'Engineer', source: new mongoose.Types.ObjectId() },
      ],
    })

  assert.equal(missingSource.status, 422)
  assert.equal(missingSource.body.records[0].index, 0)
  assert.equal(await Candidate.countDocuments(), 0)
})

test('bulk candidate POST validates payload shape and batch size', async () => {
  const missingArray = await request(app)
    .post('/api/candidates/bulk')
    .send({ candidates: 'not-an-array' })
  assert.equal(missingArray.status, 400)

  const emptyBatch = await request(app)
    .post('/api/candidates/bulk')
    .send({ candidates: [] })
  assert.equal(emptyBatch.status, 400)

  const tooMany = await request(app)
    .post('/api/candidates/bulk')
    .send({ candidates: Array.from({ length: 101 }, () => ({})) })
  assert.equal(tooMany.status, 400)
})

test('analytics overview returns all-time metrics and a zero-filled monthly trend', async () => {
  const channel = await createChannel()
  const now = new Date()
  const appliedAt = new Date(now.getTime() - (20 * 86400000))
  const hiredAt = new Date(now.getTime() - (10 * 86400000))
  await Candidate.create([
    {
      fullName: 'Hired Candidate',
      role: 'Engineer',
      source: channel._id,
      stage: 'Hired',
      qualityScore: 5,
      appliedAt,
      hiredAt,
    },
    {
      fullName: 'Active Candidate',
      role: 'Designer',
      source: channel._id,
      stage: 'Interview',
      qualityScore: 3,
      appliedAt: now,
    },
  ])

  const response = await request(app).get('/api/analytics/overview?months=3')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body.data.totals, {
    candidates: 2,
    hires: 1,
    averageDaysToHire: 10,
  })
  assert.deepEqual(response.body.data.stages, [
    { stage: 'Applied', count: 0 },
    { stage: 'Screening', count: 0 },
    { stage: 'Interview', count: 1 },
    { stage: 'Offer', count: 0 },
    { stage: 'Hired', count: 1 },
  ])
  assert.equal(response.body.data.trend.length, 3)
  assert.equal(response.body.data.trend[2].applicants, 2)
  assert.equal(response.body.data.trend[2].hires, 1)
  assert.deepEqual(response.body.data.trend.slice(0, 2).map(({ applicants, hires }) => ({
    applicants,
    hires,
  })), [
    { applicants: 0, hires: 0 },
    { applicants: 0, hires: 0 },
  ])
})

test('analytics overview validates the requested trend window', async () => {
  const response = await request(app).get('/api/analytics/overview?months=13')

  assert.equal(response.status, 400)
  assert.equal(response.body.error, 'months must be an integer between 1 and 12.')
})

test('channel analytics aggregates performance and includes channels without candidates', async () => {
  const referral = await createChannel({ monthlySpend: 1200 })
  const careers = await createChannel({ name: 'Careers page', type: 'careers_page' })
  await Candidate.create([
    {
      fullName: 'Hired Candidate',
      role: 'Engineer',
      source: referral._id,
      stage: 'Hired',
      qualityScore: 5,
      appliedAt: new Date('2026-10-01T00:00:00.000Z'),
      hiredAt: new Date('2026-10-11T00:00:00.000Z'),
    },
    {
      fullName: 'Active Candidate',
      role: 'Designer',
      source: referral._id,
      stage: 'Interview',
      qualityScore: 4,
      appliedAt: new Date('2026-10-05T00:00:00.000Z'),
    },
  ])

  const response = await request(app).get('/api/analytics/channels')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body.data, [
    {
      _id: careers._id,
      name: 'Careers page',
      type: 'careers_page',
      isActive: true,
      monthlySpend: 0,
      applicants: 0,
      hires: 0,
      hireRate: 0,
      averageQualityScore: null,
    },
    {
      _id: referral._id,
      name: 'Employee referral',
      type: 'referral',
      isActive: true,
      monthlySpend: 1200,
      applicants: 2,
      hires: 1,
      hireRate: 50,
      averageQualityScore: 4.5,
    },
  ])
})

test('channel API creates, reads, filters, updates, and deletes database records', async () => {
  const created = await createChannel()
  assert.equal(created.name, 'Employee referral')
  assert.equal(created.monthlySpend, 0)

  const list = await request(app).get('/api/channels?isActive=true')
  assert.equal(list.status, 200)
  assert.equal(list.body.pagination.total, 1)
  assert.equal(list.body.data[0]._id, created._id)

  const updated = await request(app)
    .patch(`/api/channels/${created._id}`)
    .send({ monthlySpend: 850 })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.data.monthlySpend, 850)

  const fetched = await request(app).get(`/api/channels/${created._id}`)
  assert.equal(fetched.status, 200)
  assert.equal(fetched.body.data.name, 'Employee referral')

  const deleted = await request(app).delete(`/api/channels/${created._id}`)
  assert.equal(deleted.status, 204)
  assert.equal(await RecruitingChannel.countDocuments(), 0)
})

test('channel API reports invalid data, duplicates, unknown records, and bad IDs', async () => {
  await createChannel()
  const invalid = await request(app)
    .post('/api/channels')
    .send({ name: '  ', type: 'social_network' })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error, 'Request validation failed.')

  const duplicate = await request(app)
    .post('/api/channels')
    .send({ name: 'Employee referral', type: 'referral' })
  assert.equal(duplicate.status, 409)

  const badId = await request(app).get('/api/channels/not-an-id')
  assert.equal(badId.status, 400)

  const missing = await request(app).get(`/api/channels/${new mongoose.Types.ObjectId()}`)
  assert.equal(missing.status, 404)
})

test('candidate API validates channel references and persists populated candidate records', async () => {
  const channel = await createChannel()
  const unknownSource = await request(app)
    .post('/api/candidates')
    .send({ fullName: 'Olivia Chen', role: 'Designer', source: new mongoose.Types.ObjectId() })
  assert.equal(unknownSource.status, 422)

  const created = await request(app)
    .post('/api/candidates')
    .send({
      fullName: 'Olivia Chen',
      email: 'OLIVIA.CHEN@EXAMPLE.COM',
      role: 'Product Designer',
      source: channel._id,
    })
  assert.equal(created.status, 201)
  assert.equal(created.body.data.email, 'olivia.chen@example.com')
  assert.equal(created.body.data.stage, 'Applied')
  assert.equal(created.body.data.source.name, 'Employee referral')

  const search = await request(app).get('/api/candidates?q=olivia&stage=Applied')
  assert.equal(search.status, 200)
  assert.equal(search.body.pagination.total, 1)
  assert.equal(search.body.data[0]._id, created.body.data._id)

  const fetched = await request(app).get(`/api/candidates/${created.body.data._id}`)
  assert.equal(fetched.status, 200)
  assert.equal(fetched.body.data.source.type, 'referral')
})

test('candidate updates validate hiring dates, serialize daysToHire, and preserve channel references', async () => {
  const channel = await createChannel()
  const created = await request(app)
    .post('/api/candidates')
    .send({
      fullName: 'Noah Williams',
      role: 'Backend Engineer',
      source: channel._id,
      appliedAt: '2026-10-01T00:00:00.000Z',
    })

  const invalidHire = await request(app)
    .patch(`/api/candidates/${created.body.data._id}`)
    .send({ stage: 'Hired' })
  assert.equal(invalidHire.status, 400)

  const hired = await request(app)
    .patch(`/api/candidates/${created.body.data._id}`)
    .send({ stage: 'Hired', hiredAt: '2026-10-16T00:00:00.000Z' })
  assert.equal(hired.status, 200)
  assert.equal(hired.body.data.daysToHire, 15)
  assert.equal(hired.body.data.source.name, 'Employee referral')

  const deleted = await request(app).delete(`/api/candidates/${created.body.data._id}`)
  assert.equal(deleted.status, 204)
  assert.equal(await Candidate.countDocuments(), 0)
})

test('channels linked to candidates are archived rather than deleted', async () => {
  const channel = await createChannel()
  await request(app)
    .post('/api/candidates')
    .send({ fullName: 'Candidate One', role: 'Designer', source: channel._id })
    .expect(201)

  const archived = await request(app).delete(`/api/channels/${channel._id}`)

  assert.equal(archived.status, 409)
  assert.equal(archived.body.error, 'This channel has candidate records and cannot be deleted. It was archived instead.')
  assert.equal(await RecruitingChannel.countDocuments(), 1)
  assert.equal((await RecruitingChannel.findById(channel._id)).isActive, false)
  assert.equal(await Candidate.countDocuments(), 1)
})

test('API returns useful responses for malformed JSON, unknown routes, and invalid filters', async () => {
  const malformed = await request(app)
    .post('/api/channels')
    .set('Content-Type', 'application/json')
    .send('{"name":')
  assert.equal(malformed.status, 400)
  assert.equal(malformed.body.error, 'Request body must contain valid JSON.')

  const invalidStage = await request(app).get('/api/candidates?stage=Shortlisted')
  assert.equal(invalidStage.status, 400)

  const invalidDateRange = await request(app)
    .get('/api/candidates?appliedFrom=2026-10-10&appliedTo=2026-10-01')
  assert.equal(invalidDateRange.status, 400)

  const invalidRoute = await request(app).get('/api/missing')
  assert.equal(invalidRoute.status, 404)
})
