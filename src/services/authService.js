import { auth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, firebaseOnAuthStateChanged } from '../lib/firebase'

const ACTION_CODE_SETTINGS = {
  // Redirect back to the app. Adjust as needed.
  url: typeof window !== 'undefined' ? window.location.origin + '/login' : 'http://localhost:3000/login',
  handleCodeInApp: true,
}

export async function sendSignInLink(email) {
  // send sign-in link to email (passwordless)
  await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS)
  // Save email locally to complete sign-in when user returns
  try {
    window.localStorage.setItem('emailForSignIn', email)
  } catch (e) {
    // ignore
  }
}

export function isSignInLink(url) {
  return isSignInWithEmailLink(auth, url)
}

export async function signInWithLink(url) {
  // Try to read email from storage
  let email = null
  try {
    email = window.localStorage.getItem('emailForSignIn')
  } catch (e) {
    // ignore
  }

  if (!email) {
    // If no stored email, caller should prompt user to enter their email
    throw new Error('No email found in local storage. Please sign in using the same email you requested the link with.')
  }

  const result = await signInWithEmailLink(auth, email, url)
  // Clear saved email
  try {
    window.localStorage.removeItem('emailForSignIn')
  } catch (e) {}
  return result.user
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function signOutUser() {
  await signOut(auth)
}
