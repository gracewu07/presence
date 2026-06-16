import StatCard from '../components/StatCard'

const analyticsMetrics = [
  { label: 'Weekly attendance', value: '84%' },
  { label: 'Average check-in time', value: '9 min' },
  { label: 'Event engagement', value: '72%' },
  { label: 'Excusal approval', value: '91%' },
]

function AnalyticsDashboard() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Engagement Insights</h1>
          <p className="muted">Track chapter activity and member progress from your phone.</p>
        </div>
      </div>

      <div className="grid grid--stats">
        {analyticsMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  )
}

export default AnalyticsDashboard
