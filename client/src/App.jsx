import { useEffect, useState } from 'react'
import { getRecruitingData, removeCandidate as removeCandidateRequest, replaceCandidate } from './api/auth'
import AuthScreen from './components/AuthScreen'
import CandidatePipeline from './components/CandidatePipeline'
import ChannelsPage from './components/ChannelsPage'
import OverviewDashboard from './components/OverviewDashboard'
import PageHeading from './components/PageHeading'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { navigation } from './data/recruiting'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [activeScreen, setActiveScreen] = useState('overview')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidates, setCandidates] = useState([])
  const [channels, setChannels] = useState([])
  const [candidateLoadState, setCandidateLoadState] = useState('idle')
  const [candidateLoadError, setCandidateLoadError] = useState('')
  const [candidateLoadAttempt, setCandidateLoadAttempt] = useState(0)
  const activeLabel = navigation.find((item) => item.id === activeScreen)?.label ?? 'Overview'

  useEffect(() => {
    if (!session) return undefined

    let active = true
    getRecruitingData(session.accessToken)
      .then(({ candidates: loadedCandidates, channels: loadedChannels }) => {
        if (!active) return
        setCandidates(loadedCandidates)
        setChannels(loadedChannels)
        setCandidateLoadState('loaded')
      })
      .catch((error) => {
        if (!active) return
        setCandidateLoadError(error.message)
        setCandidateLoadState('error')
      })
    return () => {
      active = false
    }
  }, [session, candidateLoadAttempt])

  function handleAuthenticated(nextSession) {
    setSession(nextSession)
    setCandidateLoadState('loading')
    setCandidateLoadError('')
  }

  function retryCandidateLoad() {
    setCandidateLoadState('loading')
    setCandidateLoadError('')
    setCandidateLoadAttempt((attempt) => attempt + 1)
  }

  async function updateCandidate(candidate) {
    const updatedCandidate = await replaceCandidate(candidate, session.accessToken)
    setCandidates((currentCandidates) => currentCandidates.map((existingCandidate) => (
      existingCandidate.id === updatedCandidate.id ? updatedCandidate : existingCandidate
    )))
  }

  async function deleteCandidate(candidateId) {
    await removeCandidateRequest(candidateId, session.accessToken)
    setCandidates((currentCandidates) => currentCandidates.filter(
      (candidate) => candidate.id !== candidateId,
    ))
  }

  function signOut() {
    setSession(null)
    setCandidates([])
    setChannels([])
    setCandidateLoadState('idle')
    setCandidateLoadError('')
    setCandidateLoadAttempt(0)
    setActiveScreen('overview')
  }

  if (!session) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="app-shell">
      <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />
      <main className="main-content">
        <Topbar pageTitle={activeLabel} username={session.user.username} onSignOut={signOut} />
        <div className="page-wrap">
          <PageHeading activeScreen={activeScreen} />
          {activeScreen === 'overview' && <OverviewDashboard />}
          {activeScreen === 'channels' && <ChannelsPage />}
          {activeScreen === 'candidates' && (
            <CandidatePipeline
              candidates={candidates}
              channels={channels}
              loadState={candidateLoadState}
              loadError={candidateLoadError}
              onRetry={retryCandidateLoad}
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
