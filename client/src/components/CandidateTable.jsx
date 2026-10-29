import { candidateRows, qualityStars } from '../data/recruiting'

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
              <td>
                <span className={`stage-pill stage-pill--${candidate.stage.toLowerCase()}`}>
                  {candidate.stage}
                </span>
              </td>
              <td>
                <span className="stars" aria-label={`${candidate.quality} out of 5`}>
                  {qualityStars(candidate.quality)}
                </span>{' '}{candidate.quality}
              </td>
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

export default CandidateTable
