import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  downloadCandidateResume,
  autocompleteRole,
  getRecruitingData,
  login,
  loginWithGoogle,
  removeCandidate,
  replaceCandidate,
  uploadCandidateResume,
} from './auth.js'

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function candidateRecord(overrides = {}) {
  return {
    _id: 'candidate/1',
    fullName: 'Taylor Example',
    email: 'taylor@example.com',
    role: 'Designer',
    source: { _id: 'channel-1', name: 'Referral' },
    stage: 'Interview',
    qualityScore: 4.5,
    appliedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('authentication API', () => {
  it('posts login credentials and returns the authentication data', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({
      data: { accessToken: 'token-1', user: { username: 'recruiter' } },
    }))
    vi.stubGlobal('fetch', fetch)

    const result = await login({ username: 'recruiter', password: 'strong-pass' })

    expect(result.accessToken).toBe('token-1')
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][0]).toMatch(/\/auth\/login$/)
    expect(fetch.mock.calls[0][1].method).toBe('POST')
    expect(fetch.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      username: 'recruiter',
      password: 'strong-pass',
    })
  })

  it('sends Google credentials to the Google sign-in endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ data: { accessToken: 'google-token' } }))
    vi.stubGlobal('fetch', fetch)

    const result = await loginWithGoogle('google-id-token')

    expect(result.accessToken).toBe('google-token')
    expect(fetch.mock.calls[0][0]).toMatch(/\/auth\/google$/)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      credential: 'google-id-token',
    })
  })
})

describe('recruiting API', () => {
  it('requests a role completion from the authenticated AI endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({
      data: { suggestion: 'Senior Product Designer' },
    }))
    vi.stubGlobal('fetch', fetch)

    await expect(autocompleteRole('Senior Product', 'jwt-token'))
      .resolves.toBe('Senior Product Designer')

    expect(fetch.mock.calls[0][0]).toMatch(/\/ai\/autocomplete$/)
    expect(fetch.mock.calls[0][1].method).toBe('POST')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer jwt-token')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ prefix: 'Senior Product' })
  })

  it('loads candidate and channel lists and maps candidates to client records', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: [candidateRecord()] }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ _id: 'channel-1', name: 'Referral' }] }))
    vi.stubGlobal('fetch', fetch)

    const result = await getRecruitingData('jwt-token')

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      expect.stringMatching(/\/candidates\?limit=100$/),
      expect.stringMatching(/\/channels\?limit=100$/),
    ])
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer jwt-token')
    expect(result.candidates[0]).toMatchObject({
      id: 'candidate/1',
      name: 'Taylor Example',
      source: 'Referral',
      sourceId: 'channel-1',
      quality: '4.5',
    })
    expect(result.channels).toEqual([{ _id: 'channel-1', name: 'Referral' }])
  })

  it('replaces a candidate with the expected PUT payload and token', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ data: candidateRecord() }))
    vi.stubGlobal('fetch', fetch)
    const candidate = {
      id: 'candidate/1',
      name: 'Taylor Example',
      email: '',
      role: 'Designer',
      sourceId: 'channel-1',
      stage: 'Interview',
      quality: '4.5',
      appliedAt: '2026-01-01T00:00:00.000Z',
      hiredAt: '',
    }

    await replaceCandidate(candidate, 'jwt-token')

    expect(fetch.mock.calls[0][0]).toMatch(/\/candidates\/candidate%2F1$/)
    expect(fetch.mock.calls[0][1].method).toBe('PUT')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer jwt-token')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      fullName: 'Taylor Example',
      role: 'Designer',
      source: 'channel-1',
      stage: 'Interview',
      qualityScore: 4.5,
      appliedAt: '2026-01-01T00:00:00.000Z',
      hiredAt: null,
    })
  })

  it('deletes a candidate and accepts a no-content response', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)

    await expect(removeCandidate('candidate/1', 'jwt-token')).resolves.toBeNull()
    expect(fetch.mock.calls[0][1].method).toBe('DELETE')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer jwt-token')
  })

  it('uploads resume files as multipart data without setting JSON content type', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ data: { originalName: 'resume.pdf' } }))
    vi.stubGlobal('fetch', fetch)
    const file = new File(['%PDF-1.7'], 'resume.pdf', { type: 'application/pdf' })

    const result = await uploadCandidateResume('candidate/1', file, 'jwt-token')

    expect(result.originalName).toBe('resume.pdf')
    expect(fetch.mock.calls[0][0]).toMatch(/\/candidates\/candidate%2F1\/resume$/)
    expect(fetch.mock.calls[0][1].body).toBeInstanceOf(FormData)
    expect(fetch.mock.calls[0][1].body.get('resume').name).toBe('resume.pdf')
    expect(fetch.mock.calls[0][1].headers.has('Content-Type')).toBe(false)
  })

  it('downloads a candidate resume as a blob', async () => {
    const resume = new Blob(['pdf contents'], { type: 'application/pdf' })
    const fetch = vi.fn().mockResolvedValue(new Response(resume))
    vi.stubGlobal('fetch', fetch)

    const result = await downloadCandidateResume('candidate/1', 'jwt-token')

    expect(result).toBeInstanceOf(Blob)
    expect(await result.text()).toBe('pdf contents')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-token')
  })

  it('surfaces API errors to the caller', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({
      error: 'Invalid credentials.',
    }, 401))
    vi.stubGlobal('fetch', fetch)

    await expect(login({ username: 'recruiter', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials.')
  })
})
