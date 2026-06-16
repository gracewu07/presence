import { excusalRequests } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'

function ExcusalRequests() {
  return (
    <section className="page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Excusal Requests</p>
          <h1>Pending Requests</h1>
          <p className="muted">Review or submit chapter absence excusals.</p>
        </div>
      </div>

      <div className="grid grid--cards">
        {excusalRequests.map((request) => (
          <article key={request.id} className="card request-card">
            <div>
              <h3>{request.name}</h3>
              <p>{request.event}</p>
              <p className="muted">{request.date}</p>
            </div>
            <StatusBadge label={request.status} status={request.status} />
          </article>
        ))}
      </div>
    </section>
  )
}

export default ExcusalRequests
