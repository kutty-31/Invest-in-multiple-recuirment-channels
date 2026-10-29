import { Router } from 'express'
import { isRecord } from '../utils/requestValidation.js'

const router = Router()
const endpoint = 'https://api.openai.com/v1/chat/completions'
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

async function completeRole(prefix) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { error: 'AI autocomplete is not configured. Set OPENAI_API_KEY on the API server.' }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Complete a recruiting job title from the user prefix. Return only one concise job title, no quotes or explanation.',
        },
        { role: 'user', content: prefix },
      ],
      max_tokens: 40,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    console.error(`AI autocomplete provider returned HTTP ${response.status}.`)
    return { error: 'AI autocomplete is temporarily unavailable. Please try again later.' }
  }

  const result = await response.json()
  const suggestion = result.choices?.[0]?.message?.content?.trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 100)

  if (!suggestion) {
    console.error('AI autocomplete provider returned an empty suggestion.')
    return { error: 'AI autocomplete could not generate a suggestion. Please try again.' }
  }
  return { suggestion }
}

function createAiRouter(complete = completeRole) {
  const aiRouter = Router()
  aiRouter.post('/autocomplete', async (request, response) => {
    if (!isRecord(request.body) || Object.keys(request.body).some((key) => key !== 'prefix')) {
      return response.status(400).json({ error: 'Provide only a prefix string.' })
    }

    const prefix = request.body.prefix
    if (typeof prefix !== 'string' || prefix.trim().length < 2 || prefix.trim().length > 80) {
      return response.status(400).json({ error: 'prefix must contain between 2 and 80 characters.' })
    }

    try {
      const result = await complete(prefix.trim())
      if (result.error) {
        return response.status(process.env.OPENAI_API_KEY ? 502 : 503)
          .json({ error: result.error })
      }
      return response.json({ data: { suggestion: result.suggestion } })
    } catch (error) {
      console.error('AI autocomplete request failed:', error)
      return response.status(502).json({
        error: 'AI autocomplete is temporarily unavailable. Please try again later.',
      })
    }
  })
  return aiRouter
}

export { createAiRouter }
