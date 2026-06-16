import { useEffect, useMemo, useState } from 'react'
import CalendarEventCard from '../components/CalendarEventCard'
import { fetchEvents } from '../firebase'

const eventTypes = [
  'All',
  'Chapter',
  'Service',
  'Professional Development',
  'Social',
  'Recruitment',
]

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

function EventCalendar() {
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState([])
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
        console.error('Failed to fetch events:', err)
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
        searchText: `${event.title} ${event.locationName}`.toLowerCase(),
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

  const groupedByDate = useMemo(() => {
    return selectedEvents.reduce((group, event) => {
      group[event.date] = group[event.date] || []
      group[event.date].push(event)
      return group
    }, {})
  }, [selectedEvents])

  const searchPlaceholder = 'Search by title or location...'

  return (
    <section className="page">
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
          {eventTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`calendar-chip ${filter === type ? 'calendar-chip--active' : ''}`}
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
              <CalendarEventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="empty-state">
              No events match your search and filter. Try another term or type.
            </div>
          )}
        </div>
      ) : (
        <div className="calendar-board">
          {Object.keys(groupedByDate).length > 0 ? (
            Object.entries(groupedByDate).map(([date, dayEvents]) => (
              <div key={date} className="calendar-day-card">
                <div className="calendar-day-card__header">
                  <span>{date}</span>
                  <span>{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}</span>
                </div>
                <div className="calendar-day-card__events">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="calendar-day-card__event">
                      <div>
                        <strong>{event.title}</strong>
                        <p>{event.startTime} - {event.endTime}</p>
                        <p className="muted">{event.locationName}</p>
                      </div>
                      <span className={`event-type-pill event-type-${event.eventType.replace(/\s+/g, '-').toLowerCase()}`}>
                        {event.eventType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No calendar events match your filter or search.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default EventCalendar
