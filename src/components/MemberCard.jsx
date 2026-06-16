import StatusBadge from './StatusBadge'

function MemberCard({ member }) {
  return (
    <article className="card member-card">
      <div>
        <h3>{member.name}</h3>
        <p className="member-card__role">{member.role}</p>
        {member.family && <p className="member-card__role">Family: {member.family}</p>}
      </div>
      <div>
        <p>{member.points} pts</p>
        <StatusBadge label={member.status} status={member.status} />
      </div>
    </article>
  )
}

export default MemberCard
