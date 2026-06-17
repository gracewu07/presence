import StatusBadge from './StatusBadge'
import { getGroupClassName } from '../constants/memberGroups'

function MemberCard({ member }) {
  return (
    <article className="card member-card">
      <div>
        <h3>{member.name}</h3>
        <p className="member-card__role">{member.role}</p>
        <div className="member-group-badges">
          {member.pledgeClass && (
            <span className={`member-group-badge member-group-badge--class-${getGroupClassName(member.pledgeClass)}`}>
              {member.pledgeClass}
            </span>
          )}
          {member.family && (
            <span className={`member-group-badge member-group-badge--family-${getGroupClassName(member.family)}`}>
              {member.family}
            </span>
          )}
        </div>
      </div>
      <div>
        <p>{member.points} pts</p>
        <StatusBadge label={member.status} status={member.status} />
      </div>
    </article>
  )
}

export default MemberCard
