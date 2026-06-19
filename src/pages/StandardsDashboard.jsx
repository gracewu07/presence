import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { fetchMembers, fetchEvents, fetchCheckIns, fetchExcusalRequests, updateExcusalStatus } from '../firebase'
import { computeAttendanceMetricsForMember, computeEngagementScore, engagementCategory, isAtRisk } from '../utils/engagement'
import { canReviewExcusals } from '../utils/permissions'

const formatDate = (value) => {
  if (!value) return 'Not submitted yet'
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not submitted yet' : date.toLocaleString()
}

function StandardsDashboard() {
  const { currentUser } = useAuth()
  const canReview = canReviewExcusals(currentUser)
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [excusals, setExcusals] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewingRequestId, setReviewingRequestId] = useState(null)
  const [reviewMessage, setReviewMessage] = useState(null)

  useEffect(() => {
    async function loadStandardsData() {
      setLoading(true)
      try {
        const [memberSnapshot, eventSnapshot, checkInSnapshot, excusalSnapshot] = await Promise.all([
          fetchMembers(),
          fetchEvents(),
          fetchCheckIns(),
          fetchExcusalRequests(),
        ])
        setMembers(memberSnapshot)
        setEvents(eventSnapshot)
        setCheckIns(checkInSnapshot)
        setExcusals(excusalSnapshot)
      } catch (err) {
        console.error('Failed to load standards data', err)
      } finally {
        setLoading(false)
      }
    }

    loadStandardsData()
  }, [])

  async function reviewExcusal(requestId, status) {
    if (!canReview) return

    setReviewingRequestId(requestId)
    setReviewMessage(null)

    try {
      await updateExcusalStatus(requestId, status, status === 'approved' ? 'Approved by Standards' : 'Denied by Standards')
      const updatedRequests = await fetchExcusalRequests()
      setExcusals(updatedRequests)
      setReviewMessage({
        type: 'success',
        text: `Excusal ${status}.`,
      })
    } catch (err) {
      console.error('Failed to update excusal request', err)
      setReviewMessage({ type: 'error', text: 'Unable to update excusal request.' })
    } finally {
      setReviewingRequestId(null)
    }
  }

  const analytics = useMemo(() => {
    if (members.length === 0) return { memberMetrics: [], atRisk: [], avgAttendance: 0 }

    const memberMetrics = members.map((member) => {
      const metrics = computeAttendanceMetricsForMember(member.id, events, checkIns)
      const score = computeEngagementScore(metrics)
      const risk = isAtRisk({ ...metrics }, score)
      return { member, metrics, score, risk }
    })

    const avgAttendance = memberMetrics.reduce((sum, row) => sum + (row.metrics.overallRate || 0), 0) / memberMetrics.length || 0
    const atRisk = memberMetrics.filter((row) => row.risk.flagged)

    return { memberMetrics, avgAttendance, atRisk }
  }, [members, events, checkIns])

  const pendingExcusals = excusals.filter((request) => request.status === 'pending')
  const missedRequired = analytics.memberMetrics.reduce((sum, row) => sum + (row.metrics.missedRequiredCount || 0), 0)

  return (
    <section className="page standards-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">VP of Standards</p>
          <h1>Standards Dashboard</h1>
          <p className="muted">Attendance risk, required-event misses, and excusal review.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading standards data...</div>
      ) : (
        <>
          <div className="grid grid--stats">
            <div className="stat-card">
              <p className="stat-card__label">Members at risk</p>
              <p className="stat-card__value">{analytics.atRisk.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Pending excusals</p>
              <p className="stat-card__value">{pendingExcusals.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Missed required</p>
              <p className="stat-card__value">{missedRequired}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Average attendance</p>
              <p className="stat-card__value">{Math.round((analytics.avgAttendance || 0) * 10) / 10}%</p>
            </div>
          </div>

          <div className="section-block">
            <h2>Members At Risk</h2>
            {analytics.atRisk.length > 0 ? (
              analytics.atRisk.map((row) => (
                <div key={row.member.id} className="card request-card">
                  <div>
                    <h3>{row.member.name}</h3>
                    <p className="muted">{row.member.email}</p>
                    <p className="muted">Attendance: {Math.round(row.metrics.overallRate)}% · Required: {Math.round(row.metrics.requiredRate)}%</p>
                    <p className="muted">Missed required: {row.metrics.missedRequiredCount || 0}</p>
                  </div>
                  <div>
                    <p className="label">Engagement</p>
                    <p>{row.score} · {engagementCategory(row.score)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No members flagged as at risk.</div>
            )}
          </div>

          <div className="section-block">
            <h2>{canReview ? 'Review Excusal Requests' : 'Excusal Requests'}</h2>
            {reviewMessage && (
              <p className={reviewMessage.type === 'error' ? 'form-error' : 'form-success'}>{reviewMessage.text}</p>
            )}
            <div className="grid grid--cards">
              {pendingExcusals.length === 0 ? (
                <div className="empty-state">No pending excusal requests.</div>
              ) : (
                pendingExcusals.map((request) => (
                  <div key={request.id} className="card request-card excusal-request-card excusal-request-card--pending">
                    <div>
                      <div className="excusal-request-card__topline">
                        <h3>{request.memberName}</h3>
                        <StatusBadge label={request.status || 'pending'} status={request.status || 'pending'} />
                      </div>
                      <p className="muted">{request.eventTitle}</p>
                      <div className="excusal-request-card__details">
                        <p><span>Submitted</span>{formatDate(request.submittedAt)}</p>
                        <p><span>Reason</span>{request.reason}</p>
                        {request.attachment?.name && <p><span>Attachment</span>{request.attachment.name}</p>}
                      </div>
                    </div>
                    {canReview && (
                      <div className="excusal-actions">
                        <Button
                          type="button"
                          onClick={() => reviewExcusal(request.id, 'approved')}
                          disabled={reviewingRequestId === request.id}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => reviewExcusal(request.id, 'denied')}
                          disabled={reviewingRequestId === request.id}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default StandardsDashboard
