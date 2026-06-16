import { db, collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '../lib/firebase'
import { isAllowedEmail } from '../config/authConfig'

const VALID_ROLES = new Set(['member', 'admin'])

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

function normalizeRole(role) {
  return VALID_ROLES.has(role) ? role : ''
}

function normalizeAccessStatus(accessStatus) {
  if (accessStatus === 'approved' || accessStatus === 'denied') return accessStatus
  return 'pending'
}

function withMemberDefaults(member) {
  if (!member) return null
  return {
    ...member,
    uid: member.id,
    email: normalizeEmail(member.email),
    role: normalizeRole(member.role),
    accessStatus: normalizeAccessStatus(member.accessStatus),
  }
}

export async function fetchMemberByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return null
  const membersRef = collection(db, 'members')
  const q = query(membersRef, where('email', '==', normalizedEmail))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const docSnap = snapshot.docs[0]
  return withMemberDefaults({ id: docSnap.id, ...docSnap.data() })
}

export async function fetchMemberById(id) {
  if (!id) return null
  const ref = doc(db, 'members', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return withMemberDefaults({ id: snap.id, ...snap.data() })
}

export async function fetchMembers() {
  const membersRef = collection(db, 'members')
  const snapshot = await getDocs(membersRef)
  return snapshot.docs.map((d) => withMemberDefaults({ id: d.id, ...d.data() }))
}

export async function createMember(id, data) {
  const email = normalizeEmail(data.email)
  if (!isAllowedEmail(email)) {
    throw new Error('Members must use a UNC email ending in @unc.edu.')
  }

  const memberRef = doc(db, 'members', id)
  await setDoc(memberRef, {
    ...data,
    email,
    role: normalizeRole(data.role) || 'member',
    accessStatus: data.accessStatus === 'approved' ? 'approved' : 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function updateMember(id, updates) {
  const safeUpdates = { ...updates }
  if (safeUpdates.email !== undefined) {
    safeUpdates.email = normalizeEmail(safeUpdates.email)
    if (!isAllowedEmail(safeUpdates.email)) {
      throw new Error('Members must use a UNC email ending in @unc.edu.')
    }
  }
  if (safeUpdates.role !== undefined) {
    safeUpdates.role = normalizeRole(safeUpdates.role)
    if (!safeUpdates.role) {
      throw new Error('Member role must be member or admin.')
    }
  }
  if (safeUpdates.accessStatus !== undefined) {
    safeUpdates.accessStatus = normalizeAccessStatus(safeUpdates.accessStatus)
  }

  const memberRef = doc(db, 'members', id)
  await updateDoc(memberRef, {
    ...safeUpdates,
    updatedAt: serverTimestamp(),
  })
}

export async function setMemberAccessStatus(id, accessStatus) {
  await updateMember(id, { accessStatus })
}
