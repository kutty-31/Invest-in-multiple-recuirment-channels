import { channelRows, qualityStars } from '../data/recruiting'

function ChannelTable() {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Recruiting channel</th>
            <th scope="col">Applicants</th>
            <th scope="col">Hires</th>
            <th scope="col">Hire rate</th>
            <th scope="col">Avg. quality</th>
            <th scope="col">Cost per hire</th>
            <th scope="col">Signal</th>
          </tr>
        </thead>
        <tbody>
          {channelRows.map((channel) => (
            <tr key={channel.name}>
              <td className="cell-strong">{channel.name}</td>
              <td>{channel.applicants}</td>
              <td>{channel.hires}</td>
              <td className="rate-value">{channel.rate}</td>
              <td>
                <span className="stars" aria-label={`${channel.quality} out of 5`}>
                  {qualityStars(channel.quality)}
                </span>{' '}{channel.quality}
              </td>
              <td>{channel.cost}</td>
              <td><span className="signal-pill">{channel.signal}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ChannelTable
