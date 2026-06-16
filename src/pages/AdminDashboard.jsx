import StatCard from '../components/StatCard'
import { adminStats } from '../data/mockData'

function AdminDashboard() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Chapter Operations</h1>
          <p className="muted">Monitor attendance, event activity, and member participation.</p>
        </div>
      </div>

      <div className="grid grid--stats">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

export default AdminDashboard
