import { formatDisplayDate, formatDisplayTime } from '../utils/eventDateTime'

function EventCard({ event }) {
  const typeClass = event.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const displayDate = formatDisplayDate(event.eventDate || event.date) || event.date
  const startTime = formatDisplayTime(event.startTime)
  const endTime = formatDisplayTime(event.endTime)

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
        <p className="event-card__meta">{displayDate} · {startTime} - {endTime}</p>
        <p className="event-card__location">{event.locationName}</p>
      </div>
    </article>
  )
}

export default EventCard
