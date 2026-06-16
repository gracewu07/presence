// Engagement scoring utilities
// Formula weights are intentionally exposed in constants so they can be tuned.

const WEIGHTS = {
  overall: 40,
  required: 30,
  recent: 20,
  diversity: 10,
}

// Helper: percent safe division
function percent(num, denom) {
  if (!denom || denom === 0) return 0
  return (num / denom) * 100
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
  const eligibleEvents = events.filter((e) => true) // placeholder for eligibility rules
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
