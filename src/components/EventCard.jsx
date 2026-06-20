function EventCard({ event }) {
  const typeClass = event.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <article className={`card event-card event-surface event-surface--${typeClass}`}>
      {event.required && <span className="required-note">Required</span>}
      <div>
        <div className="event-card__topline">
          <div className={`event-card__type event-type-badge event-type-badge--${typeClass}`}>
            {event.eventType}
          </div>
        </div>
        <h3>{event.title}</h3>
        <p className="event-card__meta">{event.date} · {event.startTime} - {event.endTime}</p>
        <p className="event-card__location">{event.locationName}</p>
      </div>
    </article>
  )
}

export default EventCard
