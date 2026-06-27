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
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { app } from './firebaseApp'

const db = getFirestore(app)

export {
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
}
