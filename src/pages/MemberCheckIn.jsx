import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { fetchEvents, fetchMemberCheckIns, findCheckInByEventAndMember, recordCheckIn } from '../firebase'
import { haversineDistance } from '../utils/haversine'

const parseDateTime = (date, time) => {
  if (!date || !time) return new Date()

  const [hourMinute, period] = time.includes(' ') ? time.split(' ') : [time, null]
  const [hour, minute] = hourMinute.split(':').map(Number)
  let normalizedHour = hour

  if (period) {
    if (period === 'PM' && hour !== 12) normalizedHour += 12
    if (period === 'AM' && hour === 12) normalizedHour = 0
  }

  const minuteString = minute.toString().padStart(2, '0')
  const hourString = normalizedHour.toString().padStart(2, '0')

  if (date.includes('-')) {
    return new Date(`${date}T${hourString}:${minuteString}:00`)
  }

  const [monthName, day] = date.split(' ')
  return new Date(`${monthName} ${day}, ${new Date().getFullYear()} ${hourString}:${minuteString}:00`)
}

const canCheckIn = (event) => {
  const now = new Date()
  const start = new Date(event.startDate)
  const earliest = new Date(start.getTime() - 10 * 60 * 1000)
  const latest = new Date(start.getTime() + 15 * 60 * 1000)
  return now >= earliest && now <= latest
}

