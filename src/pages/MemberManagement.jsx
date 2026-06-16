import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MemberCard from '../components/MemberCard'
import Button from '../components/Button'
import * as memberService from '../services/memberService'

function MemberManagement() {
  const { currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'member', accessStatus: 'pending' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const m = await memberService.fetchMembers()
        setMembers(m)
      } catch (err) {
        console.error('Failed to load members', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(memberId, updates) {
    try {
      await memberService.updateMember(memberId, updates)
      const m = await memberService.fetchMembers()
      setMembers(m)
      setEditing(null)
    } catch (err) {
      console.error('Failed to save member', err)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.email || !form.name) return
    if (currentUser?.role !== 'admin') return alert('Only admins can add members')

    const id = `${form.email.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`
    try {
      await memberService.createMember(id, { name: form.name, email: form.email.toLowerCase(), role: form.role, accessStatus: form.accessStatus })
      const m = await memberService.fetchMembers()
      setMembers(m)
      setForm({ name: '', email: '', role: 'member', accessStatus: 'pending' })
    } catch (err) {
      console.error('Failed to create member', err)
    }
  }

  if (loading) return <div className="page page--loading">Loading members…</div>

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Member Management</p>
          <h1>Chapter Members</h1>
          <p className="muted">View and manage members, roles, and participation status.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {currentUser?.role === 'admin' && (
          <div className="card">
            <h3>Add new member</h3>
            <form onSubmit={handleCreate} className="auth-form">
              <label>Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></label>
              <label>Email<input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></label>
              <label>Role
                <select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>Access status
                <select value={form.accessStatus} onChange={(e) => setForm((s) => ({ ...s, accessStatus: e.target.value }))}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="denied">denied</option>
                </select>
              </label>
              <Button type="submit">Add member</Button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Members</h3>
          {members.length === 0 ? <div className="empty-state">No members found.</div> : (
            members.map((m) => (
              <div key={m.id} style={{ marginBottom: 12 }}>
                <MemberCard member={m} />
                {editing === m.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(m.id, { name: m.name, role: e.target.role.value, accessStatus: e.target.accessStatus.value }) }}>
                    <label>Role
                      <select name="role" defaultValue={m.role}>
                        <option value="member">Member</option>
                        <option value="officer">Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label>Access status
                      <select name="accessStatus" defaultValue={m.accessStatus || 'pending'}>
                        <option value="pending">pending</option>
                        <option value="approved">approved</option>
                        <option value="denied">denied</option>
                      </select>
                    </label>
                    <Button type="submit">Save</Button>
                    <Button type="button" onClick={() => setEditing(null)}>Cancel</Button>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {currentUser?.role === 'admin' && <Button onClick={() => setEditing(m.id)}>Edit</Button>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default MemberManagement
