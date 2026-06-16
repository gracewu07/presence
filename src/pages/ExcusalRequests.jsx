import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import { fetchExcusalRequests, fetchEvents, submitExcusalRequest, updateExcusalStatus } from '../firebase'

function ExcusalRequests() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ eventId: '', reason: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allRequests, allEvents] = await Promise.all([fetchExcusalRequests(), fetchEvents()])
        setRequests(allRequests)
        setEvents(allEvents)
      } catch (err) {
        console.error('Failed to load excusal data', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const memberRequests = useMemo(() => requests.filter((r) => r.memberId === currentUser?.uid), [requests, currentUser])
  const adminView = currentUser?.role === 'admin'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.eventId || !form.reason) return
    setSaving(true)
    try {
      await submitExcusalRequest({
        memberId: currentUser.uid,
        memberName: currentUser.name,
        memberEmail: currentUser.email,
        eventId: form.eventId,
        eventTitle: events.find((ev) => ev.id === form.eventId)?.title || '',
        reason: form.reason,
      })
      setForm({ eventId: '', reason: '' })
      // reload
      const all = await fetchExcusalRequests()
      setRequests(all)
    } catch (err) {
      console.error('Failed to submit excusal', err)
    } finally {
      setSaving(false)
    }
  }

  async function reviewRequest(id, status, notes) {
    try {
      await updateExcusalStatus(id, status, notes || '')
      const all = await fetchExcusalRequests()
      setRequests(all)
    } catch (err) {
      console.error('Failed to update excusal status', err)
    }
  }

  if (loading) return <div className="page page--loading">Loading excusal requests…</div>

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Excusal Requests</p>
          <h1>Manage Excusals</h1>
          <p className="muted">Submit or review excusal requests.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        <div className="card">
          <h3>Submit an excusal</h3>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Event
              <select value={form.eventId} onChange={(e) => setForm((s) => ({ ...s, eventId: e.target.value }))}>
                <option value="">Select an event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title} · {ev.eventType}</option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <textarea value={form.reason} onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))} />
            </label>
            <Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit excusal'}</Button>
          </form>

          <h4>Your requests</h4>
          {memberRequests.length === 0 ? <div className="empty-state">You have no excusal requests.</div> : (
            memberRequests.map((r) => (
              <article key={r.id} className="card request-card">
                <div>
                  <h4>{r.eventTitle}</h4>
                  <p className="muted">{new Date(r.submittedAt).toLocaleString()}</p>
                  <p className="muted">Reason: {r.reason}</p>
                </div>
                <StatusBadge label={r.status} status={r.status} />
              </article>
            ))
          )}
        </div>

        {adminView && (
          <div className="card">
            <h3>All requests</h3>
            {requests.length === 0 ? <div className="empty-state">No excusal requests.</div> : (
              requests.map((r) => (
                <article key={r.id} className="card request-card">
                  <div>
                    <h4>{r.memberName} · {r.eventTitle}</h4>
                    <p className="muted">Submitted: {new Date(r.submittedAt).toLocaleString()}</p>
                    <p className="muted">Reason: {r.reason}</p>
                    {r.reviewNotes && <p className="muted">Notes: {r.reviewNotes}</p>}
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <Button type="button" onClick={() => reviewRequest(r.id, 'approved', 'Approved by admin')}>Approve</Button>
                    <Button type="button" onClick={() => reviewRequest(r.id, 'denied', 'Denied by admin')}>Deny</Button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ExcusalRequests
