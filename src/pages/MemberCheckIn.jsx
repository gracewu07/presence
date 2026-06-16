import { useMemo, useState } from 'react'
import Button from '../components/Button'
import { events } from '../data'
import { haversineDistance } from '../utils/haversine'

const parseDateTime = (date, time) => {
  const [monthName, day] = date.split(' ')
  const [hourMinute] = time.split(' ')
  const [hour, minute] = hourMinute.split(':').map(Number)
  const isPM = time.includes('PM')
  const normalizedHour = hour === 12 ? 12 : isPM ? hour + 12 : hour
  const year = new Date().getFullYear()
  return new Date(`${monthName} ${day}, ${year} ${normalizedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`)
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
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [checkIns, setCheckIns] = useState({})
  const [message, setMessage] = useState(null)

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
  }, [])

  const selectedEvent = enhancedEvents.find((event) => event.id === selectedEventId)
  const checkedIn = selectedEvent && checkIns[selectedEvent.id]

  const handleCheckIn = () => {
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Please select an event first.' })
      return
    }

    if (checkedIn) {
      setMessage({ type: 'error', text: 'You have already checked in for this event.' })
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLon = position.coords.longitude
        const distance = haversineDistance(userLat, userLon, selectedEvent.latitude, selectedEvent.longitude)

        if (distance > selectedEvent.radiusMeters) {
          setMessage({
            type: 'error',
            text: `You are too far from the event location. Distance: ${Math.round(distance)} meters.`,
          })
          return
        }

        const timestamp = new Date().toISOString()
        const newCheckIn = {
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          locationVerified: true,
          distanceMeters: Math.round(distance),
          timestamp,
          pointsEarned: selectedEvent.points,
        }

        setCheckIns((current) => ({ ...current, [selectedEvent.id]: newCheckIn }))
        setMessage({
          type: 'success',
          text: `Check-in successful for ${selectedEvent.title}. ${selectedEvent.points} points earned at ${formatTime(timestamp)}. Distance: ${Math.round(distance)} meters.`,
        })
        console.log('Check-in record:', newCheckIn)
      },
      (error) => {
        const errorMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Enable location to check in.'
            : 'Unable to determine your location. Please try again.'

        setMessage({ type: 'error', text: errorMessage })
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    )
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
          {enhancedEvents.map((event) => {
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
          })}
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
                disabled={Boolean(checkedIn)}
              >
                {checkedIn ? 'Already Checked In' : 'Check In'}
              </Button>

              {checkedIn && (
                <div className="checkin-summary">
                  <p className="label">Last check-in</p>
                  <p>{checkedIn.eventTitle}</p>
                  <p>{checkedIn.pointsEarned} points earned</p>
                  <p>Checked in at {new Date(checkedIn.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
              )}
            </>
          ) : (
            <div className="card-empty">
              Select an event from the list to view details and check in.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MemberCheckIn
