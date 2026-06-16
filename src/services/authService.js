import {
  auth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  firebaseOnAuthStateChanged,
} from '../lib/firebase'
import { isAllowedEmail } from '../config/authConfig'

const EMAIL_LINK_STORAGE_KEY = 'presenceEmailForSignIn'
const localEmailLinkOrigin =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? `${window.location.protocol}//localhost:${window.location.port}`
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173'

const actionCodeSettings = {
  url: `${localEmailLinkOrigin}/login`,
  handleCodeInApp: true,
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase is using an invalid API key. Check .env and restart the dev server.'
    case 'auth/operation-not-allowed':
      return 'Firebase email-link sign-in is not enabled. Enable Email/Password and passwordless email link in Firebase Authentication.'
    case 'auth/unauthorized-domain':
      return 'This app URL is not authorized in Firebase Authentication. Add localhost to Authentication > Settings > Authorized domains.'
    case 'auth/invalid-email':
      return 'Please enter a valid UNC email ending in @unc.edu.'
    case 'auth/network-request-failed':
      return 'Firebase could not be reached. Check your internet connection and try again.'
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This sign-in link is invalid or expired. Please request a new link.'
    default:
      return error?.message || 'Firebase sign-in failed. Please try again.'
  }
}

export async function sendSignInLink(email) {
  const normalizedEmail = normalizeEmail(email)
  if (!isAllowedEmail(normalizedEmail)) {
    throw new Error('Please enter a valid UNC email ending in @unc.edu.')
  }

  try {
    await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings)
    window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail)
    return normalizedEmail
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export function isEmailSignInLink(url) {
  if (!url) return false
  return isSignInWithEmailLink(auth, url)
}

export function getStoredSignInEmail() {
  return window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || ''
}

export async function completeSignInWithEmailLink(url, email) {
  const normalizedEmail = normalizeEmail(email || getStoredSignInEmail())
  if (!isAllowedEmail(normalizedEmail)) {
    throw new Error('Please enter the same UNC email used to request the sign-in link.')
  }

  try {
    const result = await signInWithEmailLink(auth, normalizedEmail, url)
    window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY)
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function signOutUser() {
  await signOut(auth)
}
