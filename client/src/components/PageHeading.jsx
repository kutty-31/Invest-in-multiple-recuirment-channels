const headings = {
  overview: {
    title: 'Hiring, in focus.',
    subtitle: 'A clearer picture of where your best people come from.',
  },
  channels: {
    title: 'Channel performance.',
    subtitle: 'Compare hiring sources and invest in the channels that work.',
  },
  candidates: {
    title: 'Candidate pipeline.',
    subtitle: 'Find candidates, review their progress, and understand their source.',
  },
}

function PageHeading({ activeScreen }) {
  const heading = headings[activeScreen]

  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow"><span className="eyebrow-dot" /> RECRUITING PERFORMANCE</p>
        <h1>{heading.title}</h1>
        <p className="page-subtitle">{heading.subtitle}</p>
      </div>
      <div className="heading-actions">
        <span className="date-filter"><span aria-hidden="true">▦</span> Last 90 days <span aria-hidden="true">⌄</span></span>
        <button className="export-button" type="button" onClick={() => window.print()}>
          <span aria-hidden="true">↧</span> Export / Print
        </button>
      </div>
    </section>
  )
}

export default PageHeading
