import CandidateTable from './CandidateTable'

function CandidatePipeline({
  candidates,
  onCandidateUpdate,
  onCandidateDelete,
  search,
  onSearchChange,
}) {
  return (
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
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </div>
      <CandidateTable
        candidates={candidates}
        onCandidateUpdate={onCandidateUpdate}
        onCandidateDelete={onCandidateDelete}
        search={search}
      />
      <p className="panel-footnote">Showing sample candidate records · Changes are stored in this session only</p>
    </section>
  )
}

export default CandidatePipeline
