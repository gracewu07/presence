import { useState } from 'react'

function CircularProgress({ value = 0, label, displayValue = null }) {
  const [animationKey, setAnimationKey] = useState(0)
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)))
  const replayAnimation = () => setAnimationKey((current) => current + 1)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      replayAnimation()
    }
  }

  return (
    <div
      key={animationKey}
      className="circular-progress"
      style={{ '--progress-percent': `${percent}%` }}
      role="button"
      tabIndex={0}
      aria-label={`${label || `${percent}% complete`}. Replay progress animation.`}
      onClick={replayAnimation}
      onKeyDown={handleKeyDown}
    >
      <div className="circular-progress__inner">
        <span>{displayValue ?? `${percent}%`}</span>
      </div>
    </div>
  )
}

export default CircularProgress
