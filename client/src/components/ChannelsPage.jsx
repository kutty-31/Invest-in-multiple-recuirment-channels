import ChannelTable from './ChannelTable'

function ChannelsPage() {
  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">SOURCE PERFORMANCE</p>
          <h2>Channel comparison</h2>
          <p>Review volume, conversion, candidate quality, and cost together.</p>
        </div>
        <span className="table-caption">4 channels tracked</span>
      </div>
      <ChannelTable />
      <div className="insight-callout">
        <strong>Channel insight</strong>
        <span>Referrals lead on candidate quality and hire rate; the careers page currently has the lowest cost per hire.</span>
      </div>
    </section>
  )
}

export default ChannelsPage
