import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteEvent, fetchMembers, fetchEvents, fetchCheckIns, fetchUpcomingEvents, fetchExcusalRequests } from '../firebase'
import { formatDisplayDate } from '../utils/eventDateTime'
import { useAuth } from '../context/AuthContext'
import { ROLE_ADMIN, ROLE_MEMBER, ROLE_SUB_ADMIN, ROLE_SUPER_ADMIN, canManageEvents, normalizeRole } from '../utils/permissions'

const checkInTimeValue = (checkIn) => {
  const value = checkIn.createdAt || checkIn.timestamp
  if (!value) return 0
  if (value.toDate) return value.toDate().getTime()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const formatCheckInTime = (checkIn) => {
  const value = checkIn.createdAt || checkIn.timestamp
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'

  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function AdminDashboard() {
  const { currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [excusals, setExcusals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true)
      try {
        const [memberSnapshot, eventSnapshot, checkInSnapshot, upcomingSnapshot, excusalSnapshot] = await Promise.all([
          fetchMembers(),
          fetchEvents(),
          fetchCheckIns(),
          fetchUpcomingEvents(),
          fetchExcusalRequests(),
        ])
        setMembers(memberSnapshot)
        setEvents(eventSnapshot)
        setCheckIns(checkInSnapshot)
        setUpcoming(upcomingSnapshot)
        setExcusals(excusalSnapshot)
      } catch (err) {
        console.error('Failed to load admin data', err)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const recentCheckIns = useMemo(
    () => checkIns.slice().sort((a, b) => checkInTimeValue(b) - checkInTimeValue(a)).slice(0, 5),
    [checkIns]
  )
  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events])
  const pendingExcusals = excusals.filter((request) => request.status === 'pending')
  const canEditEvents = canManageEvents(currentUser)

  const handleDeleteEvent = async (event) => {
    if (!canEditEvents) return

    const confirmed = window.confirm(`Delete "${event.title}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteEvent(event.id)
      setEvents((current) => current.filter((item) => item.id !== event.id))
      setUpcoming((current) => current.filter((item) => item.id !== event.id))
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  return (
    <section className="page admin-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Operations Dashboard</h1>
          <p className="muted">Events, check-ins, roster health, and chapter activity at a glance.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading admin data...</div>
      ) : (
        <>
          <div className="grid grid--stats">
            <div className="stat-card">
              <p className="stat-card__label">Approved members</p>
              <p className="stat-card__value">{members.filter((member) => member.accessStatus === 'approved').length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Total events</p>
              <p className="stat-card__value">{events.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Total check-ins</p>
              <p className="stat-card__value">{checkIns.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Pending excusals</p>
              <p className="stat-card__value">{pendingExcusals.length}</p>
            </div>
          </div>

          <div className="grid grid--cards section-block">
            <div className="card">
              <h3>Upcoming events</h3>
              {upcoming.length === 0 ? <div className="empty-state">No upcoming events.</div> : (
                upcoming.slice(0, 5).map((event) => (
                  <div key={event.id} className="event-card">
                    <div>
                      <strong>{event.title}</strong>
                      <p className="muted">{event.eventType} · {event.date || formatDisplayDate(event.eventDate)}</p>
                    </div>
                    <div className="admin-event-actions">
                      <span className="muted">{event.points} pts</span>
                      <Link className="button button--secondary button--compact" to={`/admin/events/${event.id}/edit`}>
                        Edit
                      </Link>
                      {canEditEvents && (
                        <button
                          type="button"
                          className="button button--secondary button--danger button--compact"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Recent check-ins</h3>
              {recentCheckIns.length === 0 ? <div className="empty-state">No recent check-ins.</div> : (
                <div className="recent-checkins-list">
                  {recentCheckIns.map((checkIn) => {
                    const event = eventsById.get(checkIn.eventId)
                    return (
                      <div key={checkIn.id} className="recent-checkin-card">
                        <div className="recent-checkin-card__main">
                          <strong>{checkIn.memberName || checkIn.memberEmail || 'Member'}</strong>
                          <p>{event?.title || checkIn.eventTitle || 'Event unavailable'}</p>
                          <span>{formatCheckInTime(checkIn)}</span>
                        </div>
                        <div className="recent-checkin-card__points">
                          <strong>{checkIn.pointsAwarded || 0}</strong>
                          <span>pts</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Roster snapshot</h3>
              <div className="profile-bubble-grid">
                <div className="profile-bubble">
                  <p className="profile-card__label">Admins</p>
                  <strong>{members.filter((member) => normalizeRole(member.role) === ROLE_ADMIN).length}</strong>
                </div>
                <div className="profile-bubble">
                  <p className="profile-card__label">Super Admins</p>
                  <strong>{members.filter((member) => normalizeRole(member.role) === ROLE_SUPER_ADMIN).length}</strong>
                </div>
                <div className="profile-bubble">
                  <p className="profile-card__label">Sub-Admins</p>
                  <strong>{members.filter((member) => normalizeRole(member.role) === ROLE_SUB_ADMIN).length}</strong>
                </div>
                <div className="profile-bubble">
                  <p className="profile-card__label">Members</p>
                  <strong>{members.filter((member) => normalizeRole(member.role) === ROLE_MEMBER).length}</strong>
                </div>
                <div className="profile-bubble">
                  <p className="profile-card__label">Pending</p>
                  <strong>{members.filter((member) => member.accessStatus === 'pending').length}</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminDashboard
