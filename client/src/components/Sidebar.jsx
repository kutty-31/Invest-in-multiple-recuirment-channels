import { navigation } from '../data/recruiting'

function Sidebar({ activeScreen, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => onNavigate('overview')}>
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
            onClick={() => onNavigate(item.id)}
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
  )
}

export default Sidebar
