import MemberCard from '../components/MemberCard'
import { members } from '../data/mockData'

function MemberManagement() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Member Management</p>
          <h1>Chapter Members</h1>
          <p className="muted">View and manage members, roles, and participation status.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}

export default MemberManagement
