import { db, collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '../lib/firebase'
import { isAllowedEmail } from '../config/authConfig'
import { ROLE_MEMBER, normalizeRole } from '../utils/permissions'

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
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
    role: normalizeRole(data.role) || ROLE_MEMBER,
    accessStatus: data.accessStatus === 'approved' ? 'approved' : 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function importApprovedMembers(members) {
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
  }

  for (const member of members) {
    const email = normalizeEmail(member.email)
    const id = email.replace(/[^a-z0-9]/gi, '_')

    try {
      if (!member.name?.trim()) {
        throw new Error('Name is required.')
      }
      if (!isAllowedEmail(email)) {
        throw new Error('Email must end in @unc.edu.')
      }

      await createMember(id, {
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
    safeUpdates.email = normalizeEmail(safeUpdates.email)
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
