import Button from '../components/Button'
import { events } from '../data/mockData'

function MemberCheckIn() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Check-In</p>
          <h1>Member Check-In</h1>
          <p className="muted">Tap the event below to record attendance quickly.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {events.map((event) => {
          const typeClass = event.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          return (
            <article key={event.id} className="card checkin-card">
              <div>
                <div className={`event-card__type event-type-badge event-type-badge--${typeClass}`}>
                  {event.type}
                </div>
                <h3>{event.title}</h3>
                <p>{event.date} · {event.time}</p>
                <p className="muted">{event.location}</p>
              </div>
              <Button variant="secondary">Check In</Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default MemberCheckIn
