import { useEffect, useMemo, useState } from 'react'
import { fetchMembers, fetchEvents, fetchCheckIns, fetchUpcomingEvents, fetchExcusalRequests, fetchAppSettings } from '../firebase'
import { computeAttendanceMetricsForMember, computeEngagementScore, engagementCategory, isAtRisk } from '../utils/engagement'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const { currentUser } = useAuth()
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [excusals, setExcusals] = useState([])
  const [settings, setSettings] = useState({ leaderboardVisibility: 'private' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true)
      try {
        const [m, e, c, u, ex, s] = await Promise.all([
          fetchMembers(),
          fetchEvents(),
          fetchCheckIns(),
          fetchUpcomingEvents(),
          fetchExcusalRequests(),
          fetchAppSettings(),
        ])
        setMembers(m)
        setEvents(e)
        setCheckIns(c)
        setUpcoming(u)
        setExcusals(ex)
        setSettings(s[0] || { leaderboardVisibility: 'private' })
      } catch (err) {
        console.error('Failed to load admin data', err)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const totalMembers = members.length
  const totalEvents = events.length
  const totalCheckIns = checkIns.length

  // Average attendance rate across members
  const analytics = useMemo(() => {
    if (members.length === 0) return {}

    const memberMetrics = members.map((m) => {
      const metrics = computeAttendanceMetricsForMember(m.id, events, checkIns)
      const score = computeEngagementScore(metrics)
      const risk = isAtRisk({ ...metrics }, score)
      return { member: m, metrics, score, risk }
    })

    const avgAttendance = memberMetrics.reduce((s, r) => s + (r.metrics.overallRate || 0), 0) / memberMetrics.length || 0
    const atRisk = memberMetrics.filter((m) => m.risk.flagged)

    return { memberMetrics, avgAttendance, atRisk }
  }, [members, events, checkIns])

  const recentCheckIns = useMemo(() => checkIns.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10), [checkIns])

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>VP of Standards</h1>
          <p className="muted">Overview of attendance, engagement, and excusals.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading admin data…</div>
      ) : (
        <>
          <div className="grid grid--stats">
            <div className="stat-card">
              <p className="stat-card__label">Total members</p>
              <p className="stat-card__value">{totalMembers}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Total events</p>
              <p className="stat-card__value">{totalEvents}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Total check-ins</p>
              <p className="stat-card__value">{totalCheckIns}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Average attendance rate</p>
              <p className="stat-card__value">{Math.round((analytics.avgAttendance || 0) * 10) / 10}%</p>
            </div>
          </div>

          <div className="section-block">
            <h2>Members At Risk</h2>
            {analytics.atRisk && analytics.atRisk.length > 0 ? (
              analytics.atRisk.map((r) => (
                <div key={r.member.id} className="card request-card">
                  <div>
                    <h3>{r.member.name}</h3>
                    <p className="muted">{r.member.email}</p>
                    <p className="muted">Attendance: {Math.round(r.metrics.overallRate)}% · Required: {Math.round(r.metrics.requiredRate)}%</p>
                    <p className="muted">Missed required: {r.metrics.missedRequiredCount || 0}</p>
                  </div>
                  <div>
                    <p className="label">Engagement</p>
                    <p>{r.score} · {engagementCategory(r.score)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No members flagged as at risk.</div>
            )}
          </div>

          <div className="grid grid--cards">
            <div className="card">
              <h3>Upcoming events</h3>
              {upcoming.length === 0 ? <div className="empty-state">No upcoming events.</div> : (
                upcoming.slice(0,5).map((e) => (
                  <div key={e.id} className="event-card">
                    <div>
                      <strong>{e.title}</strong>
                      <p className="muted">{e.eventType} · {e.eventDate || e.date}</p>
                    </div>
                    <div className="muted">{e.points} pts</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Recent check-ins</h3>
              {recentCheckIns.length === 0 ? <div className="empty-state">No recent check-ins.</div> : (
                recentCheckIns.map((c) => (
                  <div key={c.id} className="request-card">
                    <div>
                      <p><strong>{c.memberName || c.memberEmail}</strong></p>
                      <p className="muted">Event: {c.eventId}</p>
                      <p className="muted">{new Date(c.createdAt || c.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="muted">{c.pointsAwarded || 0} pts</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Pending excusal requests</h3>
              {excusals.filter((r) => r.status === 'pending').length === 0 ? (
                <div className="empty-state">No pending excusal requests.</div>
              ) : (
                excusals.filter((r) => r.status === 'pending').slice(0,6).map((r) => (
                  <div key={r.id} className="request-card">
                    <div>
                      <h4>{r.memberName}</h4>
                      <p className="muted">{r.eventTitle}</p>
                      <p className="muted">{new Date(r.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="muted">{r.reason?.slice(0,40)}...</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="section-block">
            <h2>Leaderboard Visibility</h2>
            <div className="card">
              <p className="muted">Current: {settings.leaderboardVisibility}</p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminDashboard
