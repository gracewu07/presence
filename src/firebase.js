import {
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
} from './lib/firebaseFirestore'
import { getMemberDocumentId, normalizeMemberEmail } from './services/memberService'

export async function fetchMemberProfile(memberId) {
  const memberRef = doc(db, 'members', getMemberDocumentId(memberId))
  const document = await getDoc(memberRef)
  if (!document.exists()) {
    return null
  }
  const data = document.data()
  const email = normalizeMemberEmail(data.email || document.id)
  return { id: document.id, ...data, email, uid: email }
}

export async function findApprovedMemberByEmail(email) {
  const normalizedEmail = normalizeMemberEmail(email)
  if (!normalizedEmail) return null

  const directRef = doc(db, 'members', getMemberDocumentId(normalizedEmail))
  const directSnap = await getDoc(directRef)
  if (directSnap.exists()) {
    const data = directSnap.data()
    if (data.accessStatus === 'approved') {
      return { id: directSnap.id, ...data, email: normalizeMemberEmail(data.email || normalizedEmail), uid: normalizedEmail }
    }
  }

  const membersRef = collection(db, 'members')
  const q = query(membersRef, where('email', '==', normalizedEmail), where('accessStatus', '==', 'approved'), limit(1))
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0]
    const data = docSnap.data()
    const memberEmail = normalizeMemberEmail(data.email || normalizedEmail)
    return { id: docSnap.id, ...data, email: memberEmail, uid: memberEmail }
  }

  return null
}

export async function createOrUpdateMemberProfile(memberId, profileData) {
  const email = normalizeMemberEmail(profileData.email || memberId)
  const memberRef = doc(db, 'members', getMemberDocumentId(email))
  await setDoc(memberRef, {
    ...profileData,
    email,
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

export async function updateEvent(eventId, eventData) {
  const eventRef = doc(db, 'events', eventId)
  await updateDoc(eventRef, {
    ...eventData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteEvent(eventId) {
  const eventRef = doc(db, 'events', eventId)
  await deleteDoc(eventRef)
}

export async function fetchEvents() {
  const eventsRef = collection(db, 'events')
  const q = query(eventsRef, orderBy('eventDate', 'asc'))

  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (error) {
    console.error('Unable to load firestore events:', error)
    return []
  }
}

export async function fetchUpcomingEvents(limitCount = 20) {
  const eventsRef = collection(db, 'events')
  const now = new Date().toISOString()
  const q = query(eventsRef, where('eventDate', '>=', now), orderBy('eventDate', 'asc'), limit(limitCount))

  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (error) {
    console.error('Unable to load upcoming firestore events:', error)
    return []
  }
}

export async function fetchEventsByDateRange(startIso, endIso) {
  const eventsRef = collection(db, 'events')
  const q = query(
    eventsRef,
    where('eventDate', '>=', startIso),
    where('eventDate', '<=', endIso),
    orderBy('eventDate', 'asc')
  )

  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (error) {
    console.error('Unable to load firestore events by date range:', error)
    return []
  }
}

export async function fetchEventsForCheckInWindow(limitCount = 20) {
  const eventsRef = collection(db, 'events')
  const now = new Date().toISOString()
  const q = query(eventsRef, where('endDate', '>=', now), orderBy('endDate', 'asc'), limit(limitCount))

  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
  } catch (error) {
    console.error('Unable to load check-in window events:', error)
    return []
  }
}

export async function fetchEventsByIds(eventIds = []) {
  const uniqueIds = Array.from(new Set(eventIds.filter(Boolean)))
  if (uniqueIds.length === 0) return []

  const snapshots = await Promise.all(
    uniqueIds.map((eventId) => getDoc(doc(db, 'events', eventId)).catch(() => null))
  )

  return snapshots
    .filter((snapshot) => snapshot?.exists?.())
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
}

export async function recordCheckIn(checkInData) {
  const checkInsRef = collection(db, 'checkIns')
  const memberEmail = normalizeMemberEmail(checkInData.memberEmail || checkInData.memberId)
  await addDoc(checkInsRef, {
    ...checkInData,
    memberId: memberEmail,
    memberEmail,
    createdAt: serverTimestamp(),
  })
}

export async function fetchCheckIns() {
  const checkInsRef = collection(db, 'checkIns')
  const snapshot = await getDocs(checkInsRef)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export function subscribeToCheckIns(onNext, onError) {
  const checkInsRef = collection(db, 'checkIns')
  return onSnapshot(
    checkInsRef,
    (snapshot) => {
      onNext(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
    },
    onError
  )
}

export async function fetchMemberCheckIns(memberId) {
  const checkInsRef = collection(db, 'checkIns')
  const normalizedMemberId = normalizeMemberEmail(memberId)
  const byMemberIdQuery = query(checkInsRef, where('memberId', '==', normalizedMemberId), orderBy('createdAt', 'desc'))
  const byEmailQuery = query(checkInsRef, where('memberEmail', '==', normalizedMemberId), orderBy('createdAt', 'desc'))
  const [byMemberIdSnapshot, byEmailSnapshot] = await Promise.all([getDocs(byMemberIdQuery), getDocs(byEmailQuery)])
  const docsById = new Map()
  ;[byMemberIdSnapshot, byEmailSnapshot].forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => docsById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }))
  })
  return Array.from(docsById.values())
}

export async function fetchMemberExcusalRequests(memberId) {
  const requestsRef = collection(db, 'excusalRequests')
  const normalizedMemberId = normalizeMemberEmail(memberId)
  const byMemberIdQuery = query(requestsRef, where('memberId', '==', normalizedMemberId))
  const byEmailQuery = query(requestsRef, where('memberEmail', '==', normalizedMemberId))
  const docsById = new Map()

  for (const memberQuery of [byMemberIdQuery, byEmailQuery]) {
    try {
      const snapshot = await getDocs(memberQuery)
      snapshot.docs.forEach((docSnap) => docsById.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }))
    } catch (error) {
      console.error('Unable to load member excusal request query:', error)
    }
  }

  return Array.from(docsById.values()).sort((first, second) => {
    const firstDate = first.submittedAt?.toDate ? first.submittedAt.toDate() : new Date(first.submittedAt || 0)
    const secondDate = second.submittedAt?.toDate ? second.submittedAt.toDate() : new Date(second.submittedAt || 0)
    return secondDate - firstDate
  })
}

