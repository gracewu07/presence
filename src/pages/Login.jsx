import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { getStoredSignInEmail, isEmailSignInLink } from '../services/authService'

function Login() {
  const { currentUser, loading, error, signIn, completeEmailLinkSignIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isCompletingLink, setIsCompletingLink] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const signInUrl = typeof window !== 'undefined' ? window.location.href : ''
  const hasEmailLink = isEmailSignInLink(signInUrl)

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(from, { replace: true })
    }
  }, [currentUser, from, loading, navigate])

  useEffect(() => {
    if (!hasEmailLink || currentUser) return

    const storedEmail = getStoredSignInEmail()
    if (!storedEmail) return

    setEmail(storedEmail)
    setIsCompletingLink(true)
    completeEmailLinkSignIn(signInUrl, storedEmail).finally(() => {
      setIsCompletingLink(false)
    })
  }, [completeEmailLinkSignIn, currentUser, hasEmailLink, signInUrl])

  async function handleSubmit(e) {
    e.preventDefault()

    if (hasEmailLink) {
      setIsCompletingLink(true)
      await completeEmailLinkSignIn(signInUrl, email)
      setIsCompletingLink(false)
      return
    }

    const res = await signIn(email)
    if (res?.sent) setSent(true)
  }

  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>
          {hasEmailLink
            ? 'Confirm the UNC email you used to request this sign-in link.'
            : 'Enter your UNC email. Presence will send a passwordless sign-in link and check your email against the approved AKPsi member list.'}
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            UNC email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="onyen@unc.edu"
              required
            />
          </label>
          <Button type="submit" variant="primary" disabled={loading}>
            {hasEmailLink
              ? isCompletingLink || loading ? 'Signing in...' : 'Complete sign-in'
              : loading ? 'Sending...' : 'Send sign-in link'}
          </Button>
          {sent && <p className="muted">Sign-in link sent. Check your UNC email and open the link to finish signing in.</p>}
          {hasEmailLink && !getStoredSignInEmail() && (
            <p className="muted">For security, enter the same UNC email address that received the link.</p>
          )}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Login
