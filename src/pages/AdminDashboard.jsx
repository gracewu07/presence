import { useEffect, useMemo, useState } from 'react'
import { fetchMembers, fetchEvents, fetchCheckIns, fetchUpcomingEvents, fetchExcusalRequests } from '../firebase'

function AdminDashboard() {
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
    () => checkIns.slice().sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)).slice(0, 8),
    [checkIns]
  )
  const pendingExcusals = excusals.filter((request) => request.status === 'pending')

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
                      <p className="muted">{event.eventType} · {event.eventDate || event.date}</p>
                    </div>
                    <div className="muted">{event.points} pts</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Recent check-ins</h3>
              {recentCheckIns.length === 0 ? <div className="empty-state">No recent check-ins.</div> : (
                recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="request-card">
                    <div>
                      <p><strong>{checkIn.memberName || checkIn.memberEmail}</strong></p>
                      <p className="muted">Event: {checkIn.eventId}</p>
                      <p className="muted">{new Date(checkIn.createdAt || checkIn.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="muted">{checkIn.pointsAwarded || 0} pts</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Roster snapshot</h3>
              <div className="profile-bubble-grid">
                <div className="profile-bubble">
                  <p className="profile-card__label">Admins</p>
                  <strong>{members.filter((member) => member.role === 'admin').length}</strong>
                </div>
                <div className="profile-bubble">
                  <p className="profile-card__label">Members</p>
                  <strong>{members.filter((member) => member.role === 'member').length}</strong>
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
