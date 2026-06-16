import { useState } from 'react'

const padDate = (value) => value.toString().padStart(2, '0')

const toCalendarDate = (date) => {
  const value = new Date(date)
  return `${value.getUTCFullYear()}${padDate(value.getUTCMonth() + 1)}${padDate(value.getUTCDate())}T${padDate(value.getUTCHours())}${padDate(value.getUTCMinutes())}00Z`
}

const buildCalendarUrls = (event) => {
  const start = toCalendarDate(event.startDate)
  const end = toCalendarDate(event.endDate)
  const title = encodeURIComponent(event.title || '')
  const details = encodeURIComponent(event.description || '')
  const location = encodeURIComponent(event.locationName || event.location || '')
  const dates = `${start}/${end}`

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${new Date(event.startDate).toISOString()}&enddt=${new Date(event.endDate).toISOString()}&body=${details}&location=${location}`,
  }
}

const downloadIcs = (event) => {
  const start = toCalendarDate(event.startDate)
  const end = toCalendarDate(event.endDate)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Presence//Calendar Event//EN',
    'BEGIN:VEVENT',
    `UID:${event.id || event.title}@presence`,
    `SUMMARY:${event.title || ''}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `LOCATION:${event.locationName || event.location || ''}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function CalendarEventCard({ event }) {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false)
  const typeClass = event.eventType.replace(/\s+/g, '-').toLowerCase()
  const calendarUrls = buildCalendarUrls(event)

  return (
    <article className={`card calendar-card event-surface event-surface--${typeClass}`}>
      <div className="event-card__topline">
        <div className={`calendar-card__tag event-type-${typeClass}`}>
          {event.eventType}
        </div>
        {event.required && <span className="required-note">Required</span>}
      </div>
      <div className="calendar-card__top">
        <div>
          <span className="calendar-card__date">{event.date}</span>
          <h3>{event.title}</h3>
          <p className="calendar-card__meta">
            {event.startTime} - {event.endTime} · {event.locationName}
          </p>
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
