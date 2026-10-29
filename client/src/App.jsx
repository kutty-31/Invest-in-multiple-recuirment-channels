import { useState } from 'react'
import CandidatePipeline from './components/CandidatePipeline'
import ChannelsPage from './components/ChannelsPage'
import OverviewDashboard from './components/OverviewDashboard'
import PageHeading from './components/PageHeading'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { candidateRows, navigation } from './data/recruiting'
import './App.css'

function App() {
  const [activeScreen, setActiveScreen] = useState('overview')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidates, setCandidates] = useState(candidateRows)
  const activeLabel = navigation.find((item) => item.id === activeScreen)?.label ?? 'Overview'

  function updateCandidate(updatedCandidate) {
    setCandidates((currentCandidates) => currentCandidates.map((candidate) => (
      candidate.id === updatedCandidate.id ? updatedCandidate : candidate
    )))
  }

  function deleteCandidate(candidateId) {
    setCandidates((currentCandidates) => currentCandidates.filter(
      (candidate) => candidate.id !== candidateId,
    ))
  }

  return (
    <div className="app-shell">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <main className="main-content">
        <Topbar pageTitle={activeLabel} />
        <div className="page-wrap">
          <PageHeading activeScreen={activeScreen} />
          {activeScreen === 'overview' && <OverviewDashboard />}
          {activeScreen === 'channels' && <ChannelsPage />}
          {activeScreen === 'candidates' && (
            <CandidatePipeline
              candidates={candidates}
              onCandidateUpdate={updateCandidate}
              onCandidateDelete={deleteCandidate}
              search={candidateSearch}
              onSearchChange={setCandidateSearch}
            />
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
