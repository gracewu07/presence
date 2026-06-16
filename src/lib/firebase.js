import { initializeApp } from 'firebase/app'
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import firebaseConfig from '../firebaseConfig'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, firebaseOnAuthStateChanged, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, orderBy, limit, serverTimestamp }
