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
const actionCodeSettings = {
  url: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:5173/login',
  handleCodeInApp: true,
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

export async function sendSignInLink(email) {
  const normalizedEmail = normalizeEmail(email)
  if (!isAllowedEmail(normalizedEmail)) {
    throw new Error('Please enter a valid UNC email ending in @unc.edu.')
  }

  await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings)
  window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail)
  return normalizedEmail
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

  const result = await signInWithEmailLink(auth, normalizedEmail, url)
  window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY)
  return result.user
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function signOutUser() {
  await signOut(auth)
}
