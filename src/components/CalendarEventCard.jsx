function CalendarEventCard({ event }) {
  return (
    <article className="card calendar-card">
      <div>
        <span className="calendar-card__date">{event.date}</span>
        <h3>{event.title}</h3>
        <p>{event.startTime} - {event.endTime}</p>
      </div>
      <div className="calendar-card__tag">{event.eventType}</div>
    </article>
  )
}

export default CalendarEventCard
