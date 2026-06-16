import StatusBadge from '../components/StatusBadge'
import { currentUser } from '../data/mockData'

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
          <p className="profile-card__label">Role</p>
          <p>{currentUser.rank}</p>
        </div>
        <div>
          <p className="profile-card__label">Points</p>
          <p>{currentUser.points}</p>
        </div>
        <div>
          <p className="profile-card__label">Status</p>
          <StatusBadge label="Active" status="active" />
        </div>
        <div>
          <p className="profile-card__label">Location</p>
          <p>{currentUser.location}</p>
        </div>
      </div>
    </section>
  )
}

export default MemberProfile
