import { describe, expect, it } from 'vitest'
import {
  candidateRows,
  channelRows,
  metrics,
  navigation,
  qualityStars,
  stages,
} from './recruiting.js'

describe('recruiting dashboard data', () => {
  it('defines the primary navigation destinations', () => {
    expect(navigation.map(({ id }) => id)).toEqual([
      'overview',
      'channels',
      'candidates',
    ])
  })

  it('provides four sample recruiting channels', () => {
    expect(channelRows).toHaveLength(4)
    expect(channelRows.map(({ name }) => name)).toContain('Employee referral')
  })

  it('provides the four overview metrics', () => {
    expect(metrics.map(({ kind }) => kind)).toEqual([
      'applicants',
      'hires',
      'time',
      'cost',
    ])
  })

  it('lists candidate sample records with unique IDs', () => {
    const ids = candidateRows.map(({ id }) => id)

    expect(candidateRows).toHaveLength(4)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('shows funnel stages in pipeline order', () => {
    expect(stages.map(({ name }) => name)).toEqual([
      'Applied',
      'Screening',
      'Interview',
      'Hired',
    ])
  })

  it('renders rounded quality scores as five stars', () => {
    expect(qualityStars(4.6)).toBe('★★★★★')
    expect(qualityStars(2.2)).toBe('★★☆☆☆')
    expect(qualityStars(0)).toBe('☆☆☆☆☆')
  })
})
