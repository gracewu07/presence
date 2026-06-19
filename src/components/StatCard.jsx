import CircularProgress from './CircularProgress'

function StatCard({ label, value, progress = null, variant = '' }) {
  const hasProgress = typeof progress === 'number'

  return (
    <div className={`stat-card card ${hasProgress ? 'stat-card--progress' : ''} ${variant ? `stat-card--${variant}` : ''}`}>
      <div>
        <p className="stat-card__label">{label}</p>
        {!hasProgress ? <p className="stat-card__value">{value}</p> : null}
      </div>
      {hasProgress ? <CircularProgress value={progress} label={`${label} progress`} displayValue={value} /> : null}
    </div>
  )
}

export default StatCard
