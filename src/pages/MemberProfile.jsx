import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import {
  fetchMemberCheckIns,
  fetchEvents,
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
  const { currentUser, signOut, updateProfilePhoto } = useAuth()
  const [loading, setLoading] = useState(true)
  const [memberCheckIns, setMemberCheckIns] = useState([])
  const [events, setEvents] = useState([])
  const [allCheckIns, setAllCheckIns] = useState([])
  const [excusalRequests, setExcusalRequests] = useState([])

  useEffect(() => {
    if (!currentUser) return

    async function loadProfileData() {
      setLoading(true)
      try {
        const [memberChecks, allChecks, allEvents, memberExcusals] = await Promise.all([
          fetchMemberCheckIns(currentUser.uid),
          fetchCheckIns(),
          fetchEvents(),
          fetchMemberExcusalRequests(currentUser.uid),
        ])

        setMemberCheckIns(memberChecks)
        setAllCheckIns(allChecks)
        setEvents(allEvents)
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

  const totalPoints = useMemo(() => memberCheckIns.reduce((sum, checkIn) => sum + Number(checkIn.pointsAwarded ?? 0), 0), [memberCheckIns])

  const eventsAttended = memberCheckIns.length

  const attendanceRate = useMemo(() => {
    const pastEventsCount = events.filter((event) => {
      const date = event.eventDate ? new Date(event.eventDate) : null
      return date && date < new Date()
    }).length
    return pastEventsCount === 0 ? 0 : Math.min(1, eventsAttended / pastEventsCount)
  }, [events, eventsAttended])

  const excusalsSubmitted = excusalRequests.length

  const profileInitial = currentUser?.name?.charAt(0)?.toUpperCase() || 'P'

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      updateProfilePhoto?.(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const leaderboardRank = useMemo(() => {
    const totals = new Map()
    allCheckIns.forEach((checkIn) => {
      const id = checkIn.memberId
      const current = totals.get(id) || { memberId: id, totalPoints: 0 }
      current.totalPoints += Number(checkIn.pointsAwarded ?? 0)
      totals.set(id, current)
    })
    const ranked = Array.from(totals.values()).sort((a, b) => b.totalPoints - a.totalPoints)
    const index = ranked.findIndex((rank) => rank.memberId === currentUser.uid)
    return index === -1 ? null : index + 1
  }, [allCheckIns, currentUser])

  if (!currentUser || loading) {
    return <div className="page page--loading">Loading profile...</div>
  }

  const missedRequired = events
    .filter((event) => event.required)
    .filter((event) => {
      const attended = memberCheckIns.some((checkIn) => checkIn.eventId === event.id)
      const past = event.eventDate ? new Date(event.eventDate) < new Date() : false
      return past && !attended
    })

  return (
    <section className="page profile-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{currentUser.name}</h1>
          <p className="muted">Your attendance, profile details, and check-in history.</p>
        </div>
        <Button type="button" variant="secondary" onClick={signOut}>
          Sign Out
        </Button>
      </div>

      <div className="profile-bubble-grid">
        <div className="profile-bubble profile-photo-card profile-bubble--wide">
          <div className="profile-photo-preview" aria-hidden="true">
            {currentUser.photoUrl ? (
              <img src={currentUser.photoUrl} alt="" />
            ) : (
              <span>{profileInitial}</span>
            )}
          </div>
          <div>
            <p className="profile-card__label">Profile Picture</p>
            <strong>{currentUser.name}</strong>
            <label className="profile-photo-upload">
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              <span>Choose photo</span>
            </label>
          </div>
        </div>
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
          <p className="profile-card__label">Points Leaderboard rank</p>
          <strong>{leaderboardRank ?? 'Unranked'}</strong>
        </div>
      </div>

      <div className="section-block">
        <h2>Attendance History</h2>
        <div className="card">
          {attendanceHistory.length === 0 ? (
            <div className="empty-state">No attendance history available.</div>
          ) : (
            attendanceHistory.map((history) => (
              <div key={history.id} className="event-card">
                <div>
                  <strong>{history.title}</strong>
                  <p className="muted">{history.eventType} - {toLocaleShort(history.date)}</p>
                </div>
                <div>
                  <p className="muted">Points: {history.points}</p>
                  <p className="muted">Checked at: {toLocaleShort(history.timestamp)}</p>
                  <p className="muted">Location verified: {history.locationVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="section-block">
        <h2>Recommended actions</h2>
        <div className="card">
          <ul>
            {missedRequired.length > 0 && <li>Submit an excusal for missed required events.</li>}
            {attendanceRate < 0.5 && <li>Contact the VP of Standards if you are at risk.</li>}
            {missedRequired.length === 0 && attendanceRate >= 0.5 && <li>No recommended actions right now.</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default MemberProfile
