import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { fetchMembers, fetchEvents, fetchCheckIns } from '../firebase'
import { members as mockMembers, leaderboardCheckIns } from '../data/mockData'
import { computeAttendanceMetricsForMember, computeEngagementScore } from '../utils/engagement'

const COLORS = ['#72a0c0', '#ead06b', '#d48f5e', '#9297cc', '#6fb7a3']

const getEventDate = (event) => {
  const value = event?.eventDate || event?.date
  if (!value) return null
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getMemberKey = (checkIn) => checkIn.memberId || checkIn.memberEmail || checkIn.memberName || 'Unknown'

const buildMemberLookups = (members) => {
  const byId = new Map()
  const byEmail = new Map()

  members.forEach((member) => {
    if (member.id) byId.set(member.id, member)
    if (member.uid) byId.set(member.uid, member)
    if (member.email) byEmail.set(member.email.toLowerCase(), member)
  })

  return { byId, byEmail }
}

const memberForCheckIn = (checkIn, lookups) =>
  lookups.byId.get(checkIn.memberId) || lookups.byEmail.get(checkIn.memberEmail?.toLowerCase()) || null

const shortName = (value = '') => (value.length > 16 ? `${value.slice(0, 15)}...` : value)

const weekdayName = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

const formatEventLabel = (event) => {
  const date = getEventDate(event)
  const dateLabel = date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'
  return `${event.title} · ${dateLabel}`
}

export default function AnalyticsDashboard() {
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [m, e, c] = await Promise.all([fetchMembers(), fetchEvents(), fetchCheckIns()])
        setMembers(m.length ? m : mockMembers)
        setEvents(e)
        setCheckIns(c.length ? c : leaderboardCheckIns)
      } catch (err) {
        console.error('Failed to load analytics data', err)
        setMembers(mockMembers)
        setEvents([])
        setCheckIns(leaderboardCheckIns)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Attendance over time (per event date)
  const attendanceByDate = useMemo(() => {
    const eventsById = new Map(events.map((ev) => [ev.id, ev]))
    const counts = {}
    checkIns.forEach((ci) => {
      const ev = eventsById.get(ci.eventId)
      const eventDate = getEventDate(ev)
      const date = eventDate ? eventDate.toLocaleDateString() : 'Unknown'
      counts[date] = (counts[date] || 0) + 1
    })
    return Object.keys(counts)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((k) => ({ date: k, checkIns: counts[k] }))
  }, [events, checkIns])

  const attendanceByEvent = useMemo(() => {
    const memberCount = members.length || 1
    return events
      .map((event) => {
        const attendeeIds = new Set(
          checkIns
            .filter((checkIn) => checkIn.eventId === event.id)
            .map((checkIn) => checkIn.memberId || checkIn.memberEmail)
            .filter(Boolean)
        )
        const attendees = attendeeIds.size
        return {
          name: formatEventLabel(event),
          shortName: event.title,
          attendees,
          attendanceRate: Math.round((attendees / memberCount) * 100),
          type: event.eventType || 'Other',
          dateValue: getEventDate(event)?.getTime() || 0,
        }
      })
      .sort((first, second) => first.dateValue - second.dateValue)
  }, [events, checkIns, members])

  const eventAttendanceById = useMemo(() => {
    const attendanceMap = new Map()
    checkIns.forEach((checkIn) => {
      if (!checkIn.eventId) return
      const attendees = attendanceMap.get(checkIn.eventId) || new Set()
      attendees.add(getMemberKey(checkIn))
      attendanceMap.set(checkIn.eventId, attendees)
    })
    return attendanceMap
  }, [checkIns])

  // Event type breakdown
  const eventTypeData = useMemo(() => {
    const eventsById = new Map(events.map((ev) => [ev.id, ev]))
    const types = {}
    checkIns.forEach((ci) => {
      const ev = eventsById.get(ci.eventId)
      const t = ev?.eventType || 'Other'
      types[t] = (types[t] || 0) + 1
    })
    return Object.keys(types).map((k, i) => ({ name: k, value: types[k], color: COLORS[i % COLORS.length] }))
  }, [events, checkIns])

  const attendanceRateByType = useMemo(() => {
    const memberCount = members.length || 1
    const grouped = new Map()

    events.forEach((event) => {
      const type = event.eventType || 'Other'
      const current = grouped.get(type) || { name: type, events: 0, attendees: 0, attendanceRate: 0 }
      current.events += 1
      current.attendees += eventAttendanceById.get(event.id)?.size || 0
      grouped.set(type, current)
    })

    return Array.from(grouped.values()).map((row) => ({
      ...row,
      averageAttendees: row.events ? Math.round((row.attendees / row.events) * 10) / 10 : 0,
      attendanceRate: row.events ? Math.round((row.attendees / (row.events * memberCount)) * 100) : 0,
    }))
  }, [eventAttendanceById, events, members])

  const requiredOptionalData = useMemo(() => {
    const memberCount = members.length || 1
    const groups = [
      { name: 'Required', eventCount: 0, checkIns: 0, attendanceRate: 0 },
      { name: 'Optional', eventCount: 0, checkIns: 0, attendanceRate: 0 },
    ]

    events.forEach((event) => {
      const group = event.required ? groups[0] : groups[1]
      group.eventCount += 1
      group.checkIns += eventAttendanceById.get(event.id)?.size || 0
    })

    return groups.map((group) => ({
      ...group,
      attendanceRate: group.eventCount ? Math.round((group.checkIns / (group.eventCount * memberCount)) * 100) : 0,
    }))
  }, [eventAttendanceById, events, members])

  const topMembersByEngagement = useMemo(() => {
    const totals = new Map()
    checkIns.forEach((checkIn) => {
      const key = getMemberKey(checkIn)
      const existing = totals.get(key) || {
        name: checkIn.memberName || checkIn.memberEmail || 'Member',
        shortName: shortName(checkIn.memberName || checkIn.memberEmail || 'Member'),
        checkIns: 0,
        points: 0,
      }
      existing.checkIns += 1
      existing.points += Number(checkIn.pointsAwarded || 0)
      totals.set(key, existing)
    })

    return Array.from(totals.values())
      .sort((first, second) => second.points - first.points || second.checkIns - first.checkIns)
      .slice(0, 8)
  }, [checkIns])

  const classParticipationData = useMemo(() => {
    const lookups = buildMemberLookups(members)
    const totals = new Map()

    checkIns.forEach((checkIn) => {
      const member = memberForCheckIn(checkIn, lookups)
      const pledgeClass = member?.pledgeClass || 'Unknown'
      const current = totals.get(pledgeClass) || { name: pledgeClass, checkIns: 0, points: 0 }
      current.checkIns += 1
      current.points += Number(checkIn.pointsAwarded || 0)
      totals.set(pledgeClass, current)
    })

    return Array.from(totals.values()).sort((first, second) => second.checkIns - first.checkIns)
  }, [checkIns, members])

  const familyParticipationData = useMemo(() => {
    const lookups = buildMemberLookups(members)
    const totals = new Map()

    checkIns.forEach((checkIn) => {
      const member = memberForCheckIn(checkIn, lookups)
      const family = member?.family || 'Unknown'
      const current = totals.get(family) || { name: family, checkIns: 0, points: 0 }
      current.checkIns += 1
      current.points += Number(checkIn.pointsAwarded || 0)
      totals.set(family, current)
    })

    return Array.from(totals.values()).sort((first, second) => second.checkIns - first.checkIns)
  }, [checkIns, members])

  const weekdayCheckInData = useMemo(() => {
    const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const totals = new Map(order.map((day) => [day, { name: day, checkIns: 0 }]))

    checkIns.forEach((checkIn) => {
      const day = weekdayName(checkIn.timestamp || checkIn.createdAt || checkIn.checkedInAt)
      const current = totals.get(day) || { name: day, checkIns: 0 }
      current.checkIns += 1
      totals.set(day, current)
    })

    return Array.from(totals.values()).sort((first, second) => order.indexOf(first.name) - order.indexOf(second.name))
  }, [checkIns])

  // Engagement distribution
  const engagementDistribution = useMemo(() => {
    if (members.length === 0) return []
    return members.map((m) => {
      const metrics = computeAttendanceMetricsForMember(m.id, events, checkIns)
      const score = computeEngagementScore(metrics)
      return { id: m.id, name: m.name, score }
    })
  }, [members, events, checkIns])

  const bins = useMemo(() => {
    const buckets = { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 }
    engagementDistribution.forEach((p) => {
      if (p.score < 50) buckets['0-49']++
      else if (p.score < 70) buckets['50-69']++
      else if (p.score < 85) buckets['70-84']++
      else buckets['85-100']++
    })
    return Object.keys(buckets).map((k, i) => ({ name: k, value: buckets[k], color: COLORS[i % COLORS.length] }))
  }, [engagementDistribution])

  const analyticsSummary = useMemo(() => {
    const totalCheckIns = checkIns.length
    const averageAttendance = events.length ? Math.round((totalCheckIns / events.length) * 10) / 10 : 0
    const topEvent = attendanceByEvent.reduce(
      (best, event) => (event.attendees > best.attendees ? event : best),
      { shortName: 'No events yet', attendees: 0 }
    )
    const activeMembers = members.filter((member) => (member.status || 'active').toLowerCase() === 'active').length

    return [
      { label: 'Total check-ins', value: totalCheckIns },
      { label: 'Average per event', value: averageAttendance },
      { label: 'Top event', value: topEvent.shortName, textValue: true },
      { label: 'Active members', value: activeMembers },
    ]
  }, [attendanceByEvent, checkIns, events, members])

  if (loading) return <div className="page page--loading">Loading analytics…</div>

  return (
    <section className="page analytics-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Chapter Analytics</h1>
          <p className="muted">Attendance trends, event breakdowns, and engagement distribution.</p>
        </div>
      </div>

      <div className="analytics-summary-grid">
        {analyticsSummary.map((item) => (
          <article
            key={item.label}
            className={`card analytics-summary-card ${item.textValue ? 'analytics-summary-card--text' : ''}`}
          >
            <p className="stat-card__label">{item.label}</p>
            <p className="stat-card__value">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid grid--charts">
        <div className="card analytics-card--wide">
          <h3>Attendance by Event</h3>
          {attendanceByEvent.length === 0 ? (
            <div className="empty-state">No event attendance data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceByEvent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortName" interval={0} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="attendees" name="Attendees" fill="#72a0c0" radius={[12, 12, 0, 0]}>
                  {attendanceByEvent.map((entry, idx) => (
                    <Cell key={`event-attendance-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Attendance Rate by Type</h3>
          {attendanceRateByType.length === 0 ? (
            <div className="empty-state">No event type attendance yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceRateByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="attendanceRate" name="Attendance rate" fill="#72a0c0" radius={[12, 12, 0, 0]}>
                  {attendanceRateByType.map((entry, idx) => (
                    <Cell key={`type-rate-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Required vs Optional</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={requiredOptionalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="attendanceRate" name="Attendance rate" fill="#72a0c0" radius={[12, 12, 0, 0]}>
                {requiredOptionalData.map((entry, idx) => (
                  <Cell key={`required-optional-${entry.name}`} fill={idx === 0 ? '#72a0c0' : '#93dff2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card analytics-card--wide">
          <h3>Top Member Engagement</h3>
          {topMembersByEngagement.length === 0 ? (
            <div className="empty-state">No member engagement data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topMembersByEngagement} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="shortName" width={92} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="points" name="Points" fill="#72a0c0" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Class Participation</h3>
          {classParticipationData.length === 0 ? (
            <div className="empty-state">No class participation data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classParticipationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="checkIns" name="Check-ins" fill="#72a0c0" radius={[12, 12, 0, 0]}>
                  {classParticipationData.map((entry, idx) => (
                    <Cell key={`class-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Family Participation</h3>
          {familyParticipationData.length === 0 ? (
            <div className="empty-state">No family participation data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={familyParticipationData} dataKey="checkIns" nameKey="name" cx="50%" cy="50%" outerRadius={72} label>
                  {familyParticipationData.map((entry, idx) => (
                    <Cell key={`family-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Check-ins by Weekday</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekdayCheckInData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="checkIns" name="Check-ins" fill="#72a0c0" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Attendance Over Time</h3>
          {attendanceByDate.length === 0 ? (
            <div className="empty-state">No attendance data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checkIns" stroke="#72a0c0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Event Type Breakdown</h3>
          {eventTypeData.length === 0 ? (
            <div className="empty-state">No events yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={eventTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {eventTypeData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>Engagement Distribution</h3>
          {bins.length === 0 ? (
            <div className="empty-state">No member data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bins}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#72a0c0">
                  {bins.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  )
}

