import bcrypt from 'bcryptjs'
import { Router } from 'express'
import User from '../models/User.js'
import { isRecord } from '../utils/requestValidation.js'
import { requireAuth, signAccessToken } from '../middleware/requireAuth.js'

const router = Router()
const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/
const maximumPasswordBytes = 72

function validPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password, 'utf8') <= maximumPasswordBytes
}

function publicUser(user) {
  return { id: user._id, username: user.username }
}

router.post('/register', async (request, response) => {
  if (!isRecord(request.body)) {
    return response.status(400).json({ error: 'Request body must be a JSON object.' })
  }

  const { username, password } = request.body
  if (typeof username !== 'string' || !usernamePattern.test(username.trim())) {
    return response.status(400).json({
      error: 'Username must be 3 to 30 characters and use only letters, numbers, dots, underscores, or hyphens.',
    })
  }
  if (!validPassword(password)) {
    return response.status(400).json({
      error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.',
    })
  }
  if (Object.keys(request.body).some((field) => !['username', 'password'].includes(field))) {
    return response.status(400).json({ error: 'Only username and password are accepted.' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ username: username.trim(), passwordHash })
  return response.status(201).json({
    data: {
      user: publicUser(user),
      accessToken: signAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  })
})

router.post('/login', async (request, response) => {
  if (!isRecord(request.body)
    || typeof request.body.username !== 'string'
    || typeof request.body.password !== 'string') {
    return response.status(400).json({ error: 'Username and password are required.' })
  }

  const username = request.body.username.trim().toLowerCase()
  const user = await User.findOne({ username }).select('+passwordHash')
  const passwordMatches = user
    ? await bcrypt.compare(request.body.password, user.passwordHash)
    : false
  if (!user || !passwordMatches) {
    return response.status(401).json({ error: 'Username or password is incorrect.' })
  }

  return response.json({
    data: {
      user: publicUser(user),
      accessToken: signAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
  })
})

router.get('/me', requireAuth, async (request, response) => {
  return response.json({ data: { id: request.auth.userId, username: request.auth.username } })
})

export default router
