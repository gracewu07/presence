import CalendarEventCard from '../components/CalendarEventCard'
import { calendarEvents } from '../data/mockData'

function EventCalendar() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>Event Calendar</h1>
          <p className="muted">See all chapter activities and attendance opportunities.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {calendarEvents.map((event) => (
          <CalendarEventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}

export default EventCalendar
