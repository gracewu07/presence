import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { events as staticEvents } from '../data/events'
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
  const end = new Date(event.endDate)
  const earliest = new Date(start.getTime() - 15 * 60 * 1000)
  const latest = end
  return now >= earliest && now <= latest
}

const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const getCheckInState = (event) => {
  if (!event) return null
  return canCheckIn(event) ? 'Check in now' : 'Upcoming'
}

function MemberCheckIn() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [memberCheckIns, setMemberCheckIns] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)

  useEffect(() => {
    async function loadCheckInData() {
      setLoading(true)
      setMessage(null)

      try {
        const eventsPromise = fetchEvents()
        const checkInsPromise = currentUser
          ? fetchMemberCheckIns(currentUser.uid).catch((err) => {
              console.error('Unable to load member check-ins:', err)
              return []
            })
          : Promise.resolve([])

        const [eventsSnapshot, checkInsSnapshot] = await Promise.all([eventsPromise, checkInsPromise])
        setEvents(eventsSnapshot.length > 0 ? eventsSnapshot : staticEvents)
        setMemberCheckIns(checkInsSnapshot)
      } catch (error) {
        console.error('Unable to load check-in events:', error)
        setEvents(staticEvents)
        setMemberCheckIns([])
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

  const selectedEvent = enhancedEvents[0] || null
  const checkedIn = selectedEvent && memberCheckIns.some((checkIn) => checkIn.eventId === selectedEvent.id)
  const checkInState = getCheckInState(selectedEvent)

  const handleCheckIn = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'You must be signed in to check in.' })
      return
    }

    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'No upcoming event is available for check-in.' })
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
        text: 'Check-in is only available from 15 minutes before the event starts until the event ends.',
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
    <section className="page checkin-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Check-In</p>
          <h1>Member Check-In</h1>
          <p className="muted">Check in to the next active or upcoming chapter event.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading event…</div>
      ) : selectedEvent ? (
        <div className="checkin-focus">
          <section className={`checkin-status-strip ${canCheckIn(selectedEvent) ? 'checkin-status-strip--ready' : ''}`}>
            <p>{checkInState}</p>
            <span>
              {canCheckIn(selectedEvent)
                ? `Open until ${formatTime(selectedEvent.endDate)}`
                : `Opens at ${formatTime(new Date(selectedEvent.startDate).getTime() - 15 * 60 * 1000)}`}
            </span>
          </section>

          <article className={`card checkin-single-card event-surface event-surface--${selectedEvent.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            <div className="event-card__topline">
              <div className={`event-card__type event-type-badge event-type-badge--${selectedEvent.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                {selectedEvent.eventType}
              </div>
              {selectedEvent.required && <span className="required-note">Required</span>}
            </div>

            <div className="checkin-card-heading">
              <h2>{selectedEvent.title}</h2>
              <p className="muted">{selectedEvent.locationName}</p>
            </div>

            <div className="checkin-detail-grid">
              <div>
                <p className="label">Date</p>
                <p>{selectedEvent.date}</p>
              </div>
              <div>
                <p className="label">Time</p>
                <p>{selectedEvent.startTime} - {selectedEvent.endTime}</p>
              </div>
              <div>
                <p className="label">Points</p>
                <p>{selectedEvent.points}</p>
              </div>
            </div>

            {message && (
              <div className={`checkin-message checkin-message--${message.type}`}>
                {message.text}
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              onClick={handleCheckIn}
              disabled={Boolean(checkedIn) || checkInLoading || !canCheckIn(selectedEvent)}
            >
              {checkInLoading
                ? 'Checking in…'
                : checkedIn
                  ? 'Already Checked In'
                  : canCheckIn(selectedEvent)
                    ? 'Check In'
                    : 'Check In Opens Soon'}
            </Button>

            {checkedIn && (
              <div className="checkin-summary">
                <p className="label">Check-in status</p>
                <p>You have already checked in for this event.</p>
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="empty-state">No active or upcoming event is available for check-in.</div>
      )}
    </section>
  )
}

export default MemberCheckIn
