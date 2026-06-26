import { formatDisplayDate, formatDisplayTime } from '../utils/eventDateTime'
import { formatEventLocation } from '../utils/eventLocation'

function EventCard({ event }) {
  const typeClass = event.eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const displayDate = formatDisplayDate(event.eventDate || event.date) || event.date
  const startTime = formatDisplayTime(event.startTime)
  const endTime = formatDisplayTime(event.endTime)
  const location = formatEventLocation(event)

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
        <p className="event-card__location">{location}</p>
      </div>
    </article>
  )
}

export default EventCard
