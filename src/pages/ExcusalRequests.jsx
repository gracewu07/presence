import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import { fetchExcusalRequests, fetchEvents, submitExcusalRequest } from '../firebase'

const mergeEventsById = (...eventLists) => {
  const eventsById = new Map()
  eventLists.flat().forEach((event) => {
    if (event?.id) eventsById.set(event.id, event)
  })

  return Array.from(eventsById.values()).sort((first, second) => {
    const firstDate = new Date(first.eventDate || first.date)
    const secondDate = new Date(second.eventDate || second.date)
    return firstDate - secondDate
  })
}

const formatDate = (value) => {
  if (!value) return 'Not submitted yet'
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not submitted yet' : date.toLocaleString()
}

const formatFileSize = (size) => {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function ExcusalRequests() {
  const { currentUser } = useAuth()
  const memberId = currentUser?.email?.trim().toLowerCase() || currentUser?.uid
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ eventId: '', reason: '', attachment: null })
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allRequests, allEvents] = await Promise.all([fetchExcusalRequests(), fetchEvents()])
        setRequests(allRequests)
        setEvents(mergeEventsById(allEvents))
      } catch (err) {
        console.error('Failed to load excusal data', err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const memberRequests = useMemo(() => {
    const memberEmail = currentUser?.email?.trim().toLowerCase()
    return requests.filter((request) => {
      const requestEmail = request.memberEmail?.trim().toLowerCase()
      return request.memberId === memberId || requestEmail === memberEmail
    })
  }, [requests, currentUser, memberId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.eventId || !form.reason) return

    setSaving(true)
    setFormMessage(null)
    try {
      const selectedEvent = events.find((event) => event.id === form.eventId)
      const attachment = form.attachment
        ? {
            name: form.attachment.name,
            type: form.attachment.type,
            size: form.attachment.size,
          }
        : null

      await submitExcusalRequest({
        memberId,
        memberName: currentUser.name,
        memberEmail: memberId,
        eventId: form.eventId,
        eventTitle: selectedEvent?.title || '',
        reason: form.reason,
        attachment,
      })

      setForm({ eventId: '', reason: '', attachment: null })
      e.currentTarget.reset()
      setFormMessage({ type: 'success', text: 'Excusal submitted.' })
      const allRequests = await fetchExcusalRequests()
      setRequests(allRequests)
    } catch (err) {
      console.error('Failed to submit excusal', err)
      setFormMessage({ type: 'error', text: 'Unable to submit excusal. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page page--loading">Loading excusal requests...</div>

  return (
    <section className="page excusals-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Excusal Requests</p>
          <h1>Manage Excusals</h1>
          <p className="muted">Submit a request for missed events and track review status.</p>
        </div>
      </div>

      <div className="grid grid--cards excusals-grid">
        <div className="card excusal-panel">
          <div className="excusal-panel__header">
            <h3>Submit an excusal</h3>
            <p className="muted">Choose the event, add a short reason, and attach proof if needed.</p>
          </div>

          <form onSubmit={handleSubmit} className="excusal-form">
            <label className="excusal-field">
              <span>Event</span>
              <span className="excusal-select-wrap">
                <select value={form.eventId} onChange={(e) => setForm((state) => ({ ...state, eventId: e.target.value }))}>
                  <option value="">Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.eventType}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="excusal-field">
              <span>Reason</span>
              <textarea
                value={form.reason}
                placeholder="Briefly explain why you cannot attend."
                onChange={(e) => setForm((state) => ({ ...state, reason: e.target.value }))}
              />
            </label>

            <label className="excusal-upload">
              <span className="excusal-upload__topline">
                <span>Attach photo or file</span>
                <span className="excusal-upload__button">Choose file</span>
              </span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                capture="environment"
                onChange={(e) => setForm((state) => ({ ...state, attachment: e.target.files?.[0] || null }))}
              />
              <small>
                {form.attachment
                  ? `${form.attachment.name}${formatFileSize(form.attachment.size) ? ` (${formatFileSize(form.attachment.size)})` : ''}`
                  : 'Use your camera on mobile or choose an image, PDF, or Word file.'}
              </small>
            </label>

            {formMessage && <p className={formMessage.type === 'error' ? 'form-error' : 'form-success'}>{formMessage.text}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit excusal'}</Button>
          </form>

          <div className="excusal-section-heading">
            <h4>Your requests</h4>
            <p className="muted">Recent requests and review status.</p>
          </div>
          {memberRequests.length === 0 ? <div className="empty-state">You have no excusal requests.</div> : (
            <div className="excusal-request-list">
              {memberRequests.map((request) => (
                <article key={request.id} className={`card request-card excusal-request-card excusal-request-card--${request.status || 'pending'}`}>
                  <div className="excusal-request-card__content">
                    <div className="excusal-request-card__topline">
                      <h4>{request.eventTitle}</h4>
                      <StatusBadge label={request.status || 'pending'} status={request.status || 'pending'} />
                    </div>
                    <div className="excusal-request-card__details">
                      <p><span>Submitted</span>{formatDate(request.submittedAt)}</p>
                      <p><span>Reason</span>{request.reason}</p>
                      {request.attachment?.name && <p><span>Attachment</span>{request.attachment.name}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}

export default ExcusalRequests
