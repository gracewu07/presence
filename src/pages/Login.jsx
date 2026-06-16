import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { currentUser, loading, error, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(from, { replace: true })
    }
  }, [currentUser, from, loading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await signIn(email)
    if (res?.sent) setSent(true)
  }

  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>Enter your UNC email. Presence will send a passwordless sign-in link and check your email against the approved AKPsi member list.</p>
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
            {loading ? 'Sending...' : 'Send sign-in link'}
          </Button>
          {sent && <p className="muted">Sign-in link sent. Check your UNC email and open the link to finish signing in.</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Login
