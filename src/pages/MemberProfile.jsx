import StatusBadge from '../components/StatusBadge'
import { currentUser } from '../data'

function MemberProfile() {
  return (
    <section className="page profile-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{currentUser.name}</h1>
          <p className="muted">Keep your attendance and excusal info up to date.</p>
        </div>
      </div>

      <div className="card profile-card">
        <div>
          <p className="profile-card__label">Email</p>
          <p>{currentUser.email}</p>
        </div>
        <div>
          <p className="profile-card__label">Role</p>
          <p>{currentUser.role}</p>
        </div>
        <div>
          <p className="profile-card__label">Pledge Class</p>
          <p>{currentUser.pledgeClass}</p>
        </div>
        <div>
          <p className="profile-card__label">Total Points</p>
          <p>{currentUser.totalPoints}</p>
        </div>
        <div>
          <p className="profile-card__label">Status</p>
          <StatusBadge label={currentUser.status} status={currentUser.status} />
        </div>
        <div>
          <p className="profile-card__label">Committee</p>
          <p>{currentUser.committee}</p>
        </div>
        <div>
          <p className="profile-card__label">Attendance Rate</p>
          <p>{Math.round(currentUser.attendanceRate * 100)}%</p>
        </div>
      </div>
    </section>
  )
}

export default MemberProfile
