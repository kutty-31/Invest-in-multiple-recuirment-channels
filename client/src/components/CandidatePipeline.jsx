import CandidateTable from './CandidateTable'

function CandidatePipeline({
  candidates,
  channels,
  loadState,
  loadError,
  onRetry,
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
      {loadState === 'loading' && <p className="pipeline-status" role="status">Loading candidates and recruiting sources…</p>}
      {loadState === 'error' && (
        <div className="pipeline-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="candidate-action" onClick={onRetry}>Try again</button>
        </div>
      )}
      {loadState === 'loaded' && (
        <CandidateTable
          candidates={candidates}
          channels={channels}
          onCandidateUpdate={onCandidateUpdate}
          onCandidateDelete={onCandidateDelete}
          search={search}
        />
      )}
      <p className="panel-footnote">Candidate records are loaded from your recruiting workspace.</p>
    </section>
  )
}

export default CandidatePipeline
