function Topbar({ pageTitle, username, onSignOut }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span>
        <span aria-hidden="true">/</span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar-account">
        <span className="account-name">{username}</span>
        <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}

export default Topbar
