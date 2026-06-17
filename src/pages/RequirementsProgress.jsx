import { useEffect, useMemo, useState } from 'react'
import RequirementProgressCard from '../components/RequirementProgressCard'
import { useAuth } from '../context/AuthContext'
import { fetchCheckIns, fetchEvents } from '../firebase'
import { events as staticEvents } from '../data/events'
import { leaderboardCheckIns } from '../data/mockData'

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

const getStatus = (completed, required, progress) => {
  if (required > 0 && progress >= 1) return 'Complete'
  if (completed > 0) return 'In Progress'
  return 'Not Started'
}

const uniqueEventCount = (checkIns) => new Set(checkIns.map((checkIn) => checkIn.eventId).filter(Boolean)).size

function RequirementsProgress() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadProgressData() {
      setLoading(true)
      try {
        const [eventSnapshot, checkInSnapshot] = await Promise.all([
          fetchEvents().catch(() => {
            setUsingFallback(true)
            return staticEvents
          }),
          fetchCheckIns().catch(() => {
            setUsingFallback(true)
            return leaderboardCheckIns
          }),
        ])

        if (!isMounted) return

        setEvents(eventSnapshot?.length ? eventSnapshot : staticEvents)
        setCheckIns(checkInSnapshot?.length ? checkInSnapshot : leaderboardCheckIns)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProgressData()

    return () => {
      isMounted = false
    }
  }, [])

  const progressData = useMemo(() => {
    const memberId = currentUser?.uid || currentUser?.id
    const memberEmail = currentUser?.email?.toLowerCase()
    const eventMap = new Map(events.map((event) => [event.id, event]))

    const memberCheckIns = checkIns.filter((checkIn) => {
      const checkInEmail = checkIn.memberEmail?.toLowerCase()
      return checkIn.memberId === memberId || checkIn.memberId === currentUser?.id || checkInEmail === memberEmail
    })

    const requiredChapterEvents = events.filter(
      (event) => event.required && typeClassForEvent(event.eventType) === 'chapter'
    )
    const attendedEventIds = new Set(memberCheckIns.map((checkIn) => checkIn.eventId).filter(Boolean))
    const attendedRequiredChapterEvents = requiredChapterEvents.filter((event) => attendedEventIds.has(event.id))

    const serviceCheckIns = memberCheckIns.filter((checkIn) => {
      const event = eventMap.get(checkIn.eventId)
      return typeClassForEvent(event?.eventType || checkIn.eventType) === 'service'
    })

    const pdCheckIns = memberCheckIns.filter((checkIn) => {
      const event = eventMap.get(checkIn.eventId)
      return typeClassForEvent(event?.eventType || checkIn.eventType) === 'professional-development'
    })

    const chapterRequired = requiredChapterEvents.length
    const chapterCompleted = attendedRequiredChapterEvents.length
    const serviceCompleted = uniqueEventCount(serviceCheckIns)
    const pdCompleted = uniqueEventCount(pdCheckIns)

    const requirements = [
      {
        key: 'chapter',
        title: 'Chapter Events',
        completed: chapterCompleted,
        required: chapterRequired,
        progress: chapterRequired > 0 ? Math.min(chapterCompleted / chapterRequired, 1) : 0,
        status: chapterRequired > 0 ? getStatus(chapterCompleted, chapterRequired, chapterCompleted / chapterRequired) : 'Not Started',
        note: chapterRequired === 0 ? 'No required chapter events yet' : '',
      },
      {
        key: 'service',
        title: 'Service Events',
        completed: serviceCompleted,
        required: SERVICE_REQUIREMENT,
        progress: Math.min(serviceCompleted / SERVICE_REQUIREMENT, 1),
        status: getStatus(serviceCompleted, SERVICE_REQUIREMENT, serviceCompleted / SERVICE_REQUIREMENT),
      },
      {
        key: 'professional-development',
        title: 'Professional Development Events',
        completed: pdCompleted,
        required: PD_REQUIREMENT,
        progress: Math.min(pdCompleted / PD_REQUIREMENT, 1),
        status: getStatus(pdCompleted, PD_REQUIREMENT, pdCompleted / PD_REQUIREMENT),
      },
    ]

    const activeRequirements = requirements.filter((requirement) => requirement.required > 0)
    const completedRequirements = activeRequirements.filter((requirement) => requirement.progress >= 1).length
    const overallProgress = activeRequirements.length
      ? activeRequirements.reduce((sum, requirement) => sum + requirement.progress, 0) / activeRequirements.length
      : 0

    return {
      completedRequirements,
      completedCheckIns: memberCheckIns.length,
      overallProgress,
      requirements,
      totalRequirements: activeRequirements.length,
    }
  }, [checkIns, currentUser, events])

  const overallPercent = Math.round(progressData.overallProgress * 100)
  const summaryMessage =
    overallPercent >= 100
      ? "You're all set for your requirements."
      : overallPercent >= 25
        ? "You're making progress - keep attending upcoming events."
        : 'Start by attending an upcoming service or professional development event.'

  return (
    <section className="page progress-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Member Progress</p>
          <h1>Requirements Progress</h1>
          <p className="muted">Track your chapter, service, and professional development requirements.</p>
        </div>
      </div>

      <article className="card progress-summary-card">
        <div className="progress-summary-card__content">
          <div>
            <p className="eyebrow">Overall</p>
            <h2>
              {progressData.completedRequirements} of {progressData.totalRequirements} requirements complete
            </h2>
            <p className="muted">{summaryMessage}</p>
            {usingFallback ? <p className="muted progress-summary-card__fallback">Showing mock data while Firebase data is unavailable.</p> : null}
          </div>

          <div className="progress-summary-card__bar" aria-label={`${overallPercent}% overall complete`}>
            <span style={{ width: `${overallPercent}%` }} />
          </div>

          <div className="progress-summary-card__facts">
            <div>
              <p className="label">Requirement Tracks</p>
              <p>{progressData.totalRequirements}</p>
            </div>
            <div>
              <p className="label">Completed Check-Ins</p>
              <p>{progressData.completedCheckIns}</p>
            </div>
          </div>
        </div>
        <div className="progress-summary-card__percent">
          <span>{overallPercent}%</span>
          <small>Overall</small>
        </div>
      </article>

      {loading ? (
        <div className="card card-empty">Loading progress...</div>
      ) : (
        <div className="requirements-grid">
          {progressData.requirements.map((requirement) => (
            <RequirementProgressCard
              key={requirement.key}
              title={requirement.title}
              completed={requirement.completed}
              required={requirement.required}
              progress={requirement.progress}
              status={requirement.status}
              note={requirement.note}
              variant={requirement.key}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default RequirementsProgress
