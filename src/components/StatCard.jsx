function StatCard({ label, value }) {
  return (
    <div className="stat-card card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  )
}

export default StatCard
