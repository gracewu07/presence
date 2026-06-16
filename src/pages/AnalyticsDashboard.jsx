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
import { computeAttendanceMetricsForMember, computeEngagementScore } from '../utils/engagement'

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

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
        setMembers(m)
        setEvents(e)
        setCheckIns(c)
      } catch (err) {
        console.error('Failed to load analytics data', err)
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
      const date = ev?.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'Unknown'
      counts[date] = (counts[date] || 0) + 1
    })
    return Object.keys(counts)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((k) => ({ date: k, checkIns: counts[k] }))
  }, [events, checkIns])

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

  if (loading) return <div className="page page--loading">Loading analytics…</div>

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Chapter Analytics</h1>
          <p className="muted">Attendance trends, event breakdowns, and engagement distribution.</p>
        </div>
      </div>

      <div className="grid grid--charts">
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
                <Line type="monotone" dataKey="checkIns" stroke="#4f46e5" strokeWidth={2} />
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
                <Bar dataKey="value" fill="#06b6d4">
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
import StatCard from '../components/StatCard'

const analyticsMetrics = [
  { label: 'Weekly attendance', value: '84%' },
  { label: 'Average check-in time', value: '9 min' },
  { label: 'Event engagement', value: '72%' },
  { label: 'Excusal approval', value: '91%' },
]

function AnalyticsDashboard() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Engagement Insights</h1>
          <p className="muted">Track chapter activity and member progress from your phone.</p>
        </div>
      </div>

      <div className="grid grid--stats">
        {analyticsMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  )
}

export default AnalyticsDashboard
