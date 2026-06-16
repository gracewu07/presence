import Button from '../components/Button'

function Login() {
  return (
    <section className="page auth-page">
      <div className="auth-card card">
        <h1>Member Login</h1>
        <p>Enter your chapter credentials to access attendance and event tools.</p>
        <form className="auth-form">
          <label>
            Email
            <input type="email" placeholder="you@presence.app" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <Button type="submit">Sign In</Button>
        </form>
      </div>
    </section>
  )
}

export default Login
