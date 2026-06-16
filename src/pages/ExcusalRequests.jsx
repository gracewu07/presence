import { excusalRequests } from '../data'
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
              <h3>{request.memberName}</h3>
              <p>{request.eventTitle}</p>
              <p className="muted">{request.submittedAt}</p>
              <p className="muted">Reason: {request.reason}</p>
            </div>
            <StatusBadge label={request.status} status={request.status} />
          </article>
        ))}
      </div>
    </section>
  )
}

export default ExcusalRequests
