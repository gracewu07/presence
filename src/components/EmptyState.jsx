function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📭</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export default EmptyState
