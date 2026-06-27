import { useEffect, useMemo, useState } from 'react'
import LoadingState from '../components/LoadingState'
import { fetchMembers, fetchEvents, fetchCheckIns, subscribeToCheckIns } from '../firebase'
import { computeAttendanceMetricsForMember, computeEngagementScore } from '../utils/engagement'

const COLORS = ['#72a0c0', '#ead06b', '#d48f5e', '#9297cc', '#6fb7a3']
const EMPTY_CHART_DATA = [{ name: 'No data', shortName: 'No data', value: 0, checkIns: 0, attendees: 0, attendanceRate: 0, points: 0 }]

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

const normalizeEventType = (eventType = '') => eventType.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')

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

function SimpleBarChart({ data, labelKey = 'name', valueKey, valueSuffix = '', valueFormatter }) {
  const chartData = data.length ? data : EMPTY_CHART_DATA
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey] || 0)), 1)

  return (
    <div className="analytics-simple-chart">
      {chartData.map((item, index) => {
        const value = Number(item[valueKey] || 0)
        const width = value > 0 ? Math.max((value / maxValue) * 100, 6) : 0
        const displayValue = valueFormatter ? valueFormatter(value, item) : `${value}${valueSuffix}`

        return (
          <div key={`${item[labelKey] || item.name}-${index}`} className="analytics-simple-chart__row">
            <div className="analytics-simple-chart__topline">
              <span>{item[labelKey] || item.name}</span>
              <strong>{displayValue}</strong>
            </div>
            <div className="analytics-simple-chart__track" aria-hidden="true">
              <div className="analytics-simple-chart__bar" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VerticalBarChart({ data, labelKey = 'name', valueKey, valueSuffix = '', valueFormatter }) {
  const chartData = data.length ? data : EMPTY_CHART_DATA
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey] || 0)), 1)

  return (
    <div className="analytics-column-chart">
      {chartData.map((item, index) => {
        const value = Number(item[valueKey] || 0)
        const height = value > 0 ? Math.max((value / maxValue) * 100, 10) : 3
        const displayValue = valueFormatter ? valueFormatter(value, item) : `${value}${valueSuffix}`

        return (
          <div key={`${item[labelKey] || item.name}-${index}`} className="analytics-column-chart__item">
            <strong className="analytics-column-chart__value">{displayValue}</strong>
            <div className="analytics-column-chart__track" aria-hidden="true">
              <div
                className="analytics-column-chart__bar"
                style={{
                  height: `${height}%`,
                  background: item.color || COLORS[index % COLORS.length],
                }}
              />
            </div>
            <span className="analytics-column-chart__label">{item[labelKey] || item.name}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ data, labelKey = 'name', valueKey = 'value' }) {
  const chartData = data.length ? data : EMPTY_CHART_DATA
  const total = chartData.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0)
  let start = 0
  const gradient = total
    ? chartData
        .map((item, index) => {
          const value = Number(item[valueKey] || 0)
          const end = start + (value / total) * 360
          const segment = `${item.color || COLORS[index % COLORS.length]} ${start}deg ${end}deg`
          start = end
          return segment
        })
        .join(', ')
    : '#e6eef5 0deg 360deg'

  return (
    <div className="analytics-donut-chart">
      <div className="analytics-donut-chart__ring" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="analytics-donut-chart__center">
          <strong>{total}</strong>
          <span>total</span>
        </div>
      </div>
      <div className="analytics-donut-chart__legend">
        {chartData.map((item, index) => (
          <div key={`${item[labelKey] || item.name}-${index}`} className="analytics-donut-chart__legend-item">
            <span style={{ background: item.color || COLORS[index % COLORS.length] }} />
            <p>{item[labelKey] || item.name}</p>
            <strong>{Number(item[valueKey] || 0)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineTrendChart({ data, labelKey = 'date', valueKey = 'checkIns' }) {
  const chartData = data.length ? data : EMPTY_CHART_DATA
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey] || 0)), 1)
  const points = chartData.map((item, index) => {
    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100
    const y = 88 - (Number(item[valueKey] || 0) / maxValue) * 72
    return { x, y, item }
  })
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="analytics-line-chart">
      <svg className="analytics-line-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
        <polyline points={pointString} fill="none" stroke="#72a0c0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <circle key={`${point.item[labelKey] || index}-${index}`} cx={point.x} cy={point.y} r="2.6" fill="#13294b" />
        ))}
      </svg>
      <div className="analytics-line-chart__labels">
        {chartData.map((item, index) => (
          <span key={`${item[labelKey] || index}-${index}`}>
            {item[labelKey] || item.name}
            <strong>{Number(item[valueKey] || 0)}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribeCheckIns = null

    async function load() {
      setLoading(true)
      try {
        const [m, e, c] = await Promise.all([fetchMembers(), fetchEvents(), fetchCheckIns()])
        if (!isMounted) return
        setMembers(m)
        setEvents(e)
        setCheckIns(c)
        unsubscribeCheckIns = subscribeToCheckIns(
          (liveCheckIns) => {
            if (isMounted) setCheckIns(liveCheckIns)
          },
          (snapshotError) => console.error('Failed to subscribe to analytics check-ins', snapshotError)
        )
      } catch (err) {
        console.error('Failed to load analytics data', err)
        if (!isMounted) return
        setMembers([])
        setEvents([])
        setCheckIns([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
      if (unsubscribeCheckIns) unsubscribeCheckIns()
    }
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
    const topEvents = attendanceByEvent
      .filter((event) => normalizeEventType(event.type) !== 'chapter')
      .sort((first, second) => second.attendees - first.attendees || first.shortName.localeCompare(second.shortName))
      .slice(0, 3)
    const topEventFallback = topEvents.reduce(
      (best, event) => (event.attendees > best.attendees ? event : best),
      { shortName: 'No non-chapter events yet', attendees: 0 }
    )
    const activeMembers = members.filter((member) => (member.status || 'active').toLowerCase() === 'active').length

    return [
      { label: 'Total check-ins', value: totalCheckIns },
      { label: 'Avg check-ins per event', value: averageAttendance },
      { label: 'Top events', value: topEvents.length ? topEvents.map((event) => event.shortName).join(', ') : topEventFallback.shortName, textValue: true },
      { label: 'Active members', value: activeMembers },
    ]
  }, [attendanceByEvent, checkIns, events, members])

  if (loading) return <LoadingState message="Loading analytics..." />

  const renderEmptyChartNote = (message) => <p className="analytics-empty-chart-note">{message}</p>

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
          {attendanceByEvent.length === 0 && renderEmptyChartNote('No event attendance data yet.')}
          <VerticalBarChart data={attendanceByEvent} labelKey="shortName" valueKey="attendees" />
        </div>

        <div className="card">
          <h3>Attendance Rate by Type</h3>
          {attendanceRateByType.length === 0 && renderEmptyChartNote('No event type attendance yet.')}
          <VerticalBarChart data={attendanceRateByType} valueKey="attendanceRate" valueSuffix="%" />
        </div>

        <div className="card">
          <h3>Required vs Optional</h3>
          <VerticalBarChart data={requiredOptionalData} valueKey="attendanceRate" valueSuffix="%" />
        </div>

        <div className="card analytics-card--wide">
          <h3>Top Member Engagement</h3>
          {topMembersByEngagement.length === 0 && renderEmptyChartNote('No member engagement data yet.')}
          <SimpleBarChart data={topMembersByEngagement} labelKey="shortName" valueKey="points" />
        </div>

        <div className="card">
          <h3>Class Participation</h3>
          {classParticipationData.length === 0 && renderEmptyChartNote('No class participation data yet.')}
          <VerticalBarChart data={classParticipationData} valueKey="checkIns" />
        </div>

        <div className="card">
          <h3>Family Participation</h3>
          {familyParticipationData.length === 0 && renderEmptyChartNote('No family participation data yet.')}
          <DonutChart data={familyParticipationData} valueKey="checkIns" />
        </div>

        <div className="card">
          <h3>Check-ins by Weekday</h3>
          <VerticalBarChart data={weekdayCheckInData} valueKey="checkIns" />
        </div>

        <div className="card">
          <h3>Attendance Over Time</h3>
          {attendanceByDate.length === 0 && renderEmptyChartNote('No attendance data yet.')}
          <LineTrendChart data={attendanceByDate} labelKey="date" valueKey="checkIns" />
        </div>

        <div className="card">
          <h3>Event Type Breakdown</h3>
          {eventTypeData.length === 0 && renderEmptyChartNote('No check-in types yet.')}
          <DonutChart data={eventTypeData} valueKey="value" />
        </div>

        <div className="card">
          <h3>Engagement Distribution</h3>
          <p className="analytics-chart-description">
            Members grouped by engagement score, based on attendance, required events, recent activity, and event variety.
          </p>
          {bins.every((bucket) => bucket.value === 0) && renderEmptyChartNote('No member engagement data yet.')}
          <VerticalBarChart data={bins} valueKey="value" />
        </div>
      </div>
    </section>
  )
}

