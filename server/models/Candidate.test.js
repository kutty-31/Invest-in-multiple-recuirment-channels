import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Candidate from './Candidate.js'

const source = new mongoose.Types.ObjectId()

test('candidate defaults and calculated hire duration are available', async () => {
  const candidate = new Candidate({
    fullName: '  Olivia Chen  ',
    email: 'OLIVIA.CHEN@EXAMPLE.COM',
    role: 'Product Designer',
    source,
    appliedAt: new Date('2026-10-01T00:00:00.000Z'),
    stage: 'Hired',
    hiredAt: new Date('2026-10-16T00:00:00.000Z'),
  })

  await candidate.validate()

  assert.equal(candidate.fullName, 'Olivia Chen')
  assert.equal(candidate.email, 'olivia.chen@example.com')
  assert.equal(candidate.stage, 'Hired')
  assert.equal(candidate.qualityScore, 3)
  assert.equal(candidate.daysToHire, 15)
})

test('candidate rejects missing required fields, invalid stages, and out-of-range quality', async () => {
  const candidate = new Candidate({
    role: 'Designer',
    source: undefined,
    stage: 'Shortlisted',
    qualityScore: 6,
  })

  await assert.rejects(candidate.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError)
    assert.ok(error.errors.fullName)
    assert.ok(error.errors.source)
    assert.ok(error.errors.stage)
    assert.ok(error.errors.qualityScore)
    return true
  })
})

test('hired candidates require a hire date', async () => {
  const candidate = new Candidate({
    fullName: 'Candidate',
    role: 'Designer',
    source,
    stage: 'Hired',
  })

  await assert.rejects(candidate.validate(), (error) => {
    assert.ok(error.errors.hiredAt)
    return true
  })
})

test('hired date cannot be before the application date', async () => {
  const candidate = new Candidate({
    fullName: 'Candidate',
    role: 'Designer',
    source,
    stage: 'Hired',
    appliedAt: new Date('2026-10-10T00:00:00.000Z'),
    hiredAt: new Date('2026-10-09T00:00:00.000Z'),
  })

  await assert.rejects(candidate.validate(), (error) => {
    assert.ok(error.errors.hiredAt)
    return true
  })
})

test('non-hired candidates cannot have a hire date', async () => {
  const candidate = new Candidate({
    fullName: 'Candidate',
    role: 'Designer',
    source,
    stage: 'Interview',
    hiredAt: new Date('2026-10-16T00:00:00.000Z'),
  })

  await assert.rejects(candidate.validate(), (error) => {
    assert.ok(error.errors.hiredAt)
    return true
  })
})
