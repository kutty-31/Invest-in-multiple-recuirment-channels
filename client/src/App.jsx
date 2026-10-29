import { useState } from 'react'
import './App.css'

const navigation = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'channels', label: 'Channels', icon: '▥' },
  { id: 'candidates', label: 'Candidates', icon: '♙' },
]

const channelRows = [
  { name: 'Employee referral', applicants: 38, hires: 7, rate: '18.4%', quality: '4.8', cost: '$1,420', signal: 'Best quality' },
  { name: 'LinkedIn', applicants: 82, hires: 5, rate: '6.1%', quality: '4.3', cost: '$2,960', signal: 'High volume' },
  { name: 'Careers page', applicants: 47, hires: 3, rate: '6.4%', quality: '4.5', cost: '$1,180', signal: 'Low cost' },
  { name: 'Indeed', applicants: 55, hires: 2, rate: '3.6%', quality: '3.9', cost: '$2,050', signal: 'Optimize' },
]

const candidateRows = [
  { name: 'Olivia Chen', role: 'Product Designer', source: 'LinkedIn', stage: 'Interview', quality: '5.0', applied: '2 days ago' },
  { name: 'Noah Williams', role: 'Backend Engineer', source: 'Employee referral', stage: 'Hired', quality: '5.0', applied: '5 days ago' },
  { name: 'Amara Okafor', role: 'Product Manager', source: 'Careers page', stage: 'Screening', quality: '4.0', applied: '8 days ago' },
  { name: 'Ethan Patel', role: 'Data Analyst', source: 'Indeed', stage: 'Applied', quality: '3.0', applied: '10 days ago' },
]

const metrics = [
  { label: 'Total applicants', value: '248', change: '↑ 12% vs. prior period', kind: 'applicants' },
  { label: 'Successful hires', value: '18', change: '↑ 3 hires vs. prior period', kind: 'hires' },
  { label: 'Avg. time to hire', value: '31 days', change: '↓ 4 days faster', kind: 'time' },
  { label: 'Cost per hire', value: '$2.4k', change: '↓ 8% vs. prior period', kind: 'cost' },
]

const stages = [
  { name: 'Applied', count: 248, width: '100%' },
  { name: 'Screening', count: 179, width: '72%' },
  { name: 'Interview', count: 107, width: '43%' },
  { name: 'Hired', count: 18, width: '19%' },
]

function qualityStars(score) {
  const filled = Math.round(Number(score))
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`
}

function MetricCard({ metric }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon--${metric.kind}`} aria-hidden="true">
        {metric.kind === 'cost' ? '$' : metric.kind === 'time' ? '◷' : metric.kind === 'hires' ? '✓' : '♙'}
      </div>
      <p className="metric-label">{metric.label}</p>
      <strong className="metric-value">{metric.value}</strong>
      <span className="metric-change">{metric.change}</span>
    </article>
  )
}

