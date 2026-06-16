import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import {
  fetchMemberCheckIns,
  fetchEvents,
  fetchUpcomingEvents,
  fetchCheckIns,
  fetchMemberExcusalRequests,
} from '../firebase'

function toLocaleShort(dateString) {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString()
  } catch (e) {
    return dateString
  }
}

function MemberProfile() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [memberCheckIns, setMemberCheckIns] = useState([])
  const [events, setEvents] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [allCheckIns, setAllCheckIns] = useState([])
  const [excusalRequests, setExcusalRequests] = useState([])

  useEffect(() => {
    if (!currentUser) return

    async function loadProfileData() {
      setLoading(true)
      try {
        const [memberChecks, allChecks, allEvents, upcomingEvents, memberExcusals] = await Promise.all([
          fetchMemberCheckIns(currentUser.uid),
          fetchCheckIns(),
          fetchEvents(),
          fetchUpcomingEvents(),
          fetchMemberExcusalRequests(currentUser.uid),
        ])

        setMemberCheckIns(memberChecks)
        setAllCheckIns(allChecks)
        setEvents(allEvents)
        setUpcoming(upcomingEvents)
        setExcusalRequests(memberExcusals)
      } catch (err) {
        console.error('Failed to load profile data', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [currentUser])

  const attendanceHistory = useMemo(() => {
    const byEvent = new Map(events.map((e) => [e.id, e]))
    return memberCheckIns.map((c) => {
      const evt = byEvent.get(c.eventId) || {}
      return {
        id: c.id,
        title: evt.title || c.eventTitle || 'Event',
        eventType: evt.eventType || c.eventType || 'Other',
        date: evt.eventDate || evt.date || c.timestamp,
        points: Number(c.pointsAwarded ?? 0),
        timestamp: c.createdAt || c.timestamp,
        locationVerified: !!c.locationVerified,
      }
    })
  }, [memberCheckIns, events])

  const totalPoints = useMemo(() => memberCheckIns.reduce((s, c) => s + Number(c.pointsAwarded ?? 0), 0), [memberCheckIns])

  const eventsAttended = memberCheckIns.length

  const attendanceRate = useMemo(() => {
    const pastEventsCount = events.filter((e) => {
      const d = e.eventDate ? new Date(e.eventDate) : null
      return d && d < new Date()
    }).length
    return pastEventsCount === 0 ? 0 : Math.min(1, eventsAttended / pastEventsCount)
  }, [events, eventsAttended])

  const excusalsSubmitted = excusalRequests.length

  const leaderboardRank = useMemo(() => {
    const totals = new Map()
    allCheckIns.forEach((c) => {
      const id = c.memberId
      const cur = totals.get(id) || { memberId: id, totalPoints: 0 }
      cur.totalPoints += Number(c.pointsAwarded ?? 0)
      totals.set(id, cur)
    })
    const ranked = Array.from(totals.values()).sort((a, b) => b.totalPoints - a.totalPoints)
    const idx = ranked.findIndex((r) => r.memberId === currentUser.uid)
    return idx === -1 ? null : idx + 1
  }, [allCheckIns, currentUser])

  if (!currentUser || loading) {
    return <div className="page page--loading">Loading profile...</div>
  }

  const recommended = upcoming
    .filter((e) => e.points && Number(e.points) > 0)
    .sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0))

  const missedRequired = events
    .filter((e) => e.required)
    .filter((e) => {
      const attended = memberCheckIns.some((c) => c.eventId === e.id)
      const past = e.eventDate ? new Date(e.eventDate) < new Date() : false
      return past && !attended
    })

  return (
    <section className="page profile-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{currentUser.name}</h1>
          <p className="muted">Your attendance, history, and upcoming recommendations.</p>
        </div>
      </div>

      <div className="profile-bubble-grid">
        <div className="profile-bubble profile-bubble--wide">
          <p className="profile-card__label">Email</p>
          <strong>{currentUser.email}</strong>
        </div>
        <div className="profile-bubble">
          <p className="profile-card__label">Total Points</p>
          <strong>{totalPoints}</strong>
        </div>
        <div className="profile-bubble">
          <p className="profile-card__label">Events Attended</p>
          <strong>{eventsAttended}</strong>
        </div>
        <div className="profile-bubble">
          <p className="profile-card__label">Attendance Rate</p>
          <strong>{Math.round(attendanceRate * 100)}%</strong>
        </div>
        <div className="profile-bubble">
          <p className="profile-card__label">Excusals Submitted</p>
          <strong>{excusalsSubmitted}</strong>
        </div>
        <div className="profile-bubble">
          <p className="profile-card__label">Status</p>
          <StatusBadge label={currentUser.status} status={currentUser.status} />
        </div>
        <div className="profile-bubble profile-bubble--wide">
          <p className="profile-card__label">Private leaderboard rank</p>
          <strong>{leaderboardRank ?? 'Unranked'}</strong>
        </div>
      </div>

      <div className="section-block">
        <h2>Attendance History</h2>
        <div className="card">
          {attendanceHistory.length === 0 ? (
            <div className="empty-state">No attendance history available.</div>
          ) : (
            attendanceHistory.map((h) => (
              <div key={h.id} className="event-card">
                <div>
                  <strong>{h.title}</strong>
                  <p className="muted">{h.eventType} · {toLocaleShort(h.date)}</p>
                </div>
                <div>
                  <p className="muted">Points: {h.points}</p>
                  <p className="muted">Checked at: {toLocaleShort(h.timestamp)}</p>
                  <p className="muted">Location verified: {h.locationVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-block">
        <h2>Upcoming Events</h2>
        <div className="grid grid--cards">
          {recommended.length === 0 ? (
            <div className="empty-state">No recommended upcoming events.</div>
          ) : (
            recommended.map((e) => (
              <article key={e.id} className="card event-card">
                <div>
                  <h3>{e.title}</h3>
                  <p className="muted">{e.eventType} · {e.eventDate || e.date} {e.startTime || ''}</p>
                  <p className="muted">{e.locationName || e.location}</p>
                </div>
                <div className="event-card__footer">
                  <div>{e.points} pts</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      className="button button--secondary"
                      href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(e.title || '')}&details=${encodeURIComponent(e.description || '')}&location=${encodeURIComponent(e.locationName || e.location || '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Add to Google Calendar
                    </a>
                    <Button
                      type="button"
                      onClick={() => {
                        const start = e.eventDate || e.date || ''
                        const title = e.title || ''
                        const details = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start}\nEND:VEVENT\nEND:VCALENDAR`
                        const blob = new Blob([details], { type: 'text/calendar;charset=utf-8' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${title || 'event'}.ics`
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        URL.revokeObjectURL(url)
                      }}
                    >
                      Add to Apple Calendar
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="section-block">
        <h2>Recommended actions</h2>
        <div className="card">
          <ul>
            {recommended.slice(0, 3).map((e) => (
              <li key={e.id}>Attend <strong>{e.title}</strong> for {e.points} points.</li>
            ))}
            {events.filter((ev) => ev.required && new Date(ev.eventDate || ev.date) > new Date()).map((ev) => (
              <li key={`req-${ev.id}`}>Required event upcoming: <strong>{ev.title}</strong>.</li>
            ))}
            {missedRequired.length > 0 && <li>Submit an excusal for missed required events.</li>}
            {attendanceRate < 0.5 && <li>Contact the VP of Standards if you are at risk.</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default MemberProfile
