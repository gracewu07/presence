import {
  auth,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  firebaseOnAuthStateChanged,
} from '../lib/firebase'
import { isAllowedEmail } from '../config/authConfig'

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

function getAuthErrorMessage(error) {
  switch (error?.code) {
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Firebase is using an invalid API key. Check .env and restart the dev server.'
    case 'auth/operation-not-allowed':
      return 'Firebase email/password sign-in is not enabled. Enable Email/Password in Firebase Authentication.'
    case 'auth/unauthorized-domain':
      return 'This app URL is not authorized in Firebase Authentication. Add localhost to Authentication > Settings > Authorized domains.'
    case 'auth/invalid-email':
      return 'Please enter a valid UNC email ending in @unc.edu.'
    case 'auth/network-request-failed':
      return 'Firebase could not be reached. Check your internet connection and try again.'
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Please sign in instead.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.'
    case 'auth/weak-password':
      return 'Please choose a stronger password with at least 6 characters.'
    case 'auth/missing-password':
      return 'Please enter your password.'
    case 'auth/requires-recent-login':
      return 'Please sign out and sign back in before changing your password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit and try again.'
    default:
      return error?.message || 'Firebase sign-in failed. Please try again.'
  }
}

function validateUncEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  if (!isAllowedEmail(normalizedEmail)) {
    throw new Error('Please enter a valid UNC email ending in @unc.edu.')
  }
  return normalizedEmail
}

export async function createAccountWithPassword(email, password) {
  const normalizedEmail = validateUncEmail(email)

  try {
    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error), { cause: error })
  }
}

export async function signInWithPassword(email, password) {
  const normalizedEmail = validateUncEmail(email)

  try {
    const result = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error), { cause: error })
  }
}

export async function sendPasswordReset(email) {
  const normalizedEmail = validateUncEmail(email)

  try {
    await sendPasswordResetEmail(auth, normalizedEmail)
    return normalizedEmail
  } catch (error) {
    throw new Error(getAuthErrorMessage(error), { cause: error })
  }
}

export async function changeCurrentPassword(currentPassword, newPassword) {
  const user = auth.currentUser

  if (!user?.email) {
    throw new Error('You must be signed in to change your password.')
  }

  if (!currentPassword) {
    throw new Error('Please enter your current password.')
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Please choose a stronger password with at least 6 characters.')
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  } catch (error) {
    throw new Error(getAuthErrorMessage(error), { cause: error })
  }
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function signOutUser() {
  await signOut(auth)
}

export async function deleteCurrentAuthUser() {
  if (auth.currentUser) {
    await deleteUser(auth.currentUser)
  }
}
