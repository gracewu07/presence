import MemberCard from '../components/MemberCard'
import { members } from '../data'

function Leaderboard() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h1>Member Rankings</h1>
          <p className="muted">Track engagement and point leaders across the chapter.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {members
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 5)
          .map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
      </div>
    </section>
  )
}

export default Leaderboard
