import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import StatCard from '../components/StatCard'
import { fetchCheckIns, fetchEvents } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { getMemberFirstName } from '../utils/memberDisplay'

const SERVICE_REQUIREMENT = 2
const PD_REQUIREMENT = 3

const normalizeType = (eventType = '') =>
  eventType
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')

const typeClassForEvent = (eventType) => {
  const normalized = normalizeType(eventType)
  if (normalized === 'pd' || normalized === 'professional-development') return 'professional-development'
  return normalized || 'other'
}

const getEventDateValue = (event) => {
  const value = event.eventDate
  if (value?.toDate) return value.toDate()
  if (value) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }

  if (event.date) {
    const date = event.date.includes('-')
      ? new Date(event.date)
      : new Date(`${event.date}, ${new Date().getFullYear()} ${event.startTime || '00:00'}`)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

const uniqueEventCount = (checkIns) => new Set(checkIns.map((checkIn) => checkIn.eventId).filter(Boolean)).size

const getMemberCheckIns = (checkIns, currentUser) => {
  const memberId = currentUser?.uid || currentUser?.id
  const memberEmail = currentUser?.email?.toLowerCase()

  return checkIns.filter((checkIn) => {
    const checkInEmail = checkIn.memberEmail?.toLowerCase()
    return checkIn.memberId === memberId || checkIn.memberId === currentUser?.id || checkInEmail === memberEmail
  })
}

const calculateRequirementBlurbs = (allEvents, checkIns, currentUser) => {
  const eventMap = new Map(allEvents.map((event) => [event.id, event]))
  const memberCheckIns = getMemberCheckIns(checkIns, currentUser)
  const attendedEventIds = new Set(memberCheckIns.map((checkIn) => checkIn.eventId).filter(Boolean))
  const requiredChapterEvents = allEvents.filter(
    (event) => event.required && typeClassForEvent(event.eventType) === 'chapter'
  )

  const chapterCompleted = requiredChapterEvents.filter((event) => attendedEventIds.has(event.id)).length
  const serviceCompleted = uniqueEventCount(memberCheckIns.filter((checkIn) => {
    const event = eventMap.get(checkIn.eventId)
    return typeClassForEvent(event?.eventType || checkIn.eventType) === 'service'
  }))
  const pdCompleted = uniqueEventCount(memberCheckIns.filter((checkIn) => {
    const event = eventMap.get(checkIn.eventId)
    return typeClassForEvent(event?.eventType || checkIn.eventType) === 'professional-development'
  }))
  const checkInPoints = memberCheckIns.reduce((sum, checkIn) => sum + Number(checkIn.pointsAwarded ?? 0), 0)
  const totalPoints = checkInPoints || currentUser?.totalPoints || 0
  const chapterRequired = requiredChapterEvents.length
  const chapterProgress = chapterRequired > 0 ? Math.min(chapterCompleted / chapterRequired, 1) : 0

  return [
    { label: 'Chapter', value: `${chapterCompleted}/${chapterRequired}`, progress: chapterProgress, variant: 'chapter' },
    { label: 'Service', value: `${serviceCompleted}/${SERVICE_REQUIREMENT}`, progress: Math.min(serviceCompleted / SERVICE_REQUIREMENT, 1), variant: 'service' },
    { label: 'Professional Development', value: `${pdCompleted}/${PD_REQUIREMENT}`, progress: Math.min(pdCompleted / PD_REQUIREMENT, 1), variant: 'professional-development' },
    { label: 'Total Points', value: totalPoints, variant: 'points' },
  ]
}

function Home() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [memberStats, setMemberStats] = useState(() => calculateRequirementBlurbs([], [], currentUser))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadHomeData() {
      if (!currentUser) {
        setEvents([])
        setMemberStats(calculateRequirementBlurbs([], [], null))
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const [eventSnapshot, checkInSnapshot] = await Promise.all([
          fetchEvents().catch(() => []),
          fetchCheckIns().catch(() => []),
        ])
        const allEvents = eventSnapshot || []
        const allCheckIns = checkInSnapshot || []
        const now = new Date()
        const sevenDaysFromNow = new Date(now)
        sevenDaysFromNow.setDate(now.getDate() + 7)

        setEvents(allEvents.filter((event) => {
          const eventDate = getEventDateValue(event)
          return eventDate && eventDate >= now && eventDate <= sevenDaysFromNow
        }))
        setMemberStats(calculateRequirementBlurbs(allEvents, allCheckIns, currentUser))
      } catch (err) {
        console.error('Unable to load home data:', err)
        setError('Unable to load events. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [currentUser])
  const firstName = currentUser ? getMemberFirstName(currentUser) : 'Presence Member'

  if (!currentUser) {
    return (
      <section className="page home-page">
        <div className="page__header">
          <div>
            <p className="eyebrow">Home</p>
            <h1>Welcome to Presence</h1>
            <p className="muted">Sign in to check in, view events, and track points for AKPsi.</p>
          </div>
        </div>

        <div className="section-block">
          <div className="section-heading">
            <h2>Upcoming events</h2>
            <p>Events happening in the next week.</p>
          </div>
          <div className="empty-state">
            <p>Sign in to view events.</p>
            <Link className="button button--primary" to="/login">Sign In</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page home-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Home</p>
          <h1>Welcome, {firstName}</h1>
          <p className="muted">Check in, view events, and track points for AKPsi.</p>
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
