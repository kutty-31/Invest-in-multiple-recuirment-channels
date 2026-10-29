import { metrics, stages } from '../data/recruiting'
import ChannelTable from './ChannelTable'
import MetricCard from './MetricCard'

const monthlyApplications = [
  { month: 'May', applications: 40, hires: 22 },
  { month: 'Jun', applications: 56, hires: 30 },
  { month: 'Jul', applications: 46, hires: 24 },
  { month: 'Aug', applications: 70, hires: 43 },
  { month: 'Sep', applications: 63, hires: 36 },
  { month: 'Oct', applications: 91, hires: 55 },
]

function HiringTrend() {
  return (
    <article className="panel trend-panel">
      <div className="panel-heading">
        <div>
          <h2>Hiring over time</h2>
          <p>Applications and successful hires by month</p>
        </div>
        <div className="chart-legend">
          <span><i className="legend-dot legend-dot--applications" /> Applications</span>
          <span><i className="legend-dot legend-dot--hires" /> Hires</span>
        </div>
      </div>
      <div className="chart" role="img" aria-label="Illustrative six-month chart of applications and hires">
        {monthlyApplications.map(({ month, applications, hires }) => (
          <div className="chart-column" key={month}>
            <div className="bar-pair">
              <i className="chart-bar chart-bar--applications" style={{ height: `${applications}%` }} />
              <i className="chart-bar chart-bar--hires" style={{ height: `${hires}%` }} />
            </div>
            <span>{month}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function HiringFunnel() {
  return (
    <article className="panel funnel-panel">
      <div className="panel-heading">
        <div>
          <h2>Hiring funnel</h2>
          <p>From first look to successful hire</p>
        </div>
        <span className="conversion-badge">7.3% conversion</span>
      </div>
      <div className="funnel-list">
        {stages.map((stage) => (
          <div className="funnel-row" key={stage.name}>
            <span>{stage.name}</span>
            <div className="funnel-track"><i style={{ width: stage.width }} /></div>
            <strong>{stage.count}</strong>
          </div>
        ))}
      </div>
      <p className="panel-footnote">Candidate movement in the last 90 days</p>
    </article>
  )
}

function OverviewDashboard() {
  return (
    <>
      <section className="metrics-grid" aria-label="Recruiting summary">
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="overview-grid" aria-label="Hiring analysis">
        <HiringTrend />
        <HiringFunnel />
      </section>

      <section className="panel channel-preview">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">SOURCE PERFORMANCE</p>
            <h2>Which channels bring your best hires?</h2>
            <p>Compare quality, conversion, and cost across your sources.</p>
          </div>
          <span className="table-caption">4 channels tracked</span>
        </div>
        <ChannelTable />
      </section>
    </>
  )
}

export default OverviewDashboard
