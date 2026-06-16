import { useMemo, useState } from 'react'
import CalendarEventCard from '../components/CalendarEventCard'
import { calendarEvents } from '../data'

function EventCalendar() {
  const [view, setView] = useState('list')

  const days = useMemo(() => {
    const parsed = calendarEvents.map((event) => {
      const [monthName, day] = event.date.split(' ')
      return {
        ...event,
        dayNumber: parseInt(day, 10),
        monthName,
      }
    })
    return parsed
  }, [])

  const range = Array.from({ length: 30 }, (_, index) => index + 1)

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>Event Calendar</h1>
          <p className="muted">See all chapter activities and attendance opportunities.</p>
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
            className={`button button--secondary ${view === 'month' ? 'button--active' : ''}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid--cards">
          {calendarEvents.map((event) => (
            <CalendarEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
            <div key={dayName} className="calendar-grid__heading">
              {dayName}
            </div>
          ))}
          {range.map((dayNumber) => {
            const dayEvents = days.filter((event) => event.dayNumber === dayNumber)
            return (
              <div key={dayNumber} className="calendar-day">
                <div className="calendar-day__header">
                  <span>{dayNumber}</span>
                  {dayEvents.length > 0 && <span className="calendar-day__badge">{dayEvents.length}</span>}
                </div>
                <div className="calendar-day__events">
                          {dayEvents.map((event) => (
                    <div key={event.id} className="calendar-day__event">
                      <strong>{event.title}</strong>
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default EventCalendar
