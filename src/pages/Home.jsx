import EventCard from '../components/EventCard'
import StatCard from '../components/StatCard'
import { events } from '../data'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { currentUser } = useAuth()
  const memberStats = [
    { label: 'Total Points', value: currentUser?.totalPoints ?? 0 },
    { label: 'Attendance Rate', value: `${Math.round((currentUser?.attendanceRate ?? 0) * 100)}%` },
    { label: 'Excusals Submitted', value: currentUser?.excusalsSubmitted ?? 0 },
  ]

  return (
    <section className="page home-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Member Dashboard</p>
          <h1>{currentUser?.name || 'Presence Member'}</h1>
          <p className="muted">Ready to check in and track points for your chapter?</p>
        </div>
      </div>

      <div className="grid grid--stats">
        {memberStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="section-block">
        <div className="section-heading">
          <h2>Upcoming events</h2>
          <p>Open check-ins and programs this week.</p>
        </div>
        <div className="grid grid--cards">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Home