export async function fetchExcusalRequests() {
  const requestsRef = collection(db, 'excusalRequests')
  const q = query(requestsRef, orderBy('submittedAt', 'desc'))
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
  const normalizedMemberId = normalizeMemberEmail(memberId)
  const byMemberIdQuery = query(
    checkInsRef,
    where('eventId', '==', eventId),
    where('memberId', '==', normalizedMemberId),
    limit(1)
  )
  const byEmailQuery = query(
    checkInsRef,
    where('eventId', '==', eventId),
    where('memberEmail', '==', normalizedMemberId),
    limit(1)
  )
  const [byMemberIdSnapshot, byEmailSnapshot] = await Promise.all([getDocs(byMemberIdQuery), getDocs(byEmailQuery)])
  const firstMatch = byMemberIdSnapshot.docs[0] || byEmailSnapshot.docs[0]
  if (!firstMatch) {
    return null
  }
  return { id: firstMatch.id, ...firstMatch.data() }
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
  const memberEmail = normalizeMemberEmail(requestData.memberEmail || requestData.memberId)
  const docRef = await addDoc(requestsRef, {
    ...requestData,
    memberId: memberEmail,
    memberEmail,
    status: 'pending',
    submittedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateExcusalStatus(requestId, status, reviewNotes = '') {
  const requestRef = doc(db, 'excusalRequests', requestId)
  await updateDoc(requestRef, {
    status,
    reviewedAt: serverTimestamp(),
    reviewNotes,
  })
}

export async function recordExcusedChapterCheckIn(excusalRequest) {
  const memberEmail = normalizeMemberEmail(excusalRequest.memberEmail || excusalRequest.memberId)
  if (!memberEmail || !excusalRequest.eventId) return { created: false, reason: 'missing-data' }

  const event = await fetchEventById(excusalRequest.eventId)
  const eventType = String(event?.eventType || '').trim().toLowerCase()
  if (eventType !== 'chapter') return { created: false, reason: 'not-chapter' }

  const existingCheckIn = await findCheckInByEventAndMember(excusalRequest.eventId, memberEmail)
  if (existingCheckIn) return { created: false, reason: 'already-checked-in' }

  await recordCheckIn({
    eventId: excusalRequest.eventId,
    memberId: memberEmail,
    memberEmail,
    memberName: excusalRequest.memberName || memberEmail,
    timestamp: new Date().toISOString(),
    distanceMeters: null,
    locationVerified: false,
    excusalApproved: true,
    excusalRequestId: excusalRequest.id,
    pointsAwarded: Number(event?.points ?? 0),
    eventType: event?.eventType || 'Chapter',
  })

  return { created: true, reason: 'excusal-approved' }
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
