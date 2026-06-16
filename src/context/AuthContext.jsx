import { createContext, useContext, useEffect, useState } from 'react'
import {
  createOrUpdateMemberProfile,
  fetchMemberProfile,
  onAuthStateChanged,
  signInWithMicrosoft as firebaseSignInWithMicrosoft,
  signOutUser as firebaseSignOutUser,
  findApprovedMemberByEmail,
} from '../firebase'
import { isAllowedEmail } from '../config/authConfig'

const AuthContext = createContext(null)

function buildMemberProfile(user, opts = {}) {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Member',
    email: user.email,
    role: opts.role || 'member',
    pledgeClass: opts.pledgeClass || 'Pending',
    totalPoints: opts.totalPoints || 0,
    status: opts.status || 'active',
    committee: opts.committee || 'General',
    attendanceRate: opts.attendanceRate || 0,
    createdAt: opts.createdAt || new Date().toISOString(),
    accessStatus: opts.accessStatus || 'approved',
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
      // Verify UNC email domain first
      if (!isAllowedEmail(user.email)) {
        await firebaseSignOutUser()
        setError('Please sign in with your UNC email address.')
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Check approved members list (approvedMembers or members.accessStatus)
      const approved = await findApprovedMemberByEmail(user.email)
      if (!approved) {
        await firebaseSignOutUser()
        setError('Your account has not been approved for Presence. Please contact the VP of Standards.')
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Ensure a members profile exists for the signed-in uid; if not, create one
      const profile = await fetchMemberProfile(user.uid)
      if (profile) {
        setCurrentUser(profile)
      } else {
        const newProfile = buildMemberProfile(user, {
          role: approved.role || 'member',
          pledgeClass: approved.pledgeClass || 'Pending',
          totalPoints: approved.totalPoints || 0,
          status: approved.status || 'active',
          committee: approved.committee || 'General',
          attendanceRate: approved.attendanceRate || 0,
          accessStatus: 'approved',
        })
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
      const user = await firebaseSignInWithMicrosoft()

      if (!isAllowedEmail(user.email)) {
        await firebaseSignOutUser()
        setError('Please sign in with your UNC email address.')
        setCurrentUser(null)
        return null
      }

      const approved = await findApprovedMemberByEmail(user.email)
      if (!approved) {
        await firebaseSignOutUser()
        setError('Your account has not been approved for Presence. Please contact the VP of Standards.')
        setCurrentUser(null)
        return null
      }

      const profile = await fetchMemberProfile(user.uid)
      if (profile) {
        setCurrentUser(profile)
        return profile
      }

      const newProfile = buildMemberProfile(user, {
        role: approved.role || 'member',
        pledgeClass: approved.pledgeClass || 'Pending',
        totalPoints: approved.totalPoints || 0,
        status: approved.status || 'active',
        committee: approved.committee || 'General',
        attendanceRate: approved.attendanceRate || 0,
        accessStatus: 'approved',
      })
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
