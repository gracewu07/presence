import Button from './Button'
import StatusBadge from './StatusBadge'

function EventCard({ event }) {
  const typeClass = event.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <article className="card event-card">
      <div>
        <div className={`event-card__type event-type-badge event-type-badge--${typeClass}`}>
          {event.type}
        </div>
        <h3>{event.title}</h3>
        <p className="event-card__meta">{event.date} · {event.time}</p>
        <p className="event-card__location">{event.location}</p>
      </div>
      <div className="event-card__footer">
        <StatusBadge label={event.status === 'open' ? 'Open' : 'Full'} status={event.status} />
        <Button variant="secondary">View</Button>
      </div>
    </article>
  )
}

export default EventCard
