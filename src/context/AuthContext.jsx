import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import * as memberService from '../services/memberService'
import { isAllowedEmail } from '../config/authConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Complete sign-in if this URL contains an email sign-in link
    async function tryCompleteSignIn() {
      const href = typeof window !== 'undefined' ? window.location.href : ''
      try {
        if (authService.isSignInLink(href)) {
          try {
            const user = await authService.signInWithLink(href)
            // signInWithLink will sign the user in via Firebase; onAuthStateChanged below will handle approval
          } catch (err) {
            setError(err.message || 'Unable to complete sign-in. Please request a new sign-in link.')
          }
        }
      } catch (e) {
        // ignore
      }
    }

    tryCompleteSignIn()

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Require UNC email domain
      if (!isAllowedEmail(user.email)) {
        await authService.signOutUser()
        setError('Please sign in with your UNC email address.')
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Lookup member record; user must exist in members with accessStatus === 'approved'
      const member = await memberService.fetchMemberByEmail(user.email)
      if (!member || member.accessStatus !== 'approved') {
        await authService.signOutUser()
        setError('Your account has not been approved for Presence. Please contact the VP of Standards.')
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Member is approved: set currentUser to the member document (includes role)
      setCurrentUser(member)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Send sign-in link to email (passwordless)
  async function signIn(email) {
    setLoading(true)
    setError(null)
    if (!email || !isAllowedEmail(email)) {
      setError('Please enter a valid UNC email (ending with @unc.edu).')
      setLoading(false)
      return null
    }

    try {
      await authService.sendSignInLink(email)
      return { sent: true }
    } catch (err) {
      console.error(err)
      setError('Failed to send sign-in link. Please try again.')
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

export function useAuth() {
  return useContext(AuthContext)
}
