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
    const res = await signIn(email.trim())
    if (res && res.sent) setSent(true)
  }

  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>Enter your UNC email (ending with @unc.edu). We'll send a sign-in link to your Outlook account.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Sending…' : 'Send sign-in link'}</Button>
          {sent && <p className="muted">Sign-in link sent. Check your UNC email and follow the link to complete sign-in.</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Login
