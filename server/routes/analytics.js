import { Router } from 'express'
import Candidate from '../models/Candidate.js'
import RecruitingChannel from '../models/RecruitingChannel.js'

const millisecondsPerDay = 86400000
const router = Router()

function parseMonths(value) {
  if (value === undefined) return 6
  const months = Number(value)
  return Number.isInteger(months) && months >= 1 && months <= 12 ? months : null
}

function getMonthStart(months, now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1))
}

function formatMonth(date) {
  return date.toISOString().slice(0, 7)
}

router.get('/overview', async (request, response) => {
  const months = parseMonths(request.query.months)
  if (!months) {
    return response.status(400).json({ error: 'months must be an integer between 1 and 12.' })
  }

  const now = new Date()
  const monthStart = getMonthStart(months, now)
  const [
    candidateCount,
    hireCount,
    stageCounts,
    hireDuration,
    monthlyApplications,
    monthlyHires,
  ] = await Promise.all([
    Candidate.countDocuments(),
    Candidate.countDocuments({ stage: 'Hired' }),
    Candidate.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Candidate.aggregate([
      { $match: { stage: 'Hired', hiredAt: { $type: 'date' } } },
      {
        $group: {
          _id: null,
          averageDaysToHire: {
            $avg: {
              $divide: [{ $subtract: ['$hiredAt', '$appliedAt'] }, millisecondsPerDay],
            },
          },
        },
      },
    ]),
    Candidate.aggregate([
      { $match: { appliedAt: { $gte: monthStart, $lte: now } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$appliedAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Candidate.aggregate([
      {
        $match: {
          stage: 'Hired',
          hiredAt: { $gte: monthStart, $lte: now, $type: 'date' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$hiredAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ])

  const stageCountMap = new Map(stageCounts.map(({ _id, count }) => [_id, count]))
  const applicationMap = new Map(monthlyApplications.map(({ _id, count }) => [_id, count]))
  const hireMap = new Map(monthlyHires.map(({ _id, count }) => [_id, count]))
  const trend = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth() + index,
      1,
    ))
    const month = formatMonth(date)
    return {
      month,
      applicants: applicationMap.get(month) ?? 0,
      hires: hireMap.get(month) ?? 0,
    }
  })

  return response.json({
    data: {
      totals: {
        candidates: candidateCount,
        hires: hireCount,
        averageDaysToHire: hireDuration.length
          ? Math.round(hireDuration[0].averageDaysToHire * 10) / 10
          : null,
      },
      stages: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'].map((stage) => ({
        stage,
        count: stageCountMap.get(stage) ?? 0,
      })),
      trend,
    },
  })
})

router.get('/channels', async (request, response) => {
  const [channels, candidateStats] = await Promise.all([
    RecruitingChannel.find().sort({ name: 1 }).lean(),
    Candidate.aggregate([
      {
        $group: {
          _id: '$source',
          applicants: { $sum: 1 },
          hires: {
            $sum: { $cond: [{ $eq: ['$stage', 'Hired'] }, 1, 0] },
          },
          averageQualityScore: { $avg: '$qualityScore' },
        },
      },
    ]),
  ])

  const statsByChannelId = new Map(
    candidateStats.map((stats) => [stats._id.toString(), stats]),
  )

  return response.json({
    data: channels.map((channel) => {
      const stats = statsByChannelId.get(channel._id.toString())
      const applicants = stats?.applicants ?? 0
      const hires = stats?.hires ?? 0

      return {
        _id: channel._id,
        name: channel.name,
        type: channel.type,
        isActive: channel.isActive,
        monthlySpend: channel.monthlySpend,
        applicants,
        hires,
        hireRate: applicants ? Math.round((hires / applicants) * 1000) / 10 : 0,
        averageQualityScore: stats?.averageQualityScore == null
          ? null
          : Math.round(stats.averageQualityScore * 10) / 10,
      }
    }),
  })
})

export default router
