import { useState } from 'react'
import { buildCalendarUrls, downloadIcs } from '../utils/calendarLinks'

function CalendarEventCard({ event }) {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false)
  const typeClass = event.eventType.replace(/\s+/g, '-').toLowerCase()
  const calendarUrls = buildCalendarUrls(event)

  return (
    <article className={`card calendar-card event-surface event-surface--${typeClass}`}>
      {event.required && <span className="required-note">Required</span>}
      <div className="event-card__topline">
        <div className={`calendar-card__tag event-type-${typeClass}`}>
          {event.eventType}
        </div>
      </div>
      <div className="calendar-card__top">
        <div>
          <span className="calendar-card__date">{event.date}</span>
          <h3>{event.title}</h3>
          <p className="calendar-card__meta">{event.startTime} - {event.endTime}</p>
          <p className="calendar-card__meta">{event.locationName}</p>
          <p className="calendar-card__meta">{event.points} points</p>
        </div>
      </div>

      <div className="calendar-card__actions">
        <button
          type="button"
          className="button button--secondary calendar-add-button"
          onClick={() => setShowCalendarOptions((current) => !current)}
          aria-expanded={showCalendarOptions}
        >
          <span className="calendar-add-button__icon" aria-hidden="true">+</span>
          Add to Calendar
        </button>
        {showCalendarOptions && (
          <div className="calendar-options">
            <a href={calendarUrls.google} target="_blank" rel="noreferrer">Google Calendar</a>
            <a href={calendarUrls.outlook} target="_blank" rel="noreferrer">Outlook Calendar</a>
            <button type="button" onClick={() => downloadIcs(event)}>Apple Calendar</button>
          </div>
        )}
      </div>
    </article>
  )
}

export default CalendarEventCard
