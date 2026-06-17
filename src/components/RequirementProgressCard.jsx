import CircularProgress from './CircularProgress'

function RequirementProgressCard({
  title,
  completed,
  required,
  progress,
  status,
  note,
  variant = 'chapter',
}) {
  const statusClass = status.toLowerCase().replace(/\s+/g, '-')
  const percent = Math.max(0, Math.min(100, Math.round(progress * 100)))
  const remaining = Math.max(required - completed, 0)
  const remainingText = remaining === 0 ? 'Requirement met' : `${remaining} remaining`

  return (
    <article className={`card requirement-card requirement-card--${variant} event-surface event-surface--${variant}`}>
      <div className="requirement-card__topline">
        <span className={`requirement-status requirement-status--${statusClass}`}>{status}</span>
      </div>

      <div className="requirement-card__heading">
        <h2>{title}</h2>
        {note ? <p className="muted">{note}</p> : null}
      </div>

      <div className="requirement-card__body">
        <CircularProgress value={progress} label={`${title} ${Math.round(progress * 100)}% complete`} />
        <div className="requirement-card__progress-copy">
          <strong>{completed} of {required}</strong>
          <span>completed</span>
          <p>{percent}% complete - {remainingText}</p>
        </div>
      </div>
    </article>
  )
}

export default RequirementProgressCard
