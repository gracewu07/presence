import { db, collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '../lib/firebase'

export async function fetchMemberByEmail(email) {
  if (!email) return null
  const membersRef = collection(db, 'members')
  const q = query(membersRef, where('email', '==', email.toLowerCase()), )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, ...docSnap.data() }
}

export async function fetchMemberById(id) {
  if (!id) return null
  const ref = doc(db, 'members', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function fetchMembers() {
  const membersRef = collection(db, 'members')
  const snapshot = await getDocs(membersRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createMember(id, data) {
  const memberRef = doc(db, 'members', id)
  await setDoc(memberRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateMember(id, updates) {
  const memberRef = doc(db, 'members', id)
  await updateDoc(memberRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function setMemberAccessStatus(id, accessStatus) {
  await updateMember(id, { accessStatus })
}
