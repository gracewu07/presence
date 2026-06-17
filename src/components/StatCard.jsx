import CircularProgress from './CircularProgress'

const icons = {
  chapter: (
    <>
      <path d="M6 4h12v16l-6-3.5L6 20V4Z" />
      <path d="M9 8h6" />
      <path d="M9 11h4" />
    </>
  ),
  service: (
    <>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </>
  ),
  'professional-development': (
    <>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <path d="M4 13h16" />
    </>
  ),
  points: (
    <>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </>
  ),
}

function StatCard({ label, value, progress = null, variant = '' }) {
  const hasProgress = typeof progress === 'number'
  const icon = icons[variant || 'points']

  return (
    <div className={`stat-card card ${hasProgress ? 'stat-card--progress' : ''} ${variant ? `stat-card--${variant}` : ''}`}>
      {icon ? (
        <span className="stat-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">{icon}</svg>
        </span>
      ) : null}
      <div>
        <p className="stat-card__label">{label}</p>
        {!hasProgress ? <p className="stat-card__value">{value}</p> : null}
      </div>
      {hasProgress ? <CircularProgress value={progress} label={`${label} progress`} displayValue={value} /> : null}
    </div>
  )
}

export default StatCard
