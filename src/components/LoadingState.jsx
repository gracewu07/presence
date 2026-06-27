function LoadingState({ message = 'Loading...', compact = false }) {
  return (
    <div className={compact ? 'loading-state loading-state--compact' : 'loading-screen'} role="status" aria-live="polite">
      <div className="loading-card">
        <span className="loading-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <p>{message}</p>
      </div>
    </div>
  )
}

export default LoadingState
