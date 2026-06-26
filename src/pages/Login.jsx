import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { currentUser, loading, error, signIn, createAccount, resetPassword } = useAuth()
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const isCreatingAccount = mode === 'create-account'

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(from, { replace: true })
    }
  }, [currentUser, from, loading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    const result = isCreatingAccount
      ? await createAccount(email, password)
      : await signIn(email, password)

    if (result?.created) {
      setMessage('Account created. Welcome to Presence.')
    } else if (result?.signedIn) {
      setMessage('Signed in. Welcome back.')
    }
  }

  async function handlePasswordReset() {
    setMessage('')
    const result = await resetPassword(email)

    if (result?.sent) {
      setPassword('')
      setMessage('Password reset email sent. Check your UNC inbox.')
    }
  }

  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>
          {isCreatingAccount
            ? 'Create your account with your approved UNC email and a password you will use for Presence.'
            : 'Sign in with your approved UNC email and Presence password.'}
        </p>

        <div className="auth-mode-toggle" role="tablist" aria-label="Login mode">
          <button
            type="button"
            className={mode === 'sign-in' ? 'active' : ''}
            onClick={() => {
              setMode('sign-in')
              setMessage('')
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'create-account' ? 'active' : ''}
            onClick={() => {
              setMode('create-account')
              setMessage('')
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            UNC email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="onyen@unc.edu"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isCreatingAccount ? 'Create a password' : 'Enter your password'}
              autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          <Button type="submit" variant="primary" disabled={loading}>
            {loading
              ? isCreatingAccount ? 'Creating...' : 'Signing in...'
              : isCreatingAccount ? 'Create account' : 'Sign in'}
          </Button>

          {!isCreatingAccount && (
            <button type="button" className="link-button auth-reset-link" onClick={handlePasswordReset} disabled={loading || !email}>
              Forgot password?
            </button>
          )}

          {message && <p className="muted">{message}</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Login
