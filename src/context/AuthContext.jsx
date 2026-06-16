import { createContext, useContext, useEffect, useState } from 'react'
import {
  createOrUpdateMemberProfile,
  fetchMemberProfile,
  onAuthStateChanged,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
} from '../firebase'
import { adminEmails, isAllowedEmail } from '../config/authConfig'

const AuthContext = createContext(null)

function buildMemberProfile(user) {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Member',
    email: user.email,
    role: adminEmails.includes(user.email) ? 'admin' : 'member',
    pledgeClass: 'Pending',
    totalPoints: 0,
    status: 'active',
    committee: 'General',
    attendanceRate: 0,
    createdAt: new Date().toISOString(),
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      if (!isAllowedEmail(user.email)) {
        await firebaseSignOutUser()
        setError('Please sign in with your UNC email address.')
        setCurrentUser(null)
        setLoading(false)
        return
      }

      const profile = await fetchMemberProfile(user.uid)
      if (profile) {
        setCurrentUser(profile)
      } else {
        const newProfile = buildMemberProfile(user)
        await createOrUpdateMemberProfile(user.uid, newProfile)
        setCurrentUser({ id: user.uid, ...newProfile })
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signIn() {
    setLoading(true)
    setError(null)

    try {
      const user = await firebaseSignInWithGoogle()
      if (!isAllowedEmail(user.email)) {
        await firebaseSignOutUser()
        setError('Please sign in with your UNC email address.')
        setCurrentUser(null)
        return null
      }

      const profile = await fetchMemberProfile(user.uid)
      if (profile) {
        setCurrentUser(profile)
        return profile
      }

      const newProfile = buildMemberProfile(user)
      await createOrUpdateMemberProfile(user.uid, newProfile)
      const savedProfile = { id: user.uid, ...newProfile }
      setCurrentUser(savedProfile)
      return savedProfile
    } catch (signInError) {
      console.error(signInError)
      setError('Unable to sign in. Please try again.')
      setCurrentUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    await firebaseSignOutUser()
    setCurrentUser(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
