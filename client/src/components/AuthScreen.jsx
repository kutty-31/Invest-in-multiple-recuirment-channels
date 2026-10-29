import { useEffect, useRef, useState } from 'react'
import { login, loginWithGoogle, register } from '../api/auth'

function AuthScreen({ onAuthenticated }) {
  const googleButton = useRef(null)
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return undefined

    let active = true
    const renderGoogleButton = () => {
      const googleIdentity = window.google?.accounts?.id
      if (!active || !googleIdentity || !googleButton.current) return

      googleButton.current.replaceChildren()
      googleIdentity.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError('')
          setSubmitting(true)
          try {
            const session = await loginWithGoogle(credential)
            onAuthenticated(session)
          } catch (requestError) {
            setError(requestError.message)
          } finally {
            setSubmitting(false)
          }
        },
      })
      googleIdentity.renderButton(googleButton.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: Math.min(360, googleButton.current.clientWidth),
      })
    }

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.addEventListener('load', renderGoogleButton)
      script.addEventListener('error', () => {
        if (active) setError('Google sign-in could not be loaded. Please try again later.')
      }, { once: true })
      document.head.append(script)
    } else if (window.google?.accounts?.id) {
      renderGoogleButton()
    } else {
      script.addEventListener('load', renderGoogleButton, { once: true })
    }

    return () => {
      active = false
      script?.removeEventListener('load', renderGoogleButton)
    }
  }, [googleClientId, onAuthenticated])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await (mode === 'login' ? login : register)({ username, password })
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>Talentwise</span>
        </div>
        <p className="section-kicker">RECRUITING ANALYTICS</p>
        <h1 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to manage your recruiting pipeline.'
            : 'Register with a username and password to get started.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => changeMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => changeMode('register')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Username
            <input
              autoComplete="username"
              minLength="3"
              maxLength="30"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength="8"
              maxLength="72"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="auth-divider"><span>OR CONTINUE WITH</span></div>
        {googleClientId
          ? <div ref={googleButton} className="google-signin-button" />
          : <p className="google-config-note">Google sign-in requires a configured OAuth client ID.</p>}
        <p className="auth-security-note">Passwords are securely hashed. Google credentials are verified by the API.</p>
      </section>
    </main>
  )
}

export default AuthScreen
