import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, test } from 'node:test'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import supertest from 'supertest'
import app from './app.js'
import Candidate from './models/Candidate.js'
import RecruitingChannel from './models/RecruitingChannel.js'
import { createAuthRouter } from './routes/auth.js'
import User from './models/User.js'

let mongo
let resumeDirectory
const originalResumeDirectory = process.env.RESUME_STORAGE_DIR
const testSecret = 'test-secret-with-at-least-thirty-two-bytes'
process.env.JWT_SECRET = testSecret
process.env.GOOGLE_CLIENT_ID = 'talentwise-test-client.apps.googleusercontent.com'
const testToken = jwt.sign(
  { username: 'test-user' },
  testSecret,
  {
    algorithm: 'HS256',
    subject: new mongoose.Types.ObjectId().toString(),
    issuer: 'talentwise-api',
    audience: 'talentwise-client',
    expiresIn: '1h',
  },
)

function request(appInstance) {
  const client = supertest(appInstance)
  const authorization = `Bearer ${testToken}`
  return {
    get: (path) => client.get(path).set('Authorization', authorization),
    post: (path) => client.post(path).set('Authorization', authorization),
    patch: (path) => client.patch(path).set('Authorization', authorization),
    put: (path) => client.put(path).set('Authorization', authorization),
    delete: (path) => client.delete(path).set('Authorization', authorization),
  }
}

