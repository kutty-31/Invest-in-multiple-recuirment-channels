import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import Candidate from './Candidate.js'
import RecruitingChannel from './RecruitingChannel.js'

test('recruiting channels apply defaults and normalize names', async () => {
  const channel = new RecruitingChannel({
    name: '  LinkedIn  ',
    type: 'linkedin',
  })

  await channel.validate()

  assert.equal(channel.name, 'LinkedIn')
  assert.equal(channel.monthlySpend, 0)
  assert.equal(channel.isActive, true)
})

test('recruiting channels reject missing names, unknown types, and negative spend', async () => {
  const channel = new RecruitingChannel({
    type: 'social_network',
    monthlySpend: -1,
  })

  await assert.rejects(channel.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError)
    assert.ok(error.errors.name)
    assert.ok(error.errors.type)
    assert.ok(error.errors.monthlySpend)
    return true
  })
})

test('candidate schema references the recruiting channel model', () => {
  assert.equal(Candidate.schema.path('source').options.ref, 'RecruitingChannel')
})
