import { useState } from 'react'
import Button from '../components/Button'

const eventTypes = [
  'Chapter',
  'Professional Development',
  'Service',
  'Social',
  'DEI',
  'Recruitment',
  'Committee',
  'Other',
]

const initialFormState = {
  title: '',
  eventType: '',
  date: '',
  startTime: '',
  endTime: '',
  locationName: '',
  latitude: '',
  longitude: '',
  radiusMeters: '',
  points: '',
  required: true,
  description: '',
}

const getTimeValue = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function EventCreation() {
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.eventType) nextErrors.eventType = 'Event type is required.'
    if (!form.date) nextErrors.date = 'Date is required.'
    if (!form.startTime) nextErrors.startTime = 'Start time is required.'
    if (!form.endTime) nextErrors.endTime = 'End time is required.'
    if (!form.locationName.trim()) nextErrors.locationName = 'Location is required.'

    const latitude = parseFloat(form.latitude)
    if (Number.isNaN(latitude)) nextErrors.latitude = 'Latitude must be a valid number.'

    const longitude = parseFloat(form.longitude)
    if (Number.isNaN(longitude)) nextErrors.longitude = 'Longitude must be a valid number.'

    const radius = Number(form.radiusMeters)
    if (Number.isNaN(radius) || radius <= 0) nextErrors.radiusMeters = 'Radius must be greater than 0 meters.'

    const points = Number(form.points)
    if (Number.isNaN(points) || points < 0) nextErrors.points = 'Points must be 0 or greater.'

    if (form.startTime && form.endTime) {
      const startValue = getTimeValue(form.startTime)
      const endValue = getTimeValue(form.endTime)
      if (endValue <= startValue) nextErrors.endTime = 'End time must be after start time.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSuccessMessage('')

    if (!validate()) return

    const newEvent = {
      id: `e_${Date.now()}`,
      title: form.title.trim(),
      eventType: form.eventType,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      locationName: form.locationName.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radiusMeters: Number(form.radiusMeters),
      points: Number(form.points),
      required: form.required,
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
    }

    console.log('New event created:', newEvent)
    setSuccessMessage('Event created successfully. Check the console for details.')
    setForm(initialFormState)
    setErrors({})
  }

  return (
    <section className="page form-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">Event Creation</p>
          <h1>New Chapter Event</h1>
          <p className="muted">Create attendance events and set point values manually.</p>
        </div>
      </div>

      <form className="card event-form" onSubmit={handleSubmit} noValidate>
        {successMessage && <div className="form-success">{successMessage}</div>}

        <label>
          Event title
          <input
            type="text"
            value={form.title}
            onChange={handleChange('title')}
            placeholder="Community Service Day"
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Event type
          <select value={form.eventType} onChange={handleChange('eventType')}>
            <option value="">Select type</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.eventType && <span className="field-error">{errors.eventType}</span>}
        </label>

        <label>
          Date
          <input type="date" value={form.date} onChange={handleChange('date')} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </label>

        <div className="form-row">
          <label>
            Start time
            <input type="time" value={form.startTime} onChange={handleChange('startTime')} />
            {errors.startTime && <span className="field-error">{errors.startTime}</span>}
          </label>
          <label>
            End time
            <input type="time" value={form.endTime} onChange={handleChange('endTime')} />
            {errors.endTime && <span className="field-error">{errors.endTime}</span>}
          </label>
        </div>

        <label>
          Location name
          <input
            type="text"
            value={form.locationName}
            onChange={handleChange('locationName')}
            placeholder="Campus Hall"
          />
          {errors.locationName && <span className="field-error">{errors.locationName}</span>}
        </label>

        <div className="form-row">
          <label>
            Latitude
            <input
              type="number"
              step="0.000001"
              value={form.latitude}
              onChange={handleChange('latitude')}
              placeholder="35.9086"
            />
            {errors.latitude && <span className="field-error">{errors.latitude}</span>}
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="0.000001"
              value={form.longitude}
              onChange={handleChange('longitude')}
              placeholder="-79.0469"
            />
            {errors.longitude && <span className="field-error">{errors.longitude}</span>}
          </label>
        </div>

        <div className="form-row">
          <label>
            Allowed radius (meters)
            <input
              type="number"
              min="1"
              value={form.radiusMeters}
              onChange={handleChange('radiusMeters')}
              placeholder="100"
            />
            {errors.radiusMeters && <span className="field-error">{errors.radiusMeters}</span>}
          </label>
          <label>
            Points
            <input
              type="number"
              min="0"
              value={form.points}
              onChange={handleChange('points')}
              placeholder="10"
            />
            {errors.points && <span className="field-error">{errors.points}</span>}
          </label>
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.required}
            onChange={handleChange('required')}
          />
          Required event
        </label>

        <label>
          Description
          <textarea
            rows="4"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Add event details and attendance notes."
          />
        </label>

        <Button type="submit">Create Event</Button>
      </form>
    </section>
  )
}

export default EventCreation
