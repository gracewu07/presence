import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchAppSettings, fetchCheckIns } from '../firebase'

const eventTypes = [
  'All',
  'Chapter',
  'Service',
  'Professional Development',
  'Social',
  'Recruitment',
]

function Leaderboard() {
  const { currentUser } = useAuth()
  const [checkIns, setCheckIns] = useState([])
  const [settings, setSettings] = useState({ leaderboardVisibility: 'private' })
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        const [checkInsSnapshot, settingsSnapshot] = await Promise.all([
          fetchCheckIns(),
          fetchAppSettings(),
        ])

        setCheckIns(checkInsSnapshot)
        setSettings(settingsSnapshot[0] || { leaderboardVisibility: 'private' })
      } catch (fetchError) {
        console.error('Failed to load leaderboard data', fetchError)
        setError('Unable to load leaderboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  const leaderboardVisibility = settings.leaderboardVisibility || 'private'
  const isAdmin = currentUser?.role === 'admin'
  const canViewFullBoard = isAdmin || leaderboardVisibility === 'public'

  const filteredCheckIns = useMemo(() => {
    if (filter === 'All') return checkIns
    return checkIns.filter((checkIn) => checkIn.eventType === filter)
  }, [checkIns, filter])

  const rankedMembers = useMemo(() => {
    const totals = new Map()

    filteredCheckIns.forEach((checkIn) => {
      const memberId = checkIn.memberId
      const existing = totals.get(memberId) || {
        memberId,
        memberName: checkIn.memberName || checkIn.memberEmail || 'Member',
        memberEmail: checkIn.memberEmail,
        totalPoints: 0,
        eventsAttended: 0,
      }

      existing.totalPoints += Number(checkIn.pointsAwarded ?? 0)
      existing.eventsAttended += 1
      totals.set(memberId, existing)
    })

    return Array.from(totals.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || a.memberName.localeCompare(b.memberName))
      .map((member, index) => ({ ...member, rank: index + 1 }))
  }, [filteredCheckIns])

  const currentMemberRank = rankedMembers.find((entry) => entry.memberId === currentUser?.uid)
  const totalRankedMembers = rankedMembers.length

  const displayRows = canViewFullBoard ? rankedMembers : currentMemberRank ? [currentMemberRank] : []

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h1>Member Rankings</h1>
          <p className="muted">Track engagement and chapter participation through points and attendance.</p>
        </div>
      </div>

      <div className="leaderboard-panel">
        <div className="leaderboard-toolbar">
          <label className="form-label">
            Event type filter
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div className="leaderboard-summary">
            <p className="label">Visibility</p>
            <p>{isAdmin ? 'Admin view' : leaderboardVisibility === 'public' ? 'Public' : 'Private'}</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading leaderboard…</div>
        ) : error ? (
          <div className="empty-state error-message">{error}</div>
        ) : (
          <>
            {canViewFullBoard ? (
              <div className="leaderboard-table">
                <div className="leaderboard-row leaderboard-row--header">
                  <div>Rank</div>
                  <div>Name</div>
                  <div>Points</div>
                  <div>Events</div>
                </div>
                {displayRows.length > 0 ? (
                  displayRows.map((member) => (
                    <div key={member.memberId} className="leaderboard-row">
                      <div>{member.rank}</div>
                      <div>{member.memberName}</div>
                      <div>{member.totalPoints}</div>
                      <div>{member.eventsAttended}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No leaderboard data available yet.</div>
                )}
              </div>
            ) : (
              <div className="card leaderboard-card">
                <p className="eyebrow">Private leaderboard</p>
                {currentMemberRank ? (
                  <div className="leaderboard-card__details">
                    <div>
                      <p className="label">Your rank</p>
                      <p>{currentMemberRank.rank}</p>
                    </div>
                    <div>
                      <p className="label">Total points</p>
                      <p>{currentMemberRank.totalPoints}</p>
                    </div>
                    <div>
                      <p className="label">Events attended</p>
                      <p>{currentMemberRank.eventsAttended}</p>
                    </div>
                    <div>
                      <p className="label">Members ranked</p>
                      <p>{totalRankedMembers}</p>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">Attend an event to see your private leaderboard placement.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default Leaderboard
