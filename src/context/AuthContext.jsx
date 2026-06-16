import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import * as memberService from '../services/memberService'
import { isAllowedEmail } from '../config/authConfig'

const AuthContext = createContext(null)
const UNAPPROVED_MESSAGE = 'Your account is not approved for Presence. Please contact the VP of Standards.'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe = () => {}

    const initialize = async () => {
      if (typeof window !== 'undefined' && authService.isEmailSignInLink(window.location.href)) {
        try {
          const storedEmail = authService.getStoredSignInEmail()
          const email = storedEmail || window.prompt('Please enter the UNC email used to request this sign-in link:')

          await authService.completeSignInWithEmailLink(window.location.href, email)

          if (isMounted) {
            const cleanUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
          }
        } catch (err) {
          console.error(err)
          if (isMounted) {
            setError(err.message || 'Unable to complete sign-in. Please request a new link.')
          }
        }
      }

      unsubscribe = authService.onAuthStateChanged(async (user) => {
        if (!isMounted) return

        if (!user) {
          setCurrentUser(null)
          setLoading(false)
          return
        }

        try {
          const normalizedEmail = user.email?.trim().toLowerCase()
          const member = await memberService.fetchMemberByEmail(normalizedEmail)
          const canAccessApp = member?.role === 'member' || member?.role === 'admin'

          if (!member || member.accessStatus !== 'approved' || !canAccessApp) {
            await authService.signOutUser()
            setError(UNAPPROVED_MESSAGE)
            setCurrentUser(null)
            setLoading(false)
            return
          }

          setCurrentUser(member)
          setError(null)
          setLoading(false)
        } catch (err) {
          await authService.signOutUser()
          console.error(err)
          setError('Unable to verify your member approval. Please try again.')
          setCurrentUser(null)
          setLoading(false)
          return
        }
      })
    }

    initialize()

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  async function signIn(email) {
    setLoading(true)
    setError(null)

    try {
      const normalizedEmail = email?.trim().toLowerCase()
      if (!isAllowedEmail(normalizedEmail)) {
        setError('Please enter a valid UNC email ending in @unc.edu.')
        return null
      }

      await authService.sendSignInLink(normalizedEmail)
      return { sent: true }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to send sign-in link. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    await authService.signOutUser()
    setCurrentUser(null)
    setLoading(false)
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
