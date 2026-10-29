function Topbar({ pageTitle }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span>
        <span aria-hidden="true">/</span>
        <strong>{pageTitle}</strong>
      </div>
      <span className="sample-badge"><i /> UX prototype · Sample data</span>
    </header>
  )
}

export default Topbar
