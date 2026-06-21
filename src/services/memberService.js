import { db, collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '../lib/firebase'
import { isAllowedEmail } from '../config/authConfig'
import { ROLE_MEMBER, normalizeRole } from '../utils/permissions'

export function normalizeMemberEmail(email) {
  return email?.trim().toLowerCase() || ''
}

export function getMemberDocumentId(email) {
  return normalizeMemberEmail(email)
}

function normalizeAccessStatus(accessStatus) {
  if (accessStatus === 'approved' || accessStatus === 'denied') return accessStatus
  return 'pending'
}

function withMemberDefaults(member) {
  if (!member) return null
  const email = normalizeMemberEmail(member.email || member.id)
  return {
    ...member,
    email,
    uid: email,
    role: normalizeRole(member.role),
    accessStatus: normalizeAccessStatus(member.accessStatus),
  }
}

export async function fetchMemberByEmail(email) {
  const normalizedEmail = normalizeMemberEmail(email)
  if (!normalizedEmail) return null

  const directRef = doc(db, 'members', getMemberDocumentId(normalizedEmail))
  const directSnap = await getDoc(directRef)
  if (directSnap.exists()) {
    return withMemberDefaults({ id: directSnap.id, ...directSnap.data(), email: directSnap.data().email || normalizedEmail })
  }

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
  const email = normalizeMemberEmail(data.email || id)
  if (!isAllowedEmail(email)) {
    throw new Error('Members must use a UNC email ending in @unc.edu.')
  }

  const memberRef = doc(db, 'members', getMemberDocumentId(email))
  const existingSnap = await getDoc(memberRef)
  const memberData = {
    ...data,
    email,
    role: normalizeRole(data.role) || ROLE_MEMBER,
    accessStatus: data.accessStatus === 'approved' ? 'approved' : 'pending',
    status: data.status?.trim?.() || data.status || 'active',
    updatedAt: serverTimestamp(),
  }

  if (!existingSnap.exists()) {
    memberData.createdAt = serverTimestamp()
    memberData.totalPoints = Number(data.totalPoints ?? 0)
    memberData.eventsAttended = Number(data.eventsAttended ?? 0)
  } else {
    if (data.totalPoints !== undefined) memberData.totalPoints = Number(data.totalPoints)
    if (data.eventsAttended !== undefined) memberData.eventsAttended = Number(data.eventsAttended)
  }

  await setDoc(memberRef, memberData, { merge: true })
}

export async function importApprovedMembers(members) {
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  for (const member of members) {
    const email = normalizeMemberEmail(member.email)

    try {
      if (!member.name?.trim()) {
        throw new Error('Name is required.')
      }
      if (!isAllowedEmail(email)) {
        throw new Error('Email must end in @unc.edu.')
      }

      await createMember(email, {
        name: member.name.trim(),
        email,
        pledgeClass: member.pledgeClass?.trim() || '',
        family: member.family?.trim() || '',
        role: normalizeRole(member.role) || ROLE_MEMBER,
        status: member.status?.trim() || 'active',
        accessStatus: 'approved',
      })

      results.successCount += 1
    } catch (error) {
      results.errorCount += 1
      results.errors.push({
        email: email || member.email || 'unknown',
        message: error.message || 'Import failed.',
      })
    }
  }

  return results
}

export async function updateMember(id, updates) {
  const safeUpdates = { ...updates }
  if (safeUpdates.email !== undefined) {
    safeUpdates.email = normalizeMemberEmail(safeUpdates.email)
    if (!isAllowedEmail(safeUpdates.email)) {
      throw new Error('Members must use a UNC email ending in @unc.edu.')
    }
  }
  if (safeUpdates.role !== undefined) {
    safeUpdates.role = normalizeRole(safeUpdates.role)
    if (!safeUpdates.role) {
      throw new Error('Member role must be member, admin, or super-admin.')
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
