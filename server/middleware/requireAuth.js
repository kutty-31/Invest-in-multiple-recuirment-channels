import jwt from 'jsonwebtoken'

const tokenIssuer = 'talentwise-api'
const tokenAudience = 'talentwise-client'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.')
  }
  return secret
}

function signAccessToken(user) {
  return jwt.sign(
    { username: user.displayName || user.username },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      subject: user._id.toString(),
      issuer: tokenIssuer,
      audience: tokenAudience,
      expiresIn: '1h',
    },
  )
}

function requireAuth(request, response, next) {
  const authorization = request.get('authorization')
  const match = authorization?.match(/^Bearer ([^\s]+)$/)
  if (!match) {
    return response.status(401).json({ error: 'Authentication is required.' })
  }

  let payload
  try {
    payload = jwt.verify(match[1], getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: tokenIssuer,
      audience: tokenAudience,
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({ error: 'Access token is invalid or expired.' })
    }
    throw error
  }

  if (typeof payload !== 'object' || !payload.sub || !payload.username) {
    return response.status(401).json({ error: 'Access token is invalid or expired.' })
  }

  request.auth = { userId: payload.sub, username: payload.username }
  return next()
}

export { getJwtSecret, requireAuth, signAccessToken }
