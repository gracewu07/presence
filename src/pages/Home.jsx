import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
import StatCard from '../components/StatCard'
import { fetchUpcomingEvents } from '../firebase'
import { useAuth } from '../context/AuthContext'

const getEventDateValue = (event) => {
  const value = event.eventDate || event.date
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function Home() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      setError(null)
      try {
        const upcomingEvents = await fetchUpcomingEvents()
        const now = new Date()
        const sevenDaysFromNow = new Date(now)
        sevenDaysFromNow.setDate(now.getDate() + 7)

        setEvents(upcomingEvents.filter((event) => {
          const eventDate = getEventDateValue(event)
          return eventDate && eventDate >= now && eventDate <= sevenDaysFromNow
        }))
      } catch (err) {
        console.error('Unable to load upcoming events for Home:', err)
        setError('Unable to load events. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const memberStats = [
    { label: 'Attendance Rate', value: `${Math.round((currentUser?.attendanceRate ?? 0) * 100)}%` },
    { label: 'Total Points', value: currentUser?.totalPoints ?? 0 },
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
          <p>Events happening in the next week.</p>
        </div>
        {loading ? (
          <div className="empty-state">Loading events…</div>
        ) : error ? (
          <div className="empty-state form-error">{error}</div>
        ) : (
          <div className="grid grid--cards">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="empty-state">No events are happening in the next 7 days.</div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default Home
