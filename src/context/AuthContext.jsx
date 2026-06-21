import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  createAccountWithPassword,
  deleteCurrentAuthUser,
  onAuthStateChanged,
  sendPasswordReset,
  signInWithPassword,
  signOutUser,
} from '../services/authService'
import { fetchMemberByEmail } from '../services/memberService'

const AuthContext = createContext(null)
const PROFILE_PHOTO_STORAGE_KEY = 'presenceProfilePhoto'
const MEMBER_SETTINGS_STORAGE_KEY = 'presenceMemberSettings'
const NOT_APPROVED_MESSAGE = 'Your account is not approved for Presence. Please contact the VP of Standards.'

const getMemberSettingsKey = (email) => `${MEMBER_SETTINGS_STORAGE_KEY}:${email?.toLowerCase() || 'local'}`

const getStoredMemberSettings = (email) => {
  try {
    return JSON.parse(localStorage.getItem(getMemberSettingsKey(email))) || {}
  } catch {
    return {}
  }
}

const getProfilePhoto = () => localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY) || ''

function applyLocalProfileState(member, firebaseUser) {
  const savedSettings = getStoredMemberSettings(member.email)
  const memberEmail = member.email?.trim().toLowerCase() || firebaseUser.email?.trim().toLowerCase() || ''

  return {
    ...member,
    authUid: firebaseUser.uid,
    email: memberEmail,
    uid: memberEmail,
    name: savedSettings.displayName || member.name,
    preferredName: savedSettings.preferredName || '',
    contactEmail: savedSettings.contactEmail || memberEmail,
    phoneNumber: savedSettings.phoneNumber || '',
    preferences: savedSettings,
    photoUrl: getProfilePhoto(),
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadApprovedMember = useCallback(async (firebaseUser) => {
    if (!firebaseUser?.email) {
      setCurrentUser(null)
      return null
    }

    const member = await fetchMemberByEmail(firebaseUser.email)

    if (!member || member.accessStatus !== 'approved') {
      setCurrentUser(null)
      setError(NOT_APPROVED_MESSAGE)
      await signOutUser()
      return null
    }

    const approvedMember = applyLocalProfileState(member, firebaseUser)
    setCurrentUser(approvedMember)
    setError(null)
    return approvedMember
  }, [])

  const fetchApprovedMemberForEmail = useCallback(async (email) => {
    const member = await fetchMemberByEmail(email)

    if (!member || member.accessStatus !== 'approved') {
      throw new Error(NOT_APPROVED_MESSAGE)
    }

    return member
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      setLoading(true)

      try {
        if (!firebaseUser) {
          setCurrentUser(null)
          return
        }

        await loadApprovedMember(firebaseUser)
      } catch (err) {
        setCurrentUser(null)
        setError(err.message || 'Unable to verify your Presence account.')
        await signOutUser()
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [loadApprovedMember])

  const signIn = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)

    try {
      const firebaseUser = await signInWithPassword(email, password)
      const approvedMember = await loadApprovedMember(firebaseUser)
      return { signedIn: Boolean(approvedMember) }
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
      await signOutUser()
      return { signedIn: false }
    } finally {
      setLoading(false)
    }
  }, [loadApprovedMember])

  const createAccount = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)

    try {
      const firebaseUser = await createAccountWithPassword(email, password)
      const member = await fetchApprovedMemberForEmail(firebaseUser.email)
      const approvedMember = applyLocalProfileState(member, firebaseUser)
      setCurrentUser(approvedMember)
      setError(null)
      return { created: Boolean(approvedMember) }
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
      await deleteCurrentAuthUser().catch(() => signOutUser())
      setCurrentUser(null)
      return { created: false }
    } finally {
      setLoading(false)
    }
  }, [fetchApprovedMemberForEmail])

  const resetPassword = useCallback(async (email) => {
    setError(null)
    setLoading(true)

    try {
      await fetchApprovedMemberForEmail(email)
      await sendPasswordReset(email)
      return { sent: true }
    } catch (err) {
      setError(err.message || 'Unable to send password reset email.')
      return { sent: false }
    } finally {
      setLoading(false)
    }
  }, [fetchApprovedMemberForEmail])

  const signOut = useCallback(async () => {
    setError(null)
    await signOutUser()
    setCurrentUser(null)
  }, [])

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
    <AuthContext.Provider value={{ currentUser, loading, error, signIn, createAccount, resetPassword, signOut, updateProfilePhoto, updateProfilePreferences }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