before(async () => {
  resumeDirectory = await mkdtemp(join(tmpdir(), 'talentwise-resumes-'))
  process.env.RESUME_STORAGE_DIR = resumeDirectory
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

beforeEach(async () => {
  await Promise.all([
    Candidate.deleteMany({}),
    RecruitingChannel.deleteMany({}),
    User.deleteMany({}),
  ])
})

after(async () => {
  await mongoose.disconnect()
  await mongo.stop()
  await rm(resumeDirectory, { recursive: true, force: true })
  if (originalResumeDirectory === undefined) {
    delete process.env.RESUME_STORAGE_DIR
  } else {
    process.env.RESUME_STORAGE_DIR = originalResumeDirectory
  }
})

async function createChannel(overrides = {}) {
  const response = await request(app)
    .post('/api/channels')
    .send({ name: 'Employee referral', type: 'referral', ...overrides })

  assert.equal(response.status, 201)
  return response.body.data
}

async function createCandidate(overrides = {}) {
  const channel = await createChannel()
  const response = await request(app)
    .post('/api/candidates')
    .send({
      fullName: 'Taylor Candidate',
      role: 'Product Designer',
      source: channel._id,
      ...overrides,
    })
  assert.equal(response.status, 201)
  return response.body.data
}

test('registration hashes passwords, normalizes usernames, and returns a usable access token', async () => {
  const response = await supertest(app)
    .post('/api/auth/register')
    .send({ username: '  Talent.Admin  ', password: 'strong-pass-123' })

  assert.equal(response.status, 201)
  assert.deepEqual(response.body.data.user.username, 'talent.admin')
  assert.equal(response.body.data.tokenType, 'Bearer')
  assert.equal(response.body.data.expiresIn, 3600)
  assert.ok(response.body.data.accessToken)
  assert.equal(JSON.stringify(response.body).includes('passwordHash'), false)

  const storedUser = await User.findOne({ username: 'talent.admin' }).select('+passwordHash')
  assert.ok(storedUser)
  assert.notEqual(storedUser.passwordHash, 'strong-pass-123')
  assert.equal(await bcrypt.compare('strong-pass-123', storedUser.passwordHash), true)

  const me = await supertest(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${response.body.data.accessToken}`)
  assert.equal(me.status, 200)
  assert.deepEqual(me.body.data, {
    id: storedUser._id.toString(),
    username: 'talent.admin',
  })
})

test('registration validates credentials and rejects duplicate usernames', async () => {
  const invalidUsername = await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'bad user', password: 'strong-pass-123' })
  assert.equal(invalidUsername.status, 400)

  const shortPassword = await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'valid-user', password: 'short' })
  assert.equal(shortPassword.status, 400)

  const unexpectedField = await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'valid-user', password: 'strong-pass-123', role: 'admin' })
  assert.equal(unexpectedField.status, 400)

  await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'Valid.User', password: 'strong-pass-123' })
    .expect(201)
  const duplicate = await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'valid.user', password: 'another-pass-123' })
  assert.equal(duplicate.status, 409)
})

test('login returns a token for valid credentials and a generic error otherwise', async () => {
  await supertest(app)
    .post('/api/auth/register')
    .send({ username: 'recruiter', password: 'strong-pass-123' })
    .expect(201)

  const login = await supertest(app)
    .post('/api/auth/login')
    .send({ username: 'RECRUITER', password: 'strong-pass-123' })
  assert.equal(login.status, 200)
  assert.equal(login.body.data.user.username, 'recruiter')
  assert.ok(login.body.data.accessToken)

  const incorrectPassword = await supertest(app)
    .post('/api/auth/login')
    .send({ username: 'recruiter', password: 'incorrect-pass' })
  assert.equal(incorrectPassword.status, 401)
  assert.equal(incorrectPassword.body.error, 'Username or password is incorrect.')

  const unknownUser = await supertest(app)
    .post('/api/auth/login')
    .send({ username: 'not-registered', password: 'incorrect-pass' })
  assert.equal(unknownUser.status, 401)
  assert.equal(unknownUser.body.error, incorrectPassword.body.error)
})

test('Google sign-in verifies the configured audience and creates or updates an identity', async () => {
  const profile = {
    sub: 'google-subject-987',
    email: 'Recruiter@example.com',
    email_verified: true,
    name: 'Google Recruiter',
  }
  const verifier = {
    async verifyIdToken({ idToken, audience }) {
      assert.equal(idToken, 'valid-google-id-token')
      assert.equal(audience, process.env.GOOGLE_CLIENT_ID)
      return { getPayload: () => profile }
    },
  }
  const googleApp = express()
    .use(express.json())
    .use('/api/auth', createAuthRouter({ verifier }))

  const firstLogin = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'valid-google-id-token' })
  assert.equal(firstLogin.status, 200)
  assert.deepEqual(firstLogin.body.data.user, {
    id: firstLogin.body.data.user.id,
    username: 'Google Recruiter',
    email: 'recruiter@example.com',
  })
  assert.equal(firstLogin.body.data.tokenType, 'Bearer')
  assert.equal(firstLogin.body.data.expiresIn, 3600)
  const claims = jwt.verify(firstLogin.body.data.accessToken, testSecret, {
    algorithms: ['HS256'],
    issuer: 'talentwise-api',
    audience: 'talentwise-client',
  })
  assert.equal(claims.username, 'Google Recruiter')

  const user = await User.findOne({ googleId: profile.sub }).select('+passwordHash')
  assert.ok(user)
  assert.equal(user.email, 'recruiter@example.com')
  assert.equal(user.passwordHash, undefined)

  profile.name = 'Updated Recruiter'
  const secondLogin = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'valid-google-id-token' })
  assert.equal(secondLogin.status, 200)
  assert.equal(secondLogin.body.data.user.id, user._id.toString())
  assert.equal(secondLogin.body.data.user.username, 'Updated Recruiter')
  assert.equal(await User.countDocuments({ googleId: profile.sub }), 1)
})

test('Google sign-in rejects malformed requests, unverified emails, and invalid ID tokens', async () => {
  let tokenPayload = {
    sub: 'unverified-google-subject',
    email: 'unverified@example.com',
    email_verified: false,
  }
  const verifier = {
    async verifyIdToken() {
      return { getPayload: () => tokenPayload }
    },
  }
  const googleApp = express()
    .use(express.json())
    .use('/api/auth', createAuthRouter({ verifier }))

  const malformedRequest = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'test-token', username: 'unexpected' })
  assert.equal(malformedRequest.status, 400)

  const unverifiedEmail = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'test-token' })
  assert.equal(unverifiedEmail.status, 401)
  assert.equal(await User.countDocuments({ googleId: tokenPayload.sub }), 0)

  tokenPayload = {
    sub: 'verified-google-subject',
    email: 'verified@example.com',
    email_verified: true,
  }
  verifier.verifyIdToken = async () => {
    throw new Error('Invalid token signature.')
  }
  const invalidToken = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'invalid-token' })
  assert.equal(invalidToken.status, 401)
  assert.equal(await User.countDocuments({ googleId: 'verified-google-subject' }), 0)
})

test('Google sign-in reports missing OAuth configuration and temporary verification outages', async () => {
  const googleApp = express()
    .use(express.json())
    .use('/api/auth', createAuthRouter({
      verifier: { async verifyIdToken() { throw Object.assign(new Error('Google unavailable'), { code: 'ECONNRESET' }) } },
    }))
  const clientId = process.env.GOOGLE_CLIENT_ID

  delete process.env.GOOGLE_CLIENT_ID
  const unconfigured = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'some-token' })
  assert.equal(unconfigured.status, 503)
  process.env.GOOGLE_CLIENT_ID = clientId

  const unavailable = await supertest(googleApp)
    .post('/api/auth/google')
    .send({ credential: 'some-token' })
  assert.equal(unavailable.status, 502)
})

test('recruiting APIs reject missing and invalid tokens', async () => {
  const missingToken = await supertest(app).get('/api/channels')
  assert.equal(missingToken.status, 401)

  const missingMeToken = await supertest(app).get('/api/auth/me')
  assert.equal(missingMeToken.status, 401)

  const invalidToken = await supertest(app)
    .get('/api/analytics/overview')
    .set('Authorization', 'Bearer invalid-token')
  assert.equal(invalidToken.status, 401)

  const expiredToken = jwt.sign(
    { username: 'expired-user' },
    testSecret,
    {
      algorithm: 'HS256',
      subject: new mongoose.Types.ObjectId().toString(),
      issuer: 'talentwise-api',
      audience: 'talentwise-client',
      expiresIn: -1,
    },
  )
  const expired = await supertest(app)
    .get('/api/candidates')
    .set('Authorization', `Bearer ${expiredToken}`)
  assert.equal(expired.status, 401)
})

test('candidate resume upload stores a private PDF, supports replacement, download, and removal', async () => {
  const candidate = await createCandidate()
  const firstPdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')
  const uploaded = await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', firstPdf, { filename: 'Taylor Resume.pdf', contentType: 'application/pdf' })

  assert.equal(uploaded.status, 201)
  assert.equal(uploaded.body.data.originalName, 'Taylor Resume.pdf')
  assert.equal(uploaded.body.data.size, firstPdf.length)
  assert.equal(uploaded.body.data.contentType, 'application/pdf')
  assert.equal('storageKey' in uploaded.body.data, false)
  assert.ok(uploaded.body.data.uploadedAt)
  assert.equal((await readdir(resumeDirectory)).length, 1)

  const candidateList = await request(app).get('/api/candidates')
  assert.equal(candidateList.body.data[0].resume.originalName, 'Taylor Resume.pdf')
  assert.equal('storageKey' in candidateList.body.data[0].resume, false)

  const download = await request(app).get(`/api/candidates/${candidate._id}/resume`)
  assert.equal(download.status, 200)
  assert.equal(download.headers['content-type'], 'application/octet-stream')
  assert.match(download.headers['content-disposition'], /attachment/)
  assert.equal(download.headers['x-content-type-options'], 'nosniff')
  assert.deepEqual(download.body, firstPdf)

  const replacementPdf = Buffer.from('%PDF-1.7\nreplacement document')
  const replacement = await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', replacementPdf, { filename: 'Updated.pdf', contentType: 'application/pdf' })
  assert.equal(replacement.status, 201)
  assert.equal(replacement.body.data.originalName, 'Updated.pdf')
  assert.equal((await readdir(resumeDirectory)).length, 1)

  const removed = await request(app).delete(`/api/candidates/${candidate._id}/resume`)
  assert.equal(removed.status, 204)
  assert.equal((await readdir(resumeDirectory)).length, 0)
  const withoutResume = await request(app).get('/api/candidates')
  assert.equal(withoutResume.body.data[0].resume, undefined)
  const missingResume = await request(app).get(`/api/candidates/${candidate._id}/resume`)
  assert.equal(missingResume.status, 404)
})

test('candidate resume upload rejects unauthenticated, missing, oversized, and non-PDF files', async () => {
  const candidate = await createCandidate()
  const validPdf = Buffer.from('%PDF-1.7\nvalid')
  const unauthorized = await supertest(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', validPdf, { filename: 'resume.pdf', contentType: 'application/pdf' })
  assert.equal(unauthorized.status, 401)

  const missingCandidate = await request(app)
    .post(`/api/candidates/${new mongoose.Types.ObjectId()}/resume`)
    .attach('resume', validPdf, { filename: 'resume.pdf', contentType: 'application/pdf' })
  assert.equal(missingCandidate.status, 404)

  const missingFile = await request(app).post(`/api/candidates/${candidate._id}/resume`)
  assert.equal(missingFile.status, 400)

  const unsupportedType = await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', Buffer.from('not a PDF'), { filename: 'resume.txt', contentType: 'text/plain' })
  assert.equal(unsupportedType.status, 415)

  const spoofedPdf = await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', Buffer.from('not really PDF'), { filename: 'resume.pdf', contentType: 'application/pdf' })
  assert.equal(spoofedPdf.status, 415)

  const oversized = await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach('resume', Buffer.alloc((5 * 1024 * 1024) + 1), {
      filename: 'large.pdf',
      contentType: 'application/pdf',
    })
  assert.equal(oversized.status, 413)
  assert.equal((await readdir(resumeDirectory)).length, 0)
})

test('deleting a candidate also removes the candidate resume file', async () => {
  const candidate = await createCandidate()
  await request(app)
    .post(`/api/candidates/${candidate._id}/resume`)
    .attach(
      'resume',
      Buffer.from('%PDF-1.7\ncandidate resume'),
      { filename: 'resume.pdf', contentType: 'application/pdf' },
    )
    .expect(201)
  assert.equal((await readdir(resumeDirectory)).length, 1)

  await request(app).delete(`/api/candidates/${candidate._id}`).expect(204)
  assert.equal((await readdir(resumeDirectory)).length, 0)
})

test('health endpoint reports the active MongoDB connection', async () => {
  const response = await supertest(app).get('/api/health')

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

  assert.equal(response.status, 200, JSON.stringify(response.body))
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

test('channel PUT replaces mutable fields, clears omitted optionals, and applies defaults', async () => {
  const channel = await createChannel({ description: 'Original description', monthlySpend: 850 })
  const response = await request(app)
    .put(`/api/channels/${channel._id}`)
    .send({ name: 'Updated referral', type: 'referral' })

  assert.equal(response.status, 200, JSON.stringify(response.body))
  assert.equal(response.body.data._id, channel._id)
  assert.equal(response.body.data.name, 'Updated referral')
  assert.equal(response.body.data.monthlySpend, 0)
  assert.equal(response.body.data.isActive, true)
  assert.equal(response.body.data.description, undefined)
  assert.equal(await RecruitingChannel.countDocuments(), 1)
})

test('channel PUT rejects invalid payloads and returns not found for missing IDs', async () => {
  const channel = await createChannel()
  const invalid = await request(app)
    .put(`/api/channels/${channel._id}`)
    .send({ name: 'x', type: 'unknown' })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error, 'Request validation failed.')

  const unknownField = await request(app)
    .put(`/api/channels/${channel._id}`)
    .send({ name: 'Valid channel', type: 'referral', unexpected: true })
  assert.equal(unknownField.status, 400)

  const missing = await request(app)
    .put(`/api/channels/${new mongoose.Types.ObjectId()}`)
    .send({ name: 'Replacement', type: 'referral' })
  assert.equal(missing.status, 404)
})

test('channel candidate relationship returns only candidates referencing that channel', async () => {
  const referral = await createChannel()
  const careers = await createChannel({ name: 'Careers page', type: 'careers_page' })
  await Candidate.create([
    {
      fullName: 'Referral Candidate',
      role: 'Designer',
      source: referral._id,
      appliedAt: new Date('2026-10-01T00:00:00.000Z'),
    },
    {
      fullName: 'Second Referral Candidate',
      role: 'Engineer',
      source: referral._id,
      appliedAt: new Date('2026-10-02T00:00:00.000Z'),
    },
    {
      fullName: 'Careers Candidate',
      role: 'Analyst',
      source: careers._id,
    },
  ])

  const response = await request(app).get(`/api/channels/${referral._id}/candidates?limit=1`)

  assert.equal(response.status, 200)
  assert.equal(response.body.data.channel._id, referral._id)
  assert.equal(response.body.data.channel.name, 'Employee referral')
  assert.equal(response.body.data.candidates.length, 1)
  assert.equal(response.body.data.candidates[0].fullName, 'Second Referral Candidate')
  assert.equal(response.body.data.candidates[0].source, referral._id)
  assert.deepEqual(response.body.pagination, { page: 1, limit: 1, total: 2, pages: 2 })

  const secondPage = await request(app)
    .get(`/api/channels/${referral._id}/candidates?page=2&limit=1`)
  assert.equal(secondPage.status, 200)
  assert.equal(secondPage.body.data.candidates[0].fullName, 'Referral Candidate')
})

test('channel candidate relationship validates IDs and pagination and handles empty relationships', async () => {
  const channel = await createChannel()

  const candidates = await request(app).get(`/api/channels/${channel._id}/candidates`)
  assert.equal(candidates.status, 200)
  assert.deepEqual(candidates.body.data.candidates, [])
  assert.deepEqual(candidates.body.pagination, { page: 1, limit: 50, total: 0, pages: 0 })

  const invalidId = await request(app).get('/api/channels/not-an-id/candidates')
  assert.equal(invalidId.status, 400)

  const invalidPage = await request(app).get(`/api/channels/${channel._id}/candidates?page=0`)
  assert.equal(invalidPage.status, 400)

  const missing = await request(app)
    .get(`/api/channels/${new mongoose.Types.ObjectId()}/candidates`)
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

test('candidate PUT replaces mutable fields, clears omitted optionals, and applies defaults', async () => {
  const channel = await createChannel()
  const created = await request(app)
    .post('/api/candidates')
    .send({
      fullName: 'Original Candidate',
      email: 'original@example.com',
      role: 'Designer',
      source: channel._id,
      stage: 'Interview',
      qualityScore: 5,
      notes: 'Original notes',
    })
  const response = await request(app)
    .put(`/api/candidates/${created.body.data._id}`)
    .send({
      fullName: 'Replacement Candidate',
      role: 'Data Analyst',
      source: channel._id,
    })

  assert.equal(response.status, 200, JSON.stringify(response.body))
  assert.equal(response.body.data._id, created.body.data._id)
  assert.equal(response.body.data.fullName, 'Replacement Candidate')
  assert.equal(response.body.data.email, undefined)
  assert.equal(response.body.data.stage, 'Applied')
  assert.equal(response.body.data.qualityScore, 3)
  assert.equal(response.body.data.notes, undefined)
  assert.equal(response.body.data.source.name, 'Employee referral')
  assert.equal(await Candidate.countDocuments(), 1)
})

test('candidate PUT validates required fields, source references, and missing records', async () => {
  const channel = await createChannel()
  const created = await request(app)
    .post('/api/candidates')
    .send({ fullName: 'Existing Candidate', role: 'Designer', source: channel._id })

  const missingRequired = await request(app)
    .put(`/api/candidates/${created.body.data._id}`)
    .send({ fullName: 'Replacement Candidate', source: channel._id })
  assert.equal(missingRequired.status, 400)
  assert.equal(missingRequired.body.fields.role, 'Role is required.')

  const unknownSource = await request(app)
    .put(`/api/candidates/${created.body.data._id}`)
    .send({
      fullName: 'Replacement Candidate',
      role: 'Engineer',
      source: new mongoose.Types.ObjectId(),
    })
  assert.equal(unknownSource.status, 422)

  const missing = await request(app)
    .put(`/api/candidates/${new mongoose.Types.ObjectId()}`)
    .send({ fullName: 'Replacement', role: 'Engineer', source: channel._id })
  assert.equal(missing.status, 404)
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
