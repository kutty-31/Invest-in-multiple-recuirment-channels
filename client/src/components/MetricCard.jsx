function MetricCard({ metric }) {
  const icon = {
    applicants: '♙',
    hires: '✓',
    time: '◷',
    cost: '$',
  }[metric.kind]

  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon--${metric.kind}`} aria-hidden="true">{icon}</div>
      <p className="metric-label">{metric.label}</p>
      <strong className="metric-value">{metric.value}</strong>
      <span className="metric-change">{metric.change}</span>
    </article>
  )
}

export default MetricCard