function ChannelTable() {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Recruiting channel</th>
            <th scope="col">Applicants</th>
            <th scope="col">Hires</th>
            <th scope="col">Hire rate</th>
            <th scope="col">Avg. quality</th>
            <th scope="col">Cost per hire</th>
            <th scope="col">Signal</th>
          </tr>
        </thead>
        <tbody>
          {channelRows.map((channel) => (
            <tr key={channel.name}>
              <td className="cell-strong">{channel.name}</td>
              <td>{channel.applicants}</td>
              <td>{channel.hires}</td>
              <td className="rate-value">{channel.rate}</td>
              <td><span className="stars" aria-label={`${channel.quality} out of 5`}>{qualityStars(channel.quality)}</span> {channel.quality}</td>
              <td>{channel.cost}</td>
              <td><span className="signal-pill">{channel.signal}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CandidateTable({ search }) {
  const query = search.trim().toLowerCase()
  const filteredCandidates = candidateRows.filter((candidate) =>
    [candidate.name, candidate.role, candidate.source, candidate.stage]
      .some((value) => value.toLowerCase().includes(query)),
  )

  return (
    <div className="table-scroll">
      <table className="data-table candidate-table">
        <thead>
          <tr>
            <th scope="col">Candidate</th>
            <th scope="col">Role</th>
            <th scope="col">Source</th>
            <th scope="col">Stage</th>
            <th scope="col">Quality</th>
            <th scope="col">Applied</th>
          </tr>
        </thead>
        <tbody>
          {filteredCandidates.map((candidate) => (
            <tr key={candidate.name}>
              <td className="cell-strong">{candidate.name}</td>
              <td>{candidate.role}</td>
              <td>{candidate.source}</td>
              <td><span className={`stage-pill stage-pill--${candidate.stage.toLowerCase()}`}>{candidate.stage}</span></td>
              <td><span className="stars" aria-label={`${candidate.quality} out of 5`}>{qualityStars(candidate.quality)}</span> {candidate.quality}</td>
              <td>{candidate.applied}</td>
            </tr>
          ))}
          {filteredCandidates.length === 0 && (
            <tr><td className="empty-state" colSpan="6">No candidates match “{search}”.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Overview() {
  return (
    <>
      <section className="metrics-grid" aria-label="Recruiting summary">
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="overview-grid" aria-label="Hiring analysis">
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
            {[['May', 40, 22], ['Jun', 56, 30], ['Jul', 46, 24], ['Aug', 70, 43], ['Sep', 63, 36], ['Oct', 91, 55]].map(([month, applications, hires]) => (
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

function App() {
  const [activeScreen, setActiveScreen] = useState('overview')
  const [candidateSearch, setCandidateSearch] = useState('')
  const activeLabel = navigation.find((item) => item.id === activeScreen)?.label ?? 'Overview'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveScreen('overview')}>
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>talentwise</span>
        </a>
        <p className="workspace-label">WORKSPACE</p>
        <div className="workspace-card">
          <span className="workspace-avatar" aria-hidden="true">N</span>
          <span><strong>Northstar Studio</strong><small>Growth team</small></span>
          <span className="workspace-chevron" aria-hidden="true">⌄</span>
        </div>

        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-link${activeScreen === item.id ? ' nav-link--active' : ''}`}
              type="button"
              key={item.id}
              aria-current={activeScreen === item.id ? 'page' : undefined}
              onClick={() => setActiveScreen(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.id === 'channels' && <span className="nav-count">6</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-insight">
            <span className="insight-mark" aria-hidden="true">✧</span>
            <strong>Make better hires</strong>
            <p>Get more from every recruiting dollar.</p>
          </div>
          <div className="profile">
            <span className="profile-avatar" aria-hidden="true">AM</span>
            <span><strong>Alex Morgan</strong><small>People lead</small></span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span aria-hidden="true">/</span><strong>{activeLabel}</strong></div>
          <span className="sample-badge"><i /> UX prototype · Sample data</span>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> RECRUITING PERFORMANCE</p>
              <h1>{activeScreen === 'overview' ? 'Hiring, in focus.' : activeScreen === 'channels' ? 'Channel performance.' : 'Candidate pipeline.'}</h1>
              <p className="page-subtitle">
                {activeScreen === 'overview' && 'A clearer picture of where your best people come from.'}
                {activeScreen === 'channels' && 'Compare hiring sources and invest in the channels that work.'}
                {activeScreen === 'candidates' && 'Find candidates, review their progress, and understand their source.'}
              </p>
            </div>
            <div className="heading-actions">
              <span className="date-filter"><span aria-hidden="true">▦</span> Last 90 days <span aria-hidden="true">⌄</span></span>
              <button className="export-button" type="button" onClick={() => window.print()}>
                <span aria-hidden="true">↧</span> Export / Print
              </button>
            </div>
          </section>

          {activeScreen === 'overview' && <Overview />}
          {activeScreen === 'channels' && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">SOURCE PERFORMANCE</p>
                  <h2>Channel comparison</h2>
                  <p>Review volume, conversion, candidate quality, and cost together.</p>
                </div>
                <span className="table-caption">4 channels tracked</span>
              </div>
              <ChannelTable />
              <div className="insight-callout"><strong>Channel insight</strong><span>Referrals lead on candidate quality and hire rate; the careers page currently has the lowest cost per hire.</span></div>
            </section>
          )}
          {activeScreen === 'candidates' && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-kicker">RECENT ACTIVITY</p>
                  <h2>Candidate pipeline</h2>
                  <p>Search candidates and review stage, source, and quality.</p>
                </div>
                <label className="search-field">
                  <span className="sr-only">Search candidates</span>
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search candidates"
                    value={candidateSearch}
                    onChange={(event) => setCandidateSearch(event.target.value)}
                  />
                </label>
              </div>
              <CandidateTable search={candidateSearch} />
              <p className="panel-footnote">Showing sample candidate records · No ATS connection</p>
            </section>
          )}

          <footer className="page-footer">
            <span>Talentwise <span aria-hidden="true">·</span> Recruitment analytics</span>
            <span>Front-end prototype for the MERN capstone</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
