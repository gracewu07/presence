import Button from './Button'
import StatusBadge from './StatusBadge'

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
        <StatusBadge label={event.required ? 'Required' : 'Optional'} status={event.required ? 'active' : 'pending'} />
        <Button variant="secondary">View</Button>
      </div>
    </article>
  )
}

export default EventCard
