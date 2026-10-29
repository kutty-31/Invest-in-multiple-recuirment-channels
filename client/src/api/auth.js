const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function requestJson(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  if (response.status === 204) return null

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}.`)
  }
  return result
}

async function authenticate(path, credentials) {
  const result = await requestJson(`/auth/${path}`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return result.data
}

function register(credentials) {
  return authenticate('register', credentials)
}

function login(credentials) {
  return authenticate('login', credentials)
}

function loginWithGoogle(credential) {
  return authenticate('google', { credential })
}

function toCandidateView(candidate) {
  const appliedAt = new Date(candidate.appliedAt)
  const daysSinceApplied = Math.max(0, Math.floor((Date.now() - appliedAt.getTime()) / 86400000))
  const applied = daysSinceApplied === 0
    ? 'Today'
    : `${daysSinceApplied} day${daysSinceApplied === 1 ? '' : 's'} ago`

  return {
    id: candidate._id,
    name: candidate.fullName,
    email: candidate.email || '',
    role: candidate.role,
    source: candidate.source?.name || 'Unknown source',
    sourceId: candidate.source?._id || candidate.source,
    stage: candidate.stage,
    quality: Number(candidate.qualityScore).toFixed(1),
    applied,
    appliedAt: candidate.appliedAt,
    hiredAt: candidate.hiredAt || '',
  }
}

async function getRecruitingData(token) {
  const [candidateResult, channelResult] = await Promise.all([
    requestJson('/candidates?limit=100', { token }),
    requestJson('/channels?limit=100', { token }),
  ])
  return {
    candidates: candidateResult.data.map(toCandidateView),
    channels: channelResult.data,
  }
}

async function replaceCandidate(candidate, token) {
  const result = await requestJson(`/candidates/${encodeURIComponent(candidate.id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({
      fullName: candidate.name,
      email: candidate.email || undefined,
      role: candidate.role,
      source: candidate.sourceId,
      stage: candidate.stage,
      qualityScore: Number(candidate.quality),
      appliedAt: candidate.appliedAt,
      hiredAt: candidate.stage === 'Hired' ? candidate.hiredAt : null,
    }),
  })
  return toCandidateView(result.data)
}

function removeCandidate(candidateId, token) {
  return requestJson(`/candidates/${encodeURIComponent(candidateId)}`, {
    method: 'DELETE',
    token,
  })
}

export {
  getRecruitingData,
  login,
  loginWithGoogle,
  register,
  removeCandidate,
  replaceCandidate,
}
