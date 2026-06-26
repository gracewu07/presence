import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import {
  fetchMembers,
  fetchEvents,
  fetchCheckIns,
  fetchExcusalRequests,
  recordExcusedChapterCheckIn,
  updateExcusalStatus,
} from '../firebase'
import { computeAttendanceMetricsForMember, computeRequirementRiskForMember } from '../utils/engagement'
import { canReviewExcusals } from '../utils/permissions'

const formatDate = (value) => {
  if (!value) return 'Not submitted yet'
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not submitted yet'
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
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
      const request = excusals.find((excusal) => excusal.id === requestId)
      await updateExcusalStatus(requestId, status, status === 'approved' ? 'Approved by Standards' : 'Denied by Standards')
      if (status === 'approved' && request) {
        await recordExcusedChapterCheckIn(request)
      }
      const [updatedRequests, updatedCheckIns] = await Promise.all([fetchExcusalRequests(), fetchCheckIns()])
      setExcusals(updatedRequests)
      setCheckIns(updatedCheckIns)
      setReviewMessage({
        type: 'success',
        text: status === 'approved'
          ? 'Excusal approved. Chapter event excusals now count as check-ins.'
          : 'Excusal denied.',
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
      const risk = computeRequirementRiskForMember(member, events, checkIns)
      return { member, metrics, risk }
    })

    const avgAttendance = memberMetrics.reduce((sum, row) => sum + (row.metrics.overallRate || 0), 0) / memberMetrics.length || 0
    const atRisk = memberMetrics.filter((row) => row.risk.flagged)

    return { memberMetrics, avgAttendance, atRisk }
  }, [members, events, checkIns])

  const pendingExcusals = excusals.filter((request) => request.status === 'pending')
  const reviewedExcusals = excusals.filter((request) => ['approved', 'denied'].includes(request.status))
  const missedRequired = analytics.memberMetrics.reduce((sum, row) => sum + (row.risk.requiredChapter.missed || 0), 0)

  return (
    <section className="page standards-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">VP of Standards</p>
          <h1>Standards Dashboard</h1>
          <p className="muted">Requirement progress, required-event misses, and excusal review.</p>
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
            <p className="muted standards-risk-explainer">
              At risk means a member is behind on attendance requirements based on events that have already happened:
              required Chapter events, 2 Service events, and 3 Professional Development events.
            </p>
            {analytics.atRisk.length > 0 ? (
              <div className="standards-risk-list">
                {analytics.atRisk.map((row) => (
                  <div key={row.member.id} className="card request-card standards-risk-card">
                    <div className="standards-risk-card__identity">
                      <h3>{row.member.name}</h3>
                      <p className="muted">{row.member.email}</p>
                    </div>
                    <div className="standards-risk-card__metrics">
                      <div>
                        <span>Required Chapter</span>
                        <strong>{row.risk.requiredChapter.attended}/{row.risk.requiredChapter.expected}</strong>
                      </div>
                      <div>
                        <span>Service</span>
                        <strong>{row.risk.service.attended}/{row.risk.service.required}</strong>
                      </div>
                      <div>
                        <span>Professional Dev</span>
                        <strong>{row.risk.professionalDevelopment.attended}/{row.risk.professionalDevelopment.required}</strong>
                      </div>
                      <div>
                        <span>Why flagged</span>
                        <strong>{row.risk.reasons.length}</strong>
                        <em>{row.risk.reasons.join('; ')}</em>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No members flagged as at risk.</div>
            )}
          </div>

          <div className="section-block">
            <h2>{canReview ? 'Review Excusal Requests' : 'Excusal Requests'}</h2>
            {reviewMessage && (
              <p className={reviewMessage.type === 'error' ? 'form-error' : 'form-success'}>{reviewMessage.text}</p>
            )}
            <div className="standards-excusal-review-list">
              {pendingExcusals.length === 0 ? (
                <div className="empty-state">No pending excusal requests.</div>
              ) : (
                pendingExcusals.map((request) => (
                  <div key={request.id} className="card request-card excusal-request-card standards-excusal-card excusal-request-card--pending">
                    <div className="excusal-request-card__content">
                      <div className="excusal-request-card__topline">
                        <div>
                          <h3>{request.memberName || request.memberEmail || 'Member'}</h3>
                          <p className="standards-excusal-card__event">{request.eventTitle || 'Event not listed'}</p>
                        </div>
                        <StatusBadge label={request.status || 'pending'} status={request.status || 'pending'} />
                      </div>
                      <div className="excusal-request-card__details">
                        <p><span>Submitted</span>{formatDate(request.submittedAt)}</p>
                        <p><span>Reason</span>{request.reason}</p>
                        {request.attachment?.name && <p><span>Attachment</span>{request.attachment.name}</p>}
                      </div>
                    </div>
                    {canReview && (
                      <div className="excusal-actions">
                        <Button type="button" onClick={() => reviewExcusal(request.id, 'approved')} disabled={reviewingRequestId === request.id}>
                          Approve
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => reviewExcusal(request.id, 'denied')} disabled={reviewingRequestId === request.id}>
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {canReview && (
            <div className="section-block">
              <h2>Past Excusal Decisions</h2>
              <div className="standards-excusal-review-list">
                {reviewedExcusals.length === 0 ? (
                  <div className="empty-state">No approved or denied excusal requests yet.</div>
                ) : (
                  reviewedExcusals.map((request) => (
                    <div
                      key={request.id}
                      className={`card request-card excusal-request-card standards-excusal-card excusal-request-card--${request.status}`}
                    >
                      <div className="excusal-request-card__content">
                        <div className="excusal-request-card__topline">
                          <div>
                            <h3>{request.memberName || request.memberEmail || 'Member'}</h3>
                            <p className="standards-excusal-card__event">{request.eventTitle || 'Event not listed'}</p>
                          </div>
                          <StatusBadge label={request.status || 'pending'} status={request.status || 'pending'} />
                        </div>
                        <div className="excusal-request-card__details">
                          <p><span>Submitted</span>{formatDate(request.submittedAt)}</p>
                          <p><span>Reviewed</span>{formatDate(request.reviewedAt)}</p>
                          <p><span>Reason</span>{request.reason}</p>
                          {request.attachment?.name && <p><span>Attachment</span>{request.attachment.name}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default StandardsDashboard
