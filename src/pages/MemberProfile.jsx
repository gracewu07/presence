import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import StatCard from '../components/StatCard'
import { getGroupClassName } from '../constants/memberGroups'
import {
  fetchMemberCheckIns,
  fetchEventsByDateRange,
  fetchEventsByIds,
  fetchLeaderboard,
  fetchMemberExcusalRequests,
} from '../firebase'
import { getRoleLabel } from '../utils/permissions'

function toLocaleShort(dateString) {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

function typeClassForEvent(eventType = '') {
  return eventType.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'other'
}

function MemberProfile() {
  const { currentUser, signOut, updateProfilePhoto } = useAuth()
  const memberId = currentUser?.email?.trim().toLowerCase() || currentUser?.uid
  const [loading, setLoading] = useState(true)
  const [memberCheckIns, setMemberCheckIns] = useState([])
  const [events, setEvents] = useState([])
  const [leaderboardMembers, setLeaderboardMembers] = useState([])
  const [excusalRequests, setExcusalRequests] = useState([])

  useEffect(() => {
    if (!currentUser) return

    async function loadProfileData() {
      setLoading(true)
      try {
        const [memberChecks, memberExcusals, leaderboardSnapshot] = await Promise.all([
          fetchMemberCheckIns(memberId).catch((error) => {
            console.error('Failed to load member check-ins', error)
            return []
          }),
          fetchMemberExcusalRequests(memberId).catch((error) => {
            console.error('Failed to load member excusals', error)
            return []
          }),
          fetchLeaderboard(200).catch((error) => {
            console.error('Failed to load leaderboard for profile rank', error)
            return []
          }),
        ])

        const currentYear = new Date().getFullYear()
        const yearStart = new Date(currentYear, 0, 1).toISOString()
        const yearEnd = new Date(currentYear + 1, 0, 1).toISOString()
        const [currentYearEvents, attendedEvents] = await Promise.all([
          fetchEventsByDateRange(yearStart, yearEnd).catch((error) => {
            console.error('Failed to load current-year events for profile', error)
            return []
          }),
          fetchEventsByIds(memberChecks.map((checkIn) => checkIn.eventId)).catch((error) => {
            console.error('Failed to load attended events for profile', error)
            return []
          }),
        ])
        const eventsById = new Map()
        ;[currentYearEvents, attendedEvents].flat().forEach((event) => {
          if (event?.id) eventsById.set(event.id, event)
        })

        setMemberCheckIns(memberChecks)
        setEvents(Array.from(eventsById.values()))
        setLeaderboardMembers(leaderboardSnapshot)
        setExcusalRequests(memberExcusals)
      } catch (err) {
        console.error('Failed to load profile data', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [currentUser, memberId])

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
  const memberClass = currentUser?.pledgeClass || 'Delta'
  const memberFamily = currentUser?.family || 'Fireball'
  const profileStats = [
    { label: 'Total Points', value: totalPoints, variant: 'points' },
    { label: 'Events Attended', value: eventsAttended, variant: 'chapter' },
    { label: 'Attendance Rate', value: `${Math.round(attendanceRate * 100)}%`, variant: 'service' },
    { label: 'Excusals Submitted', value: excusalsSubmitted, variant: 'professional-development' },
  ]

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
    leaderboardMembers.forEach((member) => {
      const id = (member.email || member.id || '').trim().toLowerCase()
      if (!id || member.accessStatus !== 'approved') return

      totals.set(id, {
        memberId: id,
        totalPoints: Number(member.totalPoints ?? member.points ?? 0),
      })
    })

    if (memberId && !totals.has(memberId)) {
      totals.set(memberId, { memberId, totalPoints })
    }

    const ranked = Array.from(totals.values()).sort((a, b) => b.totalPoints - a.totalPoints || a.memberId.localeCompare(b.memberId))
    const index = ranked.findIndex((rank) => rank.memberId === memberId)
    return index === -1 ? null : index + 1
  }, [leaderboardMembers, memberId, totalPoints])

  if (!currentUser || loading) {
    return <LoadingState message="Loading profile..." />
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
      </div>

      <div className="card profile-hero-card">
        <div className="profile-photo-card">
          <label className="profile-photo-upload" aria-label="Choose profile photo">
            <span className="profile-photo-preview" aria-hidden="true">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" />
              ) : (
                <span>{profileInitial}</span>
              )}
            </span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <span className="profile-photo-upload__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                <path d="m13.5 6.5 4 4" />
              </svg>
            </span>
          </label>
          <div>
            <h2>{currentUser.name}</h2>
            <div className="profile-photo-status">
              <StatusBadge label={currentUser.status} status={currentUser.status} />
            </div>
          </div>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-hero-meta__item">
            <span>Email</span>
            <strong>{currentUser.email}</strong>
          </div>
          <div className="profile-hero-meta__item">
            <span>Role</span>
            <strong className="profile-role-value">{getRoleLabel(currentUser.role)}</strong>
          </div>
          <div className="profile-hero-meta__item">
            <span>Leaderboard Rank</span>
            <strong>{leaderboardRank ? `#${leaderboardRank}` : 'Unranked'}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid--stats profile-stats-grid">
        {profileStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="section-block profile-info-layout">
        <div>
          <h2>Attendance History</h2>
          <div className="card profile-section-card">
            {attendanceHistory.length === 0 ? (
              <div className="empty-state">No attendance history available.</div>
            ) : (
              attendanceHistory.map((history) => (
                <div
                  key={history.id}
                  className={`event-card event-surface event-surface--${typeClassForEvent(history.eventType)} profile-history-card`}
                >
                  <div>
                    <div className="event-card__topline">
                      <div className={`event-card__type event-type-badge event-type-badge--${typeClassForEvent(history.eventType)}`}>
                        {history.eventType}
                      </div>
                      {history.locationVerified && <span className="required-note">Verified</span>}
                    </div>
                    <h3>{history.title}</h3>
                    <p className="event-card__meta">{toLocaleShort(history.date)}</p>
                  </div>
                  <div>
                    <p className="event-card__location">{history.points} points</p>
                    <p className="muted">Checked in {toLocaleShort(history.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2>Member Information</h2>
          <div className="card profile-section-card profile-member-info">
            <div className={`profile-member-info-card profile-member-info-card--class-${getGroupClassName(memberClass)}`}>
              <p className="profile-card__label">Class</p>
              <strong>{memberClass}</strong>
            </div>
            <div className={`profile-member-info-card profile-member-info-card--family-${getGroupClassName(memberFamily)}`}>
              <p className="profile-card__label">Family</p>
              <strong>{memberFamily}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-block">
        <h2>Recommended actions</h2>
        <div className="card profile-actions-card">
          <ul>
            {missedRequired.length > 0 && <li>Submit an excusal for missed required events.</li>}
            {attendanceRate < 0.5 && <li>Contact the VP of Standards if you are at risk.</li>}
            {missedRequired.length === 0 && attendanceRate >= 0.5 && <li>No recommended actions right now.</li>}
          </ul>
        </div>
      </div>

      <div className="profile-signout">
        <Button type="button" variant="secondary" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </section>
  )
}

export default MemberProfile
