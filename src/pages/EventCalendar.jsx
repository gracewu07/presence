import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CalendarEventCard from '../components/CalendarEventCard'
import { EVENT_TYPE_FILTERS } from '../constants/eventTypes'
import { useAuth } from '../context/AuthContext'
import { deleteEvent, fetchEvents } from '../firebase'
import { buildCalendarUrls, downloadIcs } from '../utils/calendarLinks'
import { formatDisplayDate, formatDisplayTime } from '../utils/eventDateTime'
import { formatEventLocation } from '../utils/eventLocation'
import { canManageEvents } from '../utils/permissions'

const parseEventTime = (time) => {
  if (!time) return '00:00'
  if (time.includes('AM') || time.includes('PM')) {
    const [clock, period] = time.split(' ')
    const [hourValue, minuteValue] = clock.split(':').map(Number)
    let hour = hourValue
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${minuteValue.toString().padStart(2, '0')}`
  }
  return time
}

const parseDateTime = (date, time) => {
  const normalizedTime = parseEventTime(time)

  if (!date) {
    return new Date(`1970-01-01T${normalizedTime}:00`)
  }

  if (date.includes('-')) {
    return new Date(`${date}T${normalizedTime}:00`)
  }

  const [monthName, day] = date.split(' ')
  return new Date(`${monthName} ${day}, ${new Date().getFullYear()} ${normalizedTime}:00`)
}

const calendarMonths = [
  { label: 'June', index: 5 },
  { label: 'July', index: 6 },
  { label: 'August', index: 7 },
  { label: 'September', index: 8 },
  { label: 'October', index: 9 },
  { label: 'November', index: 10 },
  { label: 'December', index: 11 },
]

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const buildMonthDays = (monthIndex, year) => {
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const blanks = Array.from({ length: firstDay.getDay() }, (_, index) => ({
    key: `blank-${monthIndex}-${index}`,
    day: null,
  }))
  const days = Array.from({ length: daysInMonth }, (_, index) => ({
    key: `${monthIndex}-${index + 1}`,
    day: index + 1,
  }))
  return [...blanks, ...days]
}

function EventCalendar() {
  const { currentUser } = useAuth()
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState([])
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null)
  const [showModalCalendarOptions, setShowModalCalendarOptions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      setError(null)

      try {
        const firestoreEvents = await fetchEvents()
        setEvents(firestoreEvents)
      } catch (err) {
        console.error('Failed to load events:', err)
        setEvents([])
        setError('Unable to load events. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const enhancedEvents = useMemo(() => {
    return events.map((event) => {
      const startDate = parseDateTime(event.date, event.startTime)
      const endDate = parseDateTime(event.date, event.endTime)
      return {
        ...event,
        startDate,
        endDate,
        searchText: `${event.title} ${event.eventType}`.toLowerCase(),
      }
    })
  }, [events])

  const selectedEvents = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim()
    return enhancedEvents
      .filter((event) => {
        if (filter === 'All') return true
        return event.eventType === filter
      })
      .filter((event) => {
        if (!normalizedSearch) return true
        return event.searchText.includes(normalizedSearch)
      })
      .sort((a, b) => a.startDate - b.startDate)
  }, [enhancedEvents, filter, search])

  const calendarYear = useMemo(() => {
    const firstEvent = selectedEvents.find((event) => event.startDate instanceof Date && !Number.isNaN(event.startDate))
    return firstEvent ? firstEvent.startDate.getFullYear() : new Date().getFullYear()
  }, [selectedEvents])

  const eventsByMonthDay = useMemo(() => {
    return selectedEvents.reduce((group, event) => {
      const month = event.startDate.getMonth()
      const day = event.startDate.getDate()
      const key = `${month}-${day}`
      group[key] = group[key] || []
      group[key].push(event)
      return group
    }, {})
  }, [selectedEvents])

  const searchPlaceholder = 'Search by title or type...'
  const selectedCalendarUrls = selectedCalendarEvent ? buildCalendarUrls(selectedCalendarEvent) : null
  const canEditEvents = canManageEvents(currentUser)

  const openCalendarEvent = (event) => {
    setShowModalCalendarOptions(false)
    setSelectedCalendarEvent(event)
  }

  const closeCalendarEvent = () => {
    setShowModalCalendarOptions(false)
    setSelectedCalendarEvent(null)
  }

  const handleDeleteEvent = async (event) => {
    if (!canEditEvents) return

    const confirmed = window.confirm(`Delete "${event.title}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteEvent(event.id)
      setEvents((current) => current.filter((item) => item.id !== event.id))
      if (selectedCalendarEvent?.id === event.id) {
        closeCalendarEvent()
      }
    } catch (deleteError) {
      console.error('Failed to delete event:', deleteError)
      setError('Unable to delete event. Please try again later.')
    }
  }

  return (
    <section className="page calendar-page">
      <div className="page__header calendar-page__header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>Event Calendar</h1>
          <p className="muted">View scheduled events, search by location, and filter by type.</p>
        </div>
        <div className="calendar-toggle">
          <button
            type="button"
            className={`button button--secondary ${view === 'list' ? 'button--active' : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            type="button"
            className={`button button--secondary ${view === 'calendar' ? 'button--active' : ''}`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="calendar-controls">
        <div className="calendar-filter-chips">
          {EVENT_TYPE_FILTERS.map((type) => (
            <button
              key={type}
              type="button"
              className={`calendar-chip event-type-${type.replace(/\s+/g, '-').toLowerCase()} ${filter === type ? 'calendar-chip--active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="calendar-search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading events…</div>
      ) : error ? (
        <div className="empty-state form-error">{error}</div>
      ) : view === 'list' ? (
        <div className="grid grid--cards">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                canEdit={canEditEvents}
                onDelete={handleDeleteEvent}
              />
            ))
          ) : (
            <div className="empty-state">
              No events match your search and filter. Try another term or type.
            </div>
          )}
        </div>
      ) : (
        <div className="calendar-months">
          {calendarMonths.map((month) => (
            <section key={month.label} className="calendar-month">
              <div className="calendar-month__header">
                <h2>{month.label}</h2>
                <span>{calendarYear}</span>
              </div>
              <div className="calendar-month__weekdays">
                {weekdayLabels.map((weekday) => (
                  <span key={`${month.label}-${weekday}`}>{weekday}</span>
                ))}
              </div>
              <div className="calendar-month__grid">
                {buildMonthDays(month.index, calendarYear).map((day) => {
                  const dayEvents = day.day ? eventsByMonthDay[`${month.index}-${day.day}`] || [] : []
                  return (
                    <div
                      key={`${month.label}-${day.key}`}
                      className={`calendar-month__day ${day.day ? '' : 'calendar-month__day--empty'}`}
                    >
                      {day.day && <span className="calendar-month__date">{day.day}</span>}
                      {dayEvents.map((event) => (
                        <button
                          type="button"
                          key={event.id}
                          className={`calendar-month-event event-surface--${event.eventType.replace(/\s+/g, '-').toLowerCase()}`}
                          onClick={() => openCalendarEvent(event)}
                        >
                          <strong>{event.title}</strong>
                          <span>{event.startTime}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedCalendarEvent && (
        <div className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title">
          <button
            type="button"
            className="calendar-modal__backdrop"
            aria-label="Close event details"
            onClick={closeCalendarEvent}
          />
          <article className={`calendar-modal__card event-surface event-surface--${selectedCalendarEvent.eventType.replace(/\s+/g, '-').toLowerCase()}`}>
            {selectedCalendarEvent.required && <span className="required-note">Required</span>}
            <div className="event-card__topline">
              <span className={`calendar-card__tag event-type-${selectedCalendarEvent.eventType.replace(/\s+/g, '-').toLowerCase()}`}>
                {selectedCalendarEvent.eventType}
              </span>
            </div>
            <button
              type="button"
              className="calendar-modal__close"
              aria-label="Close event details"
              onClick={closeCalendarEvent}
            >
              ×
            </button>
            <h2 id="calendar-modal-title">{selectedCalendarEvent.title}</h2>
            <div className="calendar-modal__details">
              <div>
                <p className="label">Date</p>
                <p>{formatDisplayDate(selectedCalendarEvent.eventDate || selectedCalendarEvent.date) || selectedCalendarEvent.date}</p>
              </div>
              <div>
                <p className="label">Time</p>
                <p>{formatDisplayTime(selectedCalendarEvent.startTime)} - {formatDisplayTime(selectedCalendarEvent.endTime)}</p>
              </div>
              <div>
                <p className="label">Location</p>
                <p>{formatEventLocation(selectedCalendarEvent)}</p>
              </div>
              <div>
                <p className="label">Points</p>
                <p>{selectedCalendarEvent.points}</p>
              </div>
            </div>
            <div className="calendar-card__actions calendar-modal__actions">
              {canEditEvents && (
                <>
                  <Link className="button button--secondary calendar-add-button" to={`/admin/events/${selectedCalendarEvent.id}/edit`}>
                    Edit Event
                  </Link>
                  <button
                    type="button"
                    className="button button--secondary button--danger calendar-add-button"
                    onClick={() => handleDeleteEvent(selectedCalendarEvent)}
                  >
                    Delete Event
                  </button>
                </>
              )}
              <button
                type="button"
                className="button button--secondary calendar-add-button"
                onClick={() => setShowModalCalendarOptions((current) => !current)}
                aria-expanded={showModalCalendarOptions}
              >
                <span className="calendar-add-button__icon" aria-hidden="true">+</span>
                Add to Calendar
              </button>
              {showModalCalendarOptions && selectedCalendarUrls && (
                <div className="calendar-options">
                  <a href={selectedCalendarUrls.google} target="_blank" rel="noreferrer">Google Calendar</a>
                  <a href={selectedCalendarUrls.outlook} target="_blank" rel="noreferrer">Outlook Calendar</a>
                  <button type="button" onClick={() => downloadIcs(selectedCalendarEvent)}>Apple Calendar</button>
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default EventCalendar
