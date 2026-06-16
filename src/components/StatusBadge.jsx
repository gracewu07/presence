function StatusBadge({ label, status }) {
  return <span className={`status-badge status-badge--${status}`}>{label}</span>
}

export default StatusBadge
