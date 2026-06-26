import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { EVENT_TYPES } from '../constants/eventTypes'
import { UNC_EVENT_LOCATIONS } from '../constants/locations'
import { useAuth } from '../context/AuthContext'
import { createEvent, fetchEventById, updateEvent } from '../firebase'
import {
  buildEventDateTime,
  formatDisplayDate,
  formatDisplayTime,
  parseEventTimeMinutes,
  TIME_OPTIONS,
  toDateInputValue,
} from '../utils/eventDateTime'

const initialFormState = {
  title: '',
  eventType: '',
  date: '',
  startTime: '',
  endTime: '',
  locationId: '',
  locationName: '',
  latitude: '',
  longitude: '',
  radiusMeters: '',
  points: '',
  required: false,
  description: '',
}

function EventCreation() {
  const { eventId } = useParams()
  const isEditing = Boolean(eventId)
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const selectedLocation = UNC_EVENT_LOCATIONS.find((location) => location.id === form.locationId)
  const showCustomLocationFields = form.locationId === 'custom'

  useEffect(() => {
    if (!eventId) return

    async function loadEvent() {
      setLoading(true)
      setErrorMessage('')

      try {
        const existingEvent = await fetchEventById(eventId)
        if (!existingEvent) {
          setErrorMessage('Event not found.')
          return
        }

        const matchingLocation = UNC_EVENT_LOCATIONS.find((location) => location.name === existingEvent.locationName)

        setForm({
          title: existingEvent.title || '',
          eventType: existingEvent.eventType || '',
          date: toDateInputValue(existingEvent.eventDate || existingEvent.date),
          startTime: formatDisplayTime(existingEvent.startTime || ''),
          endTime: formatDisplayTime(existingEvent.endTime || ''),
          locationId: matchingLocation?.id || 'custom',
          locationName: existingEvent.locationName || '',
          latitude: existingEvent.latitude != null ? String(existingEvent.latitude) : '',
          longitude: existingEvent.longitude != null ? String(existingEvent.longitude) : '',
          radiusMeters: existingEvent.radiusMeters != null ? String(existingEvent.radiusMeters) : '',
          points: existingEvent.points != null ? String(existingEvent.points) : '',
          required: Boolean(existingEvent.required),
          description: existingEvent.description || '',
        })
      } catch (error) {
        console.error('Failed to load event:', error)
        setErrorMessage('Unable to load event for editing.')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleLocationChange = (event) => {
    const locationId = event.target.value
    const selectedLocationOption = UNC_EVENT_LOCATIONS.find((location) => location.id === locationId)

    setErrors((current) => {
      const remainingErrors = { ...current }
      delete remainingErrors.locationName
      delete remainingErrors.latitude
      delete remainingErrors.longitude
      delete remainingErrors.radiusMeters
      return remainingErrors
    })

    setForm((current) => {
      if (!selectedLocationOption) {
        return {
          ...current,
          locationId,
          locationName: locationId === 'custom' ? current.locationName : '',
          latitude: locationId === 'custom' ? current.latitude : '',
          longitude: locationId === 'custom' ? current.longitude : '',
          radiusMeters: locationId === 'custom' ? current.radiusMeters : '',
        }
      }

      return {
        ...current,
        locationId,
        locationName: selectedLocationOption.name,
        latitude: String(selectedLocationOption.latitude),
        longitude: String(selectedLocationOption.longitude),
        radiusMeters: String(selectedLocationOption.radiusMeters),
      }
    })
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
      const startValue = parseEventTimeMinutes(form.startTime)
      const endValue = parseEventTimeMinutes(form.endTime)
      if (endValue <= startValue) nextErrors.endTime = 'End time must be after start time.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!validate()) return
    if (!currentUser?.email) {
      setErrorMessage('You must be signed in to save an event.')
      return
    }

    const eventStartDate = buildEventDateTime(form.date, form.startTime)
    const eventEndDate = buildEventDateTime(form.date, form.endTime)
    const savedEvent = {
      title: form.title.trim(),
      eventType: form.eventType,
      date: formatDisplayDate(form.date),
      startTime: formatDisplayTime(form.startTime),
      endTime: formatDisplayTime(form.endTime),
      locationName: form.locationName.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radiusMeters: Number(form.radiusMeters),
      points: Number(form.points),
      required: form.required,
      description: form.description.trim(),
      eventDate: eventStartDate.toISOString(),
      endDate: eventEndDate.toISOString(),
    }

    if (!isEditing) savedEvent.createdBy = currentUser.email

    setLoading(true)

    try {
      if (isEditing) {
        await updateEvent(eventId, savedEvent)
      } else {
        await createEvent(savedEvent)
        setForm(initialFormState)
      }

      setSuccessMessage(`Event "${savedEvent.title}" ${isEditing ? 'updated' : 'created'} successfully.`)
      setErrors({})
    } catch (error) {
      console.error('Event save failed:', error)
      setErrorMessage('Unable to save event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page form-page event-creation-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">{isEditing ? 'Event Editing' : 'Event Creation'}</p>
          <h1>{isEditing ? 'Edit Chapter Event' : 'New Chapter Event'}</h1>
          <p className="muted">{isEditing ? 'Update event details, location, points, and attendance settings.' : 'Create attendance events and set point values manually.'}</p>
        </div>
      </div>

      <form className="card event-form" onSubmit={handleSubmit} noValidate>
        {errorMessage && <div className="form-error">{errorMessage}</div>}
        {successMessage && (
          <div className="form-success">
            {successMessage}
            <div className="form-success-actions">
              <button type="button" className="button button--secondary" onClick={() => navigate('/admin')}>
                Go to Admin Dashboard
              </button>
              <button type="button" className="button button--secondary" onClick={() => navigate('/calendar')}>
                View Event Calendar
              </button>
            </div>
          </div>
        )}

        <label>
          Event title
          <input type="text" value={form.title} onChange={handleChange('title')} placeholder="Community Service Day" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Event type
          <select value={form.eventType} onChange={handleChange('eventType')}>
            <option value="">Select type</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
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
            <select value={form.startTime} onChange={handleChange('startTime')}>
              <option value="">Select start time</option>
              {TIME_OPTIONS.map((time) => (
                <option key={`start-${time}`} value={time}>{time}</option>
              ))}
            </select>
            {errors.startTime && <span className="field-error">{errors.startTime}</span>}
          </label>
          <label>
            End time
            <select value={form.endTime} onChange={handleChange('endTime')}>
              <option value="">Select end time</option>
              {TIME_OPTIONS.map((time) => (
                <option key={`end-${time}`} value={time}>{time}</option>
              ))}
            </select>
            {errors.endTime && <span className="field-error">{errors.endTime}</span>}
          </label>
        </div>

        <label>
          Location
          <select value={form.locationId} onChange={handleLocationChange}>
            <option value="">Select location</option>
            {UNC_EVENT_LOCATIONS.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
            <option value="custom">Custom location</option>
          </select>
          {errors.locationName && <span className="field-error">{errors.locationName}</span>}
        </label>

        {selectedLocation && (
          <div className="location-autofill-summary" aria-live="polite">
            <div><span>Latitude</span><strong>{selectedLocation.latitude}</strong></div>
            <div><span>Longitude</span><strong>{selectedLocation.longitude}</strong></div>
            <div><span>Radius</span><strong>{selectedLocation.radiusMeters}m</strong></div>
          </div>
        )}

        {showCustomLocationFields && (
          <>
            <label>
              Location name
              <input type="text" value={form.locationName} onChange={handleChange('locationName')} placeholder="Campus Hall" />
              {errors.locationName && <span className="field-error">{errors.locationName}</span>}
            </label>

            <div className="form-row">
              <label>
                Latitude
                <input type="number" step="0.000001" value={form.latitude} onChange={handleChange('latitude')} placeholder="35.9086" />
                {errors.latitude && <span className="field-error">{errors.latitude}</span>}
              </label>
              <label>
                Longitude
                <input type="number" step="0.000001" value={form.longitude} onChange={handleChange('longitude')} placeholder="-79.0469" />
                {errors.longitude && <span className="field-error">{errors.longitude}</span>}
              </label>
            </div>

            <label>
              Allowed radius (meters)
              <input type="number" min="1" value={form.radiusMeters} onChange={handleChange('radiusMeters')} placeholder="100" />
              {errors.radiusMeters && <span className="field-error">{errors.radiusMeters}</span>}
            </label>
          </>
        )}

        {!showCustomLocationFields && (errors.latitude || errors.longitude || errors.radiusMeters) && (
          <div className="form-error">Select a location or choose Custom location to enter coordinates manually.</div>
        )}

        <div className="form-row">
          <label>
            Points
            <input type="number" min="0" value={form.points} onChange={handleChange('points')} placeholder="10" />
            {errors.points && <span className="field-error">{errors.points}</span>}
          </label>
        </div>

        <label className="checkbox-label">
          <input type="checkbox" checked={form.required} onChange={handleChange('required')} />
          Required event
        </label>

        <label>
          Description
          <textarea rows="4" value={form.description} onChange={handleChange('description')} placeholder="Add event details and attendance notes." />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving event...' : isEditing ? 'Save Event' : 'Create Event'}
        </Button>
      </form>
    </section>
  )
}

export default EventCreation
