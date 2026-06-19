import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const AUTH_BYPASS_ENABLED = true
const PROFILE_PHOTO_STORAGE_KEY = 'presenceProfilePhoto'
const MEMBER_SETTINGS_STORAGE_KEY = 'presenceMemberSettings'
const TEST_MEMBER_USER = {
  id: 'local-test-member',
  uid: 'local-test-member',
  name: 'Grace Wu',
  email: 'gracewu@unc.edu',
  role: 'admin',
  accessStatus: 'approved',
  status: 'active',
  pledgeClass: 'Delta',
  family: 'Fireball',
  totalPoints: 0,
  attendanceRate: 1,
  absences: 0,
  excusalsSubmitted: 0,
  photoUrl: localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY) || '',
}

const getMemberSettingsKey = (email) => `${MEMBER_SETTINGS_STORAGE_KEY}:${email?.toLowerCase() || 'local'}`

const getStoredMemberSettings = (email) => {
  try {
    return JSON.parse(localStorage.getItem(getMemberSettingsKey(email))) || {}
  } catch {
    return {}
  }
}

const getTestMemberUser = () => ({
  ...TEST_MEMBER_USER,
  ...(() => {
    const savedSettings = getStoredMemberSettings(TEST_MEMBER_USER.email)
    return {
      name: savedSettings.displayName || TEST_MEMBER_USER.name,
      preferredName: savedSettings.preferredName || '',
      contactEmail: savedSettings.contactEmail || TEST_MEMBER_USER.email,
      phoneNumber: savedSettings.phoneNumber || '',
      preferences: savedSettings,
    }
  })(),
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

  function updateProfilePreferences(preferences) {
    setCurrentUser((user) => {
      if (!user) return user

      localStorage.setItem(getMemberSettingsKey(user.email), JSON.stringify(preferences))

      return {
        ...user,
        name: preferences.displayName?.trim() || user.name,
        preferredName: preferences.preferredName?.trim() || '',
        contactEmail: preferences.contactEmail?.trim() || user.email,
        phoneNumber: preferences.phoneNumber?.trim() || '',
        preferences,
      }
    })
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signIn, signOut, updateProfilePhoto, updateProfilePreferences }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
