import Button from '../components/Button'

function EventCreation() {
  return (
    <section className="page form-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Event Creation</p>
          <h1>New Chapter Event</h1>
          <p className="muted">Create attendance events and add points quickly.</p>
        </div>
      </div>

      <form className="card event-form">
        <label>
          Event name
          <input type="text" placeholder="Community Service" />
        </label>
        <label>
          Date
          <input type="date" />
        </label>
        <label>
          Time
          <input type="time" />
        </label>
        <label>
          Location
          <input type="text" placeholder="Campus Hall" />
        </label>
        <label>
          Points value
          <input type="number" placeholder="10" />
        </label>
        <Button type="submit">Save Event</Button>
      </form>
    </section>
  )
}

export default EventCreation
