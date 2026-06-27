import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import { fetchAppSettings, fetchCheckIns, updateLeaderboardVisibility } from '../firebase'
import { getMemberDisplayName } from '../utils/memberDisplay'
import { canEditLeaderboardVisibility, canViewFullLeaderboard } from '../utils/permissions'

function Leaderboard() {
  const { currentUser } = useAuth()
  const currentMemberId = currentUser?.email?.trim().toLowerCase() || currentUser?.uid
  const [checkIns, setCheckIns] = useState([])
  const [settings, setSettings] = useState({ leaderboardVisibility: 'private' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [visibilityMessage, setVisibilityMessage] = useState(null)

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
        setCheckIns([])
        setSettings({ leaderboardVisibility: 'private' })
        setError('Unable to load leaderboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  const leaderboardVisibility = settings.leaderboardVisibility || 'private'
  const hasFullLeaderboardAccess = canViewFullLeaderboard(currentUser)
  const canEditVisibility = canEditLeaderboardVisibility(currentUser)
  const canViewFullBoard = hasFullLeaderboardAccess || leaderboardVisibility === 'public'
  const currentMemberDisplayName = getMemberDisplayName(currentUser)
  const getMemberInitial = (name) => name?.charAt(0)?.toUpperCase() || 'M'

  const handleVisibilityChange = (event) => {
    setVisibilityMessage(null)
    setSettings((current) => ({ ...current, leaderboardVisibility: event.target.value }))
  }

  const saveLeaderboardVisibility = async () => {
    if (!canEditVisibility) return

    setSavingVisibility(true)
    setVisibilityMessage(null)

    try {
      await updateLeaderboardVisibility(leaderboardVisibility)
      setVisibilityMessage({ type: 'success', text: 'Leaderboard visibility saved.' })
    } catch (saveError) {
      console.error('Failed to save leaderboard visibility', saveError)
      setVisibilityMessage({ type: 'error', text: 'Unable to save leaderboard visibility.' })
    } finally {
      setSavingVisibility(false)
    }
  }

  const rankedMembers = useMemo(() => {
    const totals = new Map()

    checkIns.forEach((checkIn) => {
      const memberId = checkIn.memberId
      const isCurrentMember = memberId === currentMemberId
      const existing = totals.get(memberId) || {
        memberId,
        memberName: isCurrentMember ? currentMemberDisplayName : checkIn.memberName || checkIn.memberEmail || 'Member',
        memberEmail: checkIn.memberEmail,
        memberPhotoUrl: checkIn.memberPhotoUrl || (memberId === currentMemberId ? currentUser?.photoUrl : ''),
        totalPoints: 0,
      }

      if (isCurrentMember) {
        existing.memberName = currentMemberDisplayName
      }
      if (isCurrentMember && currentUser?.photoUrl) {
        existing.memberPhotoUrl = currentUser.photoUrl
      }
      existing.totalPoints += Number(checkIn.pointsAwarded ?? 0)
      totals.set(memberId, existing)
    })

    return Array.from(totals.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || a.memberName.localeCompare(b.memberName))
      .map((member, index) => ({ ...member, rank: index + 1 }))
  }, [checkIns, currentMemberDisplayName, currentMemberId, currentUser])

  const currentMemberRank = rankedMembers.find((entry) => entry.memberId === currentMemberId)
  const totalRankedMembers = rankedMembers.length

  const displayRows = canViewFullBoard ? rankedMembers : currentMemberRank ? [currentMemberRank] : []

  return (
    <section className="page leaderboard-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h1>Member Rankings</h1>
          <p className="muted">Track engagement and chapter participation through points and attendance.</p>
        </div>
      </div>

      <div className="leaderboard-panel">
        {loading ? (
          <LoadingState message="Loading leaderboard..." compact />
        ) : error ? (
          <div className="empty-state error-message">{error}</div>
        ) : (
          <>
            {hasFullLeaderboardAccess && (
              <div className="leaderboard-admin-card">
                <div>
                  <p className="eyebrow">Admin visibility</p>
                  <h2>Member access</h2>
                  <p className="muted">
                    {canEditVisibility
                      ? 'Admins can always see the full leaderboard. Choose whether members can see everyone or only their own standing.'
                      : 'Admins can always see the full leaderboard.'}
                  </p>
                </div>
                {canEditVisibility ? (
                  <div className="leaderboard-admin-controls">
                    <label className="leaderboard-admin-select">
                      <span>Leaderboard visibility</span>
                      <select value={leaderboardVisibility} onChange={handleVisibilityChange}>
                        <option value="public">Visible to members</option>
                        <option value="private">Private to admins</option>
                      </select>
                    </label>
                    <Button type="button" variant="secondary" onClick={saveLeaderboardVisibility} disabled={savingVisibility}>
                      {savingVisibility ? 'Saving...' : 'Save visibility'}
                    </Button>
                  </div>
                ) : (
                  <div className="leaderboard-admin-controls">
                    <div className="leaderboard-admin-select leaderboard-admin-select--readonly">
                      <span>Leaderboard visibility</span>
                      <strong>{leaderboardVisibility === 'public' ? 'Visible to members' : 'Private to admins'}</strong>
                    </div>
                  </div>
                )}
                {visibilityMessage && (
                  <p className={`leaderboard-visibility-message ${visibilityMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
                    {visibilityMessage.text}
                  </p>
                )}
              </div>
            )}

            {canViewFullBoard ? (
              <>
                {currentMemberRank && (
                  <article className="leaderboard-spotlight">
                    <div className="leaderboard-avatar leaderboard-avatar--large" aria-hidden="true">
                      {currentMemberRank.memberPhotoUrl ? (
                        <img src={currentMemberRank.memberPhotoUrl} alt="" />
                      ) : (
                        <span>{getMemberInitial(currentMemberRank.memberName)}</span>
                      )}
                    </div>
                    <div className="leaderboard-spotlight__chips">
                      <span>#{currentMemberRank.rank}</span>
                      <strong>{currentMemberRank.memberName}</strong>
                    </div>
                  </article>
                )}

                <div className="leaderboard-table">
                  <div className="leaderboard-row leaderboard-row--header">
                    <div>Rank</div>
                    <div>Name</div>
                    <div>Points</div>
                  </div>
                  {displayRows.length > 0 ? (
                    displayRows.map((member) => (
                      <div
                        key={member.memberId}
                        className={`leaderboard-row ${member.memberId === currentMemberId ? 'leaderboard-row--current' : ''}`}
                      >
                      <div className="leaderboard-rank-cell"><span className="leaderboard-rank">#{member.rank}</span></div>
                      <div className="leaderboard-person-cell">
                        <span className="leaderboard-avatar" aria-hidden="true">
                          {member.memberPhotoUrl ? (
                            <img src={member.memberPhotoUrl} alt="" />
                          ) : (
                            <span>{getMemberInitial(member.memberName)}</span>
                          )}
                        </span>
                        <span>
                          <span className="leaderboard-member-name">{member.memberName}</span>
                        </span>
                      </div>
                        <div className="leaderboard-stat-cell">
                          <strong>{member.totalPoints}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No leaderboard data available yet.</div>
                  )}
                </div>
              </>
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
