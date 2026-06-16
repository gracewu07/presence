import Button from './Button'

function EventCard({ event }) {
  const typeClass = event.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <article className="card event-card">
      <div>
        <div className={`event-card__type event-type-badge event-type-badge--${typeClass}`}>
          {event.eventType}
        </div>
        <h3>{event.title}</h3>
        <p className="event-card__meta">{event.date} · {event.startTime} - {event.endTime}</p>
        <p className="event-card__location">{event.locationName}</p>
        <p className="event-card__description">{event.description}</p>
      </div>
      <div className="event-card__footer">
        {event.required && <span className="required-note">Required event</span>}
        <Button variant="secondary">View</Button>
      </div>
    </article>
  )
}

export default EventCard
