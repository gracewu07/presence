import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { currentUser, loading, error, signIn } = useAuth()
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
    await signIn()
  }

  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>Sign in with your UNC Microsoft (Outlook/SSO) account to access attendance and chapter tools.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in with Microsoft'}
          </Button>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Login
