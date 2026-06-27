import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth'
import { app } from './firebaseApp'

const auth = getAuth(app)

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  signOut,
  firebaseOnAuthStateChanged,
}
