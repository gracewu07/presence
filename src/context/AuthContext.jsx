import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const AUTH_BYPASS_ENABLED = true
const TEST_MEMBER_USER = {
  id: 'local-test-member',
  uid: 'local-test-member',
  name: 'Grace Wu',
  email: 'gracewu@unc.edu',
  role: 'member',
  accessStatus: 'approved',
  status: 'active',
  totalPoints: 0,
  attendanceRate: 1,
  absences: 0,
  excusalsSubmitted: 0,
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(AUTH_BYPASS_ENABLED ? TEST_MEMBER_USER : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function signIn() {
    setError(null)
    setCurrentUser(TEST_MEMBER_USER)
    return { signedIn: true }
  }

  async function signOut() {
    setError(null)
    setCurrentUser(TEST_MEMBER_USER)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
