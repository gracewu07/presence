import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth'
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
import firebaseConfig from './firebaseConfig'

// Initialize Firebase app
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

// Authentication helpers
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOutUser() {
  await signOut(auth)
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function fetchMemberProfile(memberId) {
  const memberRef = doc(db, 'members', memberId)
  const document = await getDoc(memberRef)
  if (!document.exists()) {
    return null
  }
  return { id: document.id, ...document.data() }
}

export function getCurrentUser() {
  return auth.currentUser
}

// Firestore helpers
export async function createOrUpdateMemberProfile(memberId, profileData) {
  const memberRef = doc(db, 'members', memberId)
  await setDoc(memberRef, {
    ...profileData,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function createEvent(eventData) {
  const eventsRef = collection(db, 'events')
  await addDoc(eventsRef, {
    ...eventData,
    createdAt: serverTimestamp(),
  })
}

export async function fetchEvents() {
  const eventsRef = collection(db, 'events')
  const q = query(eventsRef, orderBy('eventDate', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function fetchUpcomingEvents() {
  const eventsRef = collection(db, 'events')
  const now = new Date().toISOString()
  const q = query(eventsRef, where('eventDate', '>=', now), orderBy('eventDate', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function recordCheckIn(checkInData) {
  const checkInsRef = collection(db, 'checkIns')
  await addDoc(checkInsRef, {
    ...checkInData,
    createdAt: serverTimestamp(),
  })
}

export async function fetchCheckIns() {
  const checkInsRef = collection(db, 'checkIns')
  const snapshot = await getDocs(checkInsRef)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function fetchMemberCheckIns(memberId) {
  const checkInsRef = collection(db, 'checkIns')
  const q = query(checkInsRef, where('memberId', '==', memberId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function fetchEventById(eventId) {
  const eventRef = doc(db, 'events', eventId)
  const snapshot = await getDoc(eventRef)
  if (!snapshot.exists()) {
    return null
  }
  return { id: snapshot.id, ...snapshot.data() }
}

export async function findCheckInByEventAndMember(eventId, memberId) {
  const checkInsRef = collection(db, 'checkIns')
  const q = query(
    checkInsRef,
    where('eventId', '==', eventId),
    where('memberId', '==', memberId),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    return null
  }
  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export async function fetchMembers() {
  const membersRef = collection(db, 'members')
  const snapshot = await getDocs(membersRef)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function fetchLeaderboard(limitCount = 10) {
  const membersRef = collection(db, 'members')
  const q = query(membersRef, orderBy('totalPoints', 'desc'), limit(limitCount))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function submitExcusalRequest(requestData) {
  const requestsRef = collection(db, 'excusalRequests')
  await addDoc(requestsRef, {
    ...requestData,
    status: 'pending',
    submittedAt: serverTimestamp(),
  })
}

export async function updateExcusalStatus(requestId, status, reviewNotes = '') {
  const requestRef = doc(db, 'excusalRequests', requestId)
  await updateDoc(requestRef, {
    status,
    reviewedAt: serverTimestamp(),
    reviewNotes,
  })
}

export async function fetchAppSettings() {
  const settingsRef = collection(db, 'appSettings')
  const snapshot = await getDocs(settingsRef)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function updateLeaderboardVisibility(visibility) {
  const settingsRef = collection(db, 'appSettings')
  const snapshot = await getDocs(settingsRef)

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref
    await updateDoc(docRef, { leaderboardVisibility: visibility })
  } else {
    await addDoc(settingsRef, { leaderboardVisibility: visibility, updatedAt: serverTimestamp() })
  }
}
