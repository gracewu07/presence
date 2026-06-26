// Engagement scoring utilities
// Formula weights are intentionally exposed in constants so they can be tuned.

const WEIGHTS = {
  overall: 40,
  required: 30,
  recent: 20,
  diversity: 10,
}

const SERVICE_REQUIREMENT = 2
const PD_REQUIREMENT = 3

// Helper: percent safe division
function percent(num, denom) {
  if (!denom || denom === 0) return 0
  return (num / denom) * 100
}

function normalizeEventType(eventType = '') {
  return eventType.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-')
}

function getEventEndDate(event) {
  const value = event.endDate || event.eventDate || event.date
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getMemberIdValues(member) {
  return new Set(
    [member?.id, member?.email, member?.uid]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
  )
}

function checkInBelongsToMember(checkIn, memberIds) {
  const checkInIds = [checkIn.memberId, checkIn.memberEmail]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
  return checkInIds.some((id) => memberIds.has(id))
}

// eventTypesAttended: Set or array of event type strings the member attended
// events: array of event objects (must include id, eventType, required, eventDate)
// checkIns: array of check-in objects (must include eventId, memberId, createdAt)

// Calculate attendance rates and diversity score for a single member
export function computeAttendanceMetricsForMember(memberId, events = [], checkIns = []) {
  // Map eventId -> event
  const eventsById = new Map(events.map((e) => [e.id, e]))

  // Only consider checkIns for this member
  const memberCheckIns = checkIns.filter((c) => c.memberId === memberId)

  // Unique attended event ids
  const attendedEventIds = new Set(memberCheckIns.map((c) => c.eventId))

  // Overall attendance rate: percent of all eligible events attended
  const eligibleEvents = events
  const overallRate = percent(attendedEventIds.size, eligibleEvents.length)

  // Required event attendance rate
  const requiredEvents = events.filter((e) => e.required)
  const requiredAttended = requiredEvents.filter((e) => attendedEventIds.has(e.id)).length
  const requiredRate = percent(requiredAttended, requiredEvents.length)

  // Recent attendance (last 30 days)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentEvents = events.filter((e) => {
    const d = e.eventDate ? new Date(e.eventDate).getTime() : null
    return d && d >= cutoff
  })
  const recentAttended = recentEvents.filter((e) => attendedEventIds.has(e.id)).length
  const recentRate = percent(recentAttended, recentEvents.length)

  // Event type diversity: normalized diversity score 0-100
  const typesAttended = new Set(
    Array.from(attendedEventIds).map((id) => eventsById.get(id)?.eventType).filter(Boolean)
  )
  const totalTypes = new Set(events.map((e) => e.eventType).filter(Boolean)).size || 1
  const diversityScore = percent(typesAttended.size, totalTypes)

  return {
    overallRate,
    requiredRate,
    recentRate,
    diversityScore,
    attendedEventCount: attendedEventIds.size,
  }
}

// Compute engagement score (0-100) using the weighted formula
export function computeEngagementScore(metrics) {
  // metrics: object returned from computeAttendanceMetricsForMember
  const overall = metrics.overallRate || 0
  const required = metrics.requiredRate || 0
  const recent = metrics.recentRate || 0
  const diversity = metrics.diversityScore || 0

  const raw =
    overall * (WEIGHTS.overall / 100) +
    required * (WEIGHTS.required / 100) +
    recent * (WEIGHTS.recent / 100) +
    diversity * (WEIGHTS.diversity / 100)

  const score = Math.round(Math.min(100, Math.max(0, raw)))
  return score
}

export function engagementCategory(score) {
  if (score >= 85) return 'Highly Engaged'
  if (score >= 70) return 'Engaged'
  if (score >= 50) return 'Moderate'
  return 'At Risk'
}

// At-risk flagging
export function isAtRisk(metrics, score) {
  // Flags:
  // - overall attendance rate < 70
  // - OR required event attendance rate < 70
  // - OR missed 2 or more required events (we compute this externally)
  // - OR no check-ins in last 21 days
  // - OR engagement score < 50
  const reasons = []

  if ((metrics.overallRate || 0) < 70) reasons.push('Overall attendance below 70%')
  if ((metrics.requiredRate || 0) < 70) reasons.push('Required event attendance below 70%')
  if ((metrics.missedRequiredCount || 0) >= 2) reasons.push('Missed 2 or more required events')
  if (metrics.daysSinceLastCheckIn !== undefined && metrics.daysSinceLastCheckIn > 21)
    reasons.push('No check-ins in last 21 days')
  if ((score || 0) < 50) reasons.push('Engagement score below 50')

  return { flagged: reasons.length > 0, reasons }
}

export function computeRequirementRiskForMember(member, events = [], checkIns = [], now = new Date()) {
  const memberIds = getMemberIdValues(member)
  const memberCheckIns = checkIns.filter((checkIn) => checkInBelongsToMember(checkIn, memberIds))
  const attendedEventIds = new Set(memberCheckIns.map((checkIn) => checkIn.eventId).filter(Boolean))
  const pastEvents = events.filter((event) => {
    const endDate = getEventEndDate(event)
    return endDate && endDate <= now
  })

  const pastRequiredChapterEvents = pastEvents.filter(
    (event) => event.required && normalizeEventType(event.eventType) === 'chapter'
  )
  const attendedRequiredChapterEvents = pastRequiredChapterEvents.filter((event) => attendedEventIds.has(event.id))
  const missedRequiredChapterEvents = pastRequiredChapterEvents.filter((event) => !attendedEventIds.has(event.id))

  const pastServiceEvents = pastEvents.filter((event) => normalizeEventType(event.eventType) === 'service')
  const attendedServiceEvents = pastServiceEvents.filter((event) => attendedEventIds.has(event.id))
  const pastPdEvents = pastEvents.filter((event) => normalizeEventType(event.eventType) === 'professional-development')
  const attendedPdEvents = pastPdEvents.filter((event) => attendedEventIds.has(event.id))

  const expectedServiceCount = Math.min(SERVICE_REQUIREMENT, pastServiceEvents.length)
  const expectedPdCount = Math.min(PD_REQUIREMENT, pastPdEvents.length)

  const reasons = []
  if (missedRequiredChapterEvents.length > 0) {
    reasons.push(`Missed ${missedRequiredChapterEvents.length} required chapter event${missedRequiredChapterEvents.length === 1 ? '' : 's'}`)
  }
  if (attendedServiceEvents.length < expectedServiceCount) {
    reasons.push(`Service attendance ${attendedServiceEvents.length}/${SERVICE_REQUIREMENT}`)
  }
  if (attendedPdEvents.length < expectedPdCount) {
    reasons.push(`Professional development attendance ${attendedPdEvents.length}/${PD_REQUIREMENT}`)
  }

  return {
    flagged: reasons.length > 0,
    reasons,
    requiredChapter: {
      attended: attendedRequiredChapterEvents.length,
      expected: pastRequiredChapterEvents.length,
      missed: missedRequiredChapterEvents.length,
    },
    service: {
      attended: attendedServiceEvents.length,
      expected: expectedServiceCount,
      required: SERVICE_REQUIREMENT,
    },
    professionalDevelopment: {
      attended: attendedPdEvents.length,
      expected: expectedPdCount,
      required: PD_REQUIREMENT,
    },
  }
}
