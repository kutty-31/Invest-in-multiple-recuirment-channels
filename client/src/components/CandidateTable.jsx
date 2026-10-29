import { useState } from 'react'
import { qualityStars } from '../data/recruiting'

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']

function CandidateTable({
  candidates,
  channels,
  onCandidateUpdate,
  onRoleAutocomplete,
  onCandidateDelete,
  onResumeUpload,
  onResumeDownload,
  onResumeDelete,
  search,
}) {
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [editingStage, setEditingStage] = useState('')
  const [deletingCandidate, setDeletingCandidate] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [rolePrefix, setRolePrefix] = useState('')
  const [aiStatus, setAiStatus] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [resumeBusyId, setResumeBusyId] = useState('')
  const query = search.trim().toLowerCase()
  const filteredCandidates = candidates.filter((candidate) =>
    [candidate.name, candidate.role, candidate.source, candidate.stage]
      .some((value) => value.toLowerCase().includes(query)),
  )

  async function completeRole() {
    setAiLoading(true)
    setAiStatus('')
    try {
      const suggestion = await onRoleAutocomplete(rolePrefix)
      setRolePrefix(suggestion)
      setAiStatus('AI suggestion added. Review and edit it before saving.')
    } catch (error) {
      setAiStatus(`Could not get an AI suggestion: ${error.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  async function saveCandidate(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const updatedCandidate = {
      ...editingCandidate,
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      role: formData.get('role').trim(),
      sourceId: formData.get('source'),
      source: channels.find((channel) => channel._id === formData.get('source'))?.name || '',
      stage: editingStage,
      quality: Number(formData.get('quality')).toFixed(1),
      appliedAt: formData.get('appliedAt'),
      hiredAt: formData.get('hiredAt'),
    }

    setSaving(true)
    try {
      await onCandidateUpdate(updatedCandidate)
      setEditingCandidate(null)
      setMessage(`${updatedCandidate.name} was updated.`)
    } catch (error) {
      setMessage(`Could not update candidate: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    const deletedName = deletingCandidate.name
    setSaving(true)
    try {
      await onCandidateDelete(deletingCandidate.id)
      setDeletingCandidate(null)
      setMessage(`${deletedName} was removed from the candidate pipeline.`)
    } catch (error) {
      setMessage(`Could not delete candidate: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleResumeUpload(candidate, file) {
    setMessage('')
    setResumeBusyId(candidate.id)
    try {
      await onResumeUpload(candidate.id, file)
      setMessage(`Resume uploaded for ${candidate.name}.`)
    } catch (error) {
      setMessage(`Could not upload resume: ${error.message}`)
    } finally {
      setResumeBusyId('')
    }
  }

  async function handleResumeDownload(candidate) {
    setResumeBusyId(candidate.id)
    try {
      await onResumeDownload(candidate)
    } catch (error) {
      setMessage(`Could not download resume: ${error.message}`)
    } finally {
      setResumeBusyId('')
    }
  }

  async function handleResumeDelete(candidate) {
    setResumeBusyId(candidate.id)
    try {
      await onResumeDelete(candidate.id)
      setMessage(`Resume removed for ${candidate.name}.`)
    } catch (error) {
      setMessage(`Could not remove resume: ${error.message}`)
    } finally {
      setResumeBusyId('')
    }
  }

  return (
    <>
      {message && (
        <p
          className={message.startsWith('Could not') ? 'table-feedback table-feedback--error' : 'sr-only'}
          role={message.startsWith('Could not') ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>
      )}
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
              <th scope="col">Resume</th>
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
                  <div className="resume-actions">
                    {candidate.resume && (
                      <>
                        <span className="resume-name" title={candidate.resume.originalName}>
                          {candidate.resume.originalName}
                        </span>
                        <button
                          className="candidate-action"
                          type="button"
                          disabled={resumeBusyId === candidate.id}
                          onClick={() => handleResumeDownload(candidate)}
                          aria-label={`Download resume for ${candidate.name}`}
                        >
                          Download
                        </button>
                        <button
                          className="candidate-action candidate-action--danger"
                          type="button"
                          disabled={resumeBusyId === candidate.id}
                          onClick={() => handleResumeDelete(candidate)}
                          aria-label={`Remove resume for ${candidate.name}`}
                        >
                          Remove
                        </button>
                      </>
                    )}
                    <label className="resume-upload-label">
                      {resumeBusyId === candidate.id
                        ? 'Uploading…'
                        : candidate.resume ? 'Replace' : 'Upload PDF'}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        aria-label={`${candidate.resume ? 'Replace' : 'Upload'} PDF resume for ${candidate.name}`}
                        disabled={resumeBusyId === candidate.id}
                        onChange={(event) => {
                          const [file] = event.target.files
                          if (file) void handleResumeUpload(candidate, file)
                          event.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </td>
                <td>
                  <div className="candidate-actions">
                    <button
                      className="candidate-action"
                      type="button"
                      onClick={() => {
                        setEditingCandidate(candidate)
                        setEditingStage(candidate.stage)
                        setRolePrefix(candidate.role)
                        setAiStatus('')
                        setMessage('')
                      }}
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
              <tr><td className="empty-state" colSpan="8">No candidates match “{search}”.</td></tr>
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
                <div className="role-autocomplete-control">
                  <input
                    name="role"
                    value={rolePrefix}
                    onChange={(event) => {
                      setRolePrefix(event.target.value)
                      setAiStatus('')
                    }}
                    required
                    maxLength="100"
                  />
                  <button
                    className="candidate-action"
                    type="button"
                    onClick={() => void completeRole()}
                    disabled={aiLoading || rolePrefix.trim().length < 2}
                  >
                    {aiLoading ? 'Thinking…' : 'AI complete'}
                  </button>
                </div>
                {aiStatus && (
                  <span className={aiStatus.startsWith('Could not') ? 'ai-autocomplete-status ai-autocomplete-status--error' : 'ai-autocomplete-status'} role={aiStatus.startsWith('Could not') ? 'alert' : 'status'}>
                    {aiStatus}
                  </span>
                )}
              </label>
              <label>
                Email
                <input name="email" type="email" defaultValue={editingCandidate.email} maxLength="254" />
              </label>
              <label>
                Recruiting source
                <select name="source" defaultValue={editingCandidate.sourceId} required>
                  {channels.map((channel) => (
                    <option key={channel._id} value={channel._id}>{channel.name}</option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Stage
                  <select
                    name="stage"
                    value={editingStage}
                    onChange={(event) => setEditingStage(event.target.value)}
                  >
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
              <div className="form-row">
                <label>
                  Application date
                  <input
                    name="appliedAt"
                    type="date"
                    defaultValue={editingCandidate.appliedAt.slice(0, 10)}
                    required
                  />
                </label>
                <label>
                  Hire date {editingStage === 'Hired' && <span aria-hidden="true">*</span>}
                  <input
                    name="hiredAt"
                    type="date"
                    defaultValue={editingCandidate.hiredAt ? editingCandidate.hiredAt.slice(0, 10) : ''}
                    required={editingStage === 'Hired'}
                  />
                </label>
              </div>
              <div className="dialog-actions">
                <button className="dialog-button" type="button" onClick={() => setEditingCandidate(null)} disabled={saving}>
                  Cancel
                </button>
                <button className="dialog-button dialog-button--primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
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
              This permanently removes the candidate from your recruiting workspace. This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button className="dialog-button" type="button" onClick={() => setDeletingCandidate(null)} disabled={saving}>
                Cancel
              </button>
              <button className="dialog-button dialog-button--danger" type="button" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete candidate'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default CandidateTable