const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function MemberCheckIn() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [memberCheckIns, setMemberCheckIns] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)

  useEffect(() => {
    async function loadCheckInData() {
      setLoading(true)
      setMessage(null)

      try {
        const [eventsSnapshot, checkInsSnapshot] = await Promise.all([
          fetchEvents(),
          currentUser ? fetchMemberCheckIns(currentUser.uid) : Promise.resolve([]),
        ])
        setEvents(eventsSnapshot)
        setMemberCheckIns(checkInsSnapshot)
      } catch (error) {
        console.error('Unable to load check-in data:', error)
        setMessage({ type: 'error', text: 'Unable to load events or check-in info. Please refresh the page.' })
      } finally {
        setLoading(false)
      }
    }

    loadCheckInData()
  }, [currentUser])

  const enhancedEvents = useMemo(() => {
    const now = new Date()
    return events
      .map((event) => {
        const startDate = parseDateTime(event.date, event.startTime)
        const endDate = parseDateTime(event.date, event.endTime)
        const status = startDate <= now && now <= endDate ? 'Active' : startDate > now ? 'Upcoming' : 'Past'
        return { ...event, startDate, endDate, status }
      })
      .filter((event) => event.status === 'Active' || event.status === 'Upcoming')
      .sort((a, b) => a.startDate - b.startDate)
  }, [events])

  const selectedEvent = enhancedEvents.find((event) => event.id === selectedEventId)
  const checkedIn = selectedEvent && memberCheckIns.some((checkIn) => checkIn.eventId === selectedEvent.id)

  const handleCheckIn = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'You must be signed in to check in.' })
      return
    }

    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Please select an event first.' })
      return
    }

    if (checkedIn) {
      setMessage({ type: 'error', text: 'Already checked in for this event.' })
      return
    }

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Your browser does not support geolocation.' })
      return
    }

    if (!canCheckIn(selectedEvent)) {
      setMessage({
        type: 'error',
        text: 'Check-in is only available from 10 minutes before the event starts until 15 minutes after it starts.',
      })
      return
    }

    setCheckInLoading(true)
    setMessage(null)

    try {
      const existingCheckIn = await findCheckInByEventAndMember(selectedEvent.id, currentUser.uid)
      if (existingCheckIn) {
        setMemberCheckIns((current) => [...current, existingCheckIn])
        setMessage({ type: 'error', text: 'Already checked in for this event.' })
        return
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        })
      })

      const userLat = position.coords.latitude
      const userLon = position.coords.longitude
      const distance = haversineDistance(userLat, userLon, selectedEvent.latitude, selectedEvent.longitude)

      if (distance > selectedEvent.radiusMeters) {
        setMessage({ type: 'error', text: 'You are too far away from the event location to check in.' })
        return
      }

      const timestamp = new Date().toISOString()
      const newCheckIn = {
        eventId: selectedEvent.id,
        memberId: currentUser.uid,
        memberEmail: currentUser.email,
        memberName: currentUser.name,
        timestamp,
        distanceMeters: Math.round(distance),
        locationVerified: true,
        pointsAwarded: Number(selectedEvent.points ?? 0),
        eventType: selectedEvent.eventType || 'Unknown',
      }

      await recordCheckIn(newCheckIn)
      setMemberCheckIns((current) => [...current, newCheckIn])
      setMessage({
        type: 'success',
        text: `Check-in successful for ${selectedEvent.title}. ${newCheckIn.pointsAwarded} points awarded.`,
      })
    } catch (error) {
      console.error('Check-in failed:', error)
      const errorMessage =
        error?.code === 1
          ? 'Location permission denied. Enable location to check in.'
          : 'Unable to record check-in. Please try again.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setCheckInLoading(false)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Check-In</p>
          <h1>Member Check-In</h1>
          <p className="muted">Select an active or upcoming event and record attendance.</p>
        </div>
      </div>

      <div className="checkin-layout">
        <div className="checkin-list">
          {loading ? (
            <div className="empty-state">Loading events…</div>
          ) : enhancedEvents.length > 0 ? (
            enhancedEvents.map((event) => {
              const isSelected = event.id === selectedEventId
              const typeClass = event.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              return (
                <article
                  key={event.id}
                  className={`card checkin-card ${isSelected ? 'checkin-card--selected' : ''}`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="checkin-card__top">
                    <div className={`event-card__type event-type-badge event-type-badge--${typeClass}`}>
                      {event.eventType}
                    </div>
                    <div className="checkin-card__meta">
                      <span>{event.date} · {event.startTime}</span>
                      <span>{event.status}</span>
                    </div>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="muted">{event.locationName}</p>
                  <div className="checkin-card__footer">
                    <span>{event.points} pts</span>
                    <span>{event.required ? 'Required' : 'Optional'}</span>
                  </div>
                </article>
              )
            })
          ) : (
            <div className="empty-state">No active or upcoming events are available for check-in.</div>
          )}
        </div>

        <div className="checkin-detail-card card">
          {selectedEvent ? (
            <>
              <div className="checkin-detail-header">
                <div>
                  <p className="eyebrow">Event details</p>
                  <h2>{selectedEvent.title}</h2>
                </div>
                <span className={`status-pill status-pill--${selectedEvent.status.toLowerCase()}`}>{selectedEvent.status}</span>
              </div>

              <div className="checkin-detail-grid">
                <div>
                  <p className="label">Type</p>
                  <p>{selectedEvent.eventType}</p>
                </div>
                <div>
                  <p className="label">Time</p>
                  <p>{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
                <div>
                  <p className="label">Location</p>
                  <p>{selectedEvent.locationName}</p>
                </div>
                <div>
                  <p className="label">Points</p>
                  <p>{selectedEvent.points}</p>
                </div>
                <div>
                  <p className="label">Status</p>
                  <p>{selectedEvent.required ? 'Required' : 'Optional'}</p>
                </div>
              </div>

              <p className="muted">{selectedEvent.description}</p>

              {message && (
                <div className={`checkin-message checkin-message--${message.type}`}>
                  {message.text}
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleCheckIn}
                disabled={Boolean(checkedIn) || checkInLoading}
              >
                {checkInLoading ? 'Checking in…' : checkedIn ? 'Already Checked In' : 'Check In'}
              </Button>

              {checkedIn && (
                <div className="checkin-summary">
                  <p className="label">Check-in status</p>
                  <p>You have already checked in for this event.</p>
                </div>
              )}
            </>
          ) : (
            <div className="card-empty">Select an event from the list to view details and check in.</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MemberCheckIn
