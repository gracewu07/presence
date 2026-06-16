function CalendarEventCard({ event }) {
  const isUpcoming = event.startDate > new Date()

  const handleGoogleCalendar = () => {
    console.log('Add to Google Calendar:', event.title)
  }

  const handleAppleCalendar = () => {
    console.log('Add to Apple Calendar:', event.title)
  }

  const handleCheckIn = () => {
    console.log('Check in to event:', event.title)
  }

  return (
    <article className="card calendar-card">
      <div className="calendar-card__top">
        <div>
          <span className="calendar-card__date">{event.date}</span>
          <h3>{event.title}</h3>
          <p className="calendar-card__meta">
            {event.startTime} - {event.endTime} · {event.locationName}
          </p>
          <p className="calendar-card__meta">{event.points} points</p>
          {event.required && <p className="required-note">Required event</p>}
        </div>
        <div className={`calendar-card__tag event-type-${event.eventType.replace(/\s+/g, '-').toLowerCase()}`}>
          {event.eventType}
        </div>
      </div>

      <div className="calendar-card__actions">
        <button type="button" className="button button--secondary" onClick={handleGoogleCalendar}>
          Add to Google Calendar
        </button>
        <button type="button" className="button button--secondary" onClick={handleAppleCalendar}>
          Add to Apple Calendar
        </button>
        {isUpcoming && (
          <button type="button" className="button button--primary" onClick={handleCheckIn}>
            Check In
          </button>
        )}
      </div>
    </article>
  )
}

export default CalendarEventCard
