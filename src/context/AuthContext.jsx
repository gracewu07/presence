import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const AUTH_BYPASS_ENABLED = true
const PROFILE_PHOTO_STORAGE_KEY = 'presenceProfilePhoto'
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
  photoUrl: localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY) || '',
}

const getTestMemberUser = () => ({
  ...TEST_MEMBER_USER,
  photoUrl: localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY) || '',
})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(AUTH_BYPASS_ENABLED ? getTestMemberUser() : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function signIn() {
    setError(null)
    setCurrentUser(getTestMemberUser())
    return { signedIn: true }
  }

  async function signOut() {
    setError(null)
    setCurrentUser(getTestMemberUser())
  }

  function updateProfilePhoto(photoUrl) {
    localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, photoUrl)
    setCurrentUser((user) => user ? { ...user, photoUrl } : user)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signIn, signOut, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
