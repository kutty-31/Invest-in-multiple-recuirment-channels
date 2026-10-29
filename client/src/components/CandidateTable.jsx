import { useState } from 'react'
import { qualityStars } from '../data/recruiting'

const stages = ['Applied', 'Screening', 'Interview', 'Hired']

function CandidateTable({ candidates, onCandidateUpdate, onCandidateDelete, search }) {
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [deletingCandidate, setDeletingCandidate] = useState(null)
  const [message, setMessage] = useState('')
  const query = search.trim().toLowerCase()
  const filteredCandidates = candidates.filter((candidate) =>
    [candidate.name, candidate.role, candidate.source, candidate.stage]
      .some((value) => value.toLowerCase().includes(query)),
  )

  function saveCandidate(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const updatedCandidate = {
      ...editingCandidate,
      name: formData.get('name').trim(),
      role: formData.get('role').trim(),
      source: formData.get('source').trim(),
      stage: formData.get('stage'),
      quality: Number(formData.get('quality')).toFixed(1),
    }

    onCandidateUpdate(updatedCandidate)
    setEditingCandidate(null)
    setMessage(`${updatedCandidate.name} was updated.`)
  }

  function confirmDelete() {
    const deletedName = deletingCandidate.name
    onCandidateDelete(deletingCandidate.id)
    setDeletingCandidate(null)
    setMessage(`${deletedName} was removed from the candidate pipeline.`)
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">{message}</p>
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
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id}>
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
                <td>
                  <div className="candidate-actions">
                    <button
                      className="candidate-action"
                      type="button"
                      onClick={() => setEditingCandidate(candidate)}
                      aria-label={`Edit ${candidate.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="candidate-action candidate-action--danger"
                      type="button"
                      onClick={() => setDeletingCandidate(candidate)}
                      aria-label={`Delete ${candidate.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCandidates.length === 0 && (
              <tr><td className="empty-state" colSpan="7">No candidates match “{search}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCandidate && (
        <div className="dialog-backdrop">
          <section
            className="candidate-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-candidate-title"
          >
            <div className="dialog-heading">
              <div>
                <p className="section-kicker">CANDIDATE DETAILS</p>
                <h2 id="edit-candidate-title">Edit candidate</h2>
              </div>
              <button
                className="dialog-close"
                type="button"
                onClick={() => setEditingCandidate(null)}
                aria-label="Close edit dialog"
              >
                ×
              </button>
            </div>
            <form className="candidate-form" onSubmit={saveCandidate}>
              <label>
                Candidate name
                <input name="name" defaultValue={editingCandidate.name} required maxLength="70" />
              </label>
              <label>
                Role
                <input name="role" defaultValue={editingCandidate.role} required maxLength="100" />
              </label>
              <label>
                Recruiting source
                <input name="source" defaultValue={editingCandidate.source} required maxLength="80" />
              </label>
              <div className="form-row">
                <label>
                  Stage
                  <select name="stage" defaultValue={editingCandidate.stage}>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </label>
                <label>
                  Quality score
                  <input
                    name="quality"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    defaultValue={editingCandidate.quality}
                    required
                  />
                </label>
              </div>
              <div className="dialog-actions">
                <button className="dialog-button" type="button" onClick={() => setEditingCandidate(null)}>
                  Cancel
                </button>
                <button className="dialog-button dialog-button--primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deletingCandidate && (
        <div className="dialog-backdrop">
          <section
            className="candidate-dialog candidate-dialog--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-candidate-title"
            aria-describedby="delete-candidate-description"
          >
            <p className="section-kicker">REMOVE CANDIDATE</p>
            <h2 id="delete-candidate-title">Delete {deletingCandidate.name}?</h2>
            <p id="delete-candidate-description">
              This removes the candidate from this session’s pipeline. This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button className="dialog-button" type="button" onClick={() => setDeletingCandidate(null)}>
                Cancel
              </button>
              <button className="dialog-button dialog-button--danger" type="button" onClick={confirmDelete}>
                Delete candidate
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default CandidateTable
