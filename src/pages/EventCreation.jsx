import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { EVENT_TYPES } from '../constants/eventTypes'
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
import { hasGoogleMapsApiKey, loadGoogleMapsPlaces } from '../utils/googleMaps'

const initialFormState = {
  title: '',
  eventType: '',
  date: '',
  startTime: '',
  endTime: '',
  locationId: '',
  locationName: '',
  formattedAddress: '',
  placeId: '',
  room: '',
  latitude: '',
  longitude: '',
  radiusMeters: '',
  points: '',
  required: false,
  description: '',
}

const CHECK_IN_EVENT_TYPES = ['chapter', 'service', 'professional-development']
const EVENT_CREATION_SUCCESS_KEY = 'presence:event-creation-success'

const normalizeEventType = (eventType = '') => eventType.toLowerCase().replace(/[^a-z0-9]+/g, '-')

const requiresCheckInLocation = (eventType) => CHECK_IN_EVENT_TYPES.includes(normalizeEventType(eventType))

const isTbdLocation = (locationName = '') => locationName.trim().toLowerCase() === 'tbd'

function EventCreation() {
  const { eventId } = useParams()
  const isEditing = Boolean(eventId)
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState(() => {
    const storedSuccessMessage = window.sessionStorage.getItem(EVENT_CREATION_SUCCESS_KEY)
    if (storedSuccessMessage) {
      window.sessionStorage.removeItem(EVENT_CREATION_SUCCESS_KEY)
    }
    return storedSuccessMessage || ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [placesStatus, setPlacesStatus] = useState(() => hasGoogleMapsApiKey() ? 'loading' : 'missing-key')
  const [placesMessage, setPlacesMessage] = useState(() =>
    hasGoogleMapsApiKey()
      ? 'Loading Google location search...'
      : 'Add VITE_GOOGLE_MAPS_API_KEY to enable Google location search.'
  )
  const locationSearchInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const locationRequired = requiresCheckInLocation(form.eventType)
  const hasTbdLocation = isTbdLocation(form.locationName)

  const clearLocationErrors = useCallback(() => {
    setErrors((current) => {
      const remainingErrors = { ...current }
      delete remainingErrors.locationName
      delete remainingErrors.latitude
      delete remainingErrors.longitude
      delete remainingErrors.radiusMeters
      return remainingErrors
    })
  }, [])

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const applyGooglePlace = useCallback((place) => {
    const location = place?.geometry?.location
    const latitude = typeof location?.lat === 'function' ? location.lat() : location?.lat
    const longitude = typeof location?.lng === 'function' ? location.lng() : location?.lng

    if (latitude == null || longitude == null) {
      return false
    }

    clearLocationErrors()
    setErrorMessage('')
    setForm((current) => ({
      ...current,
      locationId: 'google',
      locationName: place.name || place.formatted_address || locationSearchInputRef.current?.value || '',
      formattedAddress: place.formatted_address || '',
      placeId: place.place_id || '',
      latitude: String(latitude),
      longitude: String(longitude),
      radiusMeters: current.radiusMeters || '100',
    }))
    return true
  }, [clearLocationErrors])

  const fetchPlaceDetails = useCallback((placeId) => new Promise((resolve, reject) => {
    if (!window.google?.maps?.places || !placeId) {
      reject(new Error('Google Places details are unavailable.'))
      return
    }

    const detailNode = document.createElement('div')
    const placesService = new window.google.maps.places.PlacesService(detailNode)
    placesService.getDetails(
      {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      },
      (placeDetails, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
          resolve(placeDetails)
          return
        }

        reject(new Error(`Unable to load place details: ${status}`))
      }
    )
  }), [])

  const handleGooglePlaceSelect = useCallback(async (place) => {
    if (applyGooglePlace(place)) return

    if (place?.place_id) {
      try {
        const placeDetails = await fetchPlaceDetails(place.place_id)
        if (applyGooglePlace(placeDetails)) return
      } catch (error) {
        console.error('Unable to fetch selected place details:', error)
      }
    }

    setErrorMessage('That place does not include coordinates. Please choose another Google suggestion.')
  }, [applyGooglePlace, fetchPlaceDetails])

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

        setForm({
          title: existingEvent.title || '',
          eventType: existingEvent.eventType || '',
          date: toDateInputValue(existingEvent.eventDate || existingEvent.date),
          startTime: formatDisplayTime(existingEvent.startTime || ''),
          endTime: formatDisplayTime(existingEvent.endTime || ''),
          locationId: existingEvent.placeId ? 'google' : existingEvent.locationId || '',
          locationName: existingEvent.locationName || '',
          formattedAddress: existingEvent.formattedAddress || '',
          placeId: existingEvent.placeId || '',
          room: existingEvent.room || '',
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

  useEffect(() => {
    let isMounted = true
    let placeListener = null

    if (!locationSearchInputRef.current || !hasGoogleMapsApiKey()) return undefined

    loadGoogleMapsPlaces()
      .then((google) => {
        if (!isMounted || !locationSearchInputRef.current) return

        const autocomplete = new google.maps.places.Autocomplete(locationSearchInputRef.current, {
          fields: ['place_id', 'name', 'formatted_address', 'geometry'],
        })

        autocompleteRef.current = autocomplete
        placeListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          handleGooglePlaceSelect(place)
        })
        setPlacesStatus('ready')
        setPlacesMessage('')
      })
      .catch((error) => {
        console.error('Google location search failed:', error)
        if (!isMounted) return
        setPlacesStatus('error')
        setPlacesMessage('Google location search is unavailable right now.')
      })

    return () => {
      isMounted = false
      if (placeListener?.remove) placeListener.remove()
    }
  }, [handleGooglePlaceSelect])

  const handleSetTbdLocation = () => {
    clearLocationErrors()
    setErrorMessage('')
    if (locationSearchInputRef.current) {
      locationSearchInputRef.current.value = 'TBD'
    }
    setForm((current) => ({
      ...current,
      locationId: 'tbd',
      locationName: 'TBD',
      formattedAddress: '',
      placeId: '',
      latitude: '',
      longitude: '',
      radiusMeters: '',
    }))
  }

  const validate = (formToValidate = form) => {
    const nextErrors = {}
    const needsLocation = requiresCheckInLocation(formToValidate.eventType)
    const isTbd = isTbdLocation(formToValidate.locationName)

    if (!formToValidate.title.trim()) nextErrors.title = 'Title is required.'
    if (!formToValidate.eventType) nextErrors.eventType = 'Event type is required.'
    if (!formToValidate.date) nextErrors.date = 'Date is required.'
    if (!formToValidate.startTime) nextErrors.startTime = 'Start time is required.'
    if (!formToValidate.endTime) nextErrors.endTime = 'End time is required.'
    if (needsLocation && !formToValidate.locationName.trim()) nextErrors.locationName = 'Location is required.'

    const latitude = parseFloat(formToValidate.latitude)
    if (needsLocation && !isTbd && Number.isNaN(latitude)) nextErrors.latitude = 'Latitude must be a valid number.'

    const longitude = parseFloat(formToValidate.longitude)
    if (needsLocation && !isTbd && Number.isNaN(longitude)) nextErrors.longitude = 'Longitude must be a valid number.'

    const radius = Number(formToValidate.radiusMeters)
    if (needsLocation && !isTbd && (Number.isNaN(radius) || radius <= 0)) nextErrors.radiusMeters = 'Radius must be greater than 0 meters.'

    const points = Number(formToValidate.points)
    if (Number.isNaN(points) || points < 0) nextErrors.points = 'Points must be 0 or greater.'

    if (formToValidate.startTime && formToValidate.endTime) {
      const startValue = parseEventTimeMinutes(formToValidate.startTime)
      const endValue = parseEventTimeMinutes(formToValidate.endTime)
      if (endValue <= startValue) nextErrors.endTime = 'End time must be after start time.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const geocodeLocationText = (locationText) => new Promise((resolve, reject) => {
    if (!window.google?.maps?.Geocoder) {
      reject(new Error('Google geocoding is unavailable.'))
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: locationText }, (results, status) => {
      const firstResult = results?.[0]
      const location = firstResult?.geometry?.location
      const latitude = typeof location?.lat === 'function' ? location.lat() : location?.lat
      const longitude = typeof location?.lng === 'function' ? location.lng() : location?.lng

      if (status === 'OK' && latitude != null && longitude != null) {
        resolve({
          locationName: firstResult.name || locationText,
          formattedAddress: firstResult.formatted_address || locationText,
          placeId: firstResult.place_id || '',
          latitude: String(latitude),
          longitude: String(longitude),
        })
        return
      }

      reject(new Error(`Unable to geocode location: ${status}`))
    })
  })

  const resolveLocationBeforeSubmit = async () => {
    const needsLocation = requiresCheckInLocation(form.eventType)
    const isTbd = isTbdLocation(form.locationName)
    const hasCoordinates = !Number.isNaN(parseFloat(form.latitude)) && !Number.isNaN(parseFloat(form.longitude))

    if (!needsLocation || isTbd || hasCoordinates) return form

    const locationText = locationSearchInputRef.current?.value?.trim() || form.locationName.trim()
    if (!locationText) return form

    try {
      await loadGoogleMapsPlaces()
      const geocodedLocation = await geocodeLocationText(locationText)
      const nextForm = {
        ...form,
        locationId: 'google',
        locationName: geocodedLocation.locationName,
        formattedAddress: geocodedLocation.formattedAddress,
        placeId: geocodedLocation.placeId,
        latitude: geocodedLocation.latitude,
        longitude: geocodedLocation.longitude,
        radiusMeters: form.radiusMeters || '100',
      }

      setForm(nextForm)
      clearLocationErrors()
      return nextForm
    } catch (error) {
      console.error('Unable to resolve event location before save:', error)
      setErrorMessage('Unable to find coordinates for that address. Please choose a Google suggestion or set the location as TBD.')
      return form
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    const formToSave = await resolveLocationBeforeSubmit()

    if (!validate(formToSave)) return
    if (!currentUser?.email) {
      setErrorMessage('You must be signed in to save an event.')
      return
    }

    const eventStartDate = buildEventDateTime(formToSave.date, formToSave.startTime)
    const eventEndDate = buildEventDateTime(formToSave.date, formToSave.endTime)
    const latitude = parseFloat(formToSave.latitude)
    const longitude = parseFloat(formToSave.longitude)
    const radiusMeters = Number(formToSave.radiusMeters)
    const savedEvent = {
      title: formToSave.title.trim(),
      eventType: formToSave.eventType,
      date: formatDisplayDate(formToSave.date),
      startTime: formatDisplayTime(formToSave.startTime),
      endTime: formatDisplayTime(formToSave.endTime),
      locationName: formToSave.locationName.trim(),
      formattedAddress: formToSave.formattedAddress.trim(),
      placeId: formToSave.placeId.trim(),
      room: formToSave.room.trim(),
      locationId: formToSave.locationId,
      latitude: Number.isNaN(latitude) ? null : latitude,
      longitude: Number.isNaN(longitude) ? null : longitude,
      radiusMeters: Number.isNaN(radiusMeters) || radiusMeters <= 0 ? null : radiusMeters,
      points: Number(formToSave.points),
      required: formToSave.required,
      description: formToSave.description.trim(),
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
        window.sessionStorage.setItem(EVENT_CREATION_SUCCESS_KEY, `Event "${savedEvent.title}" created successfully.`)
        window.location.reload()
        return
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

        <div className="location-search-block">
          <label className="places-search-field">
            Enter location
            <input
              ref={locationSearchInputRef}
              type="text"
              placeholder="Search for a building, business, or address"
              autoComplete="off"
            />
          </label>
          {placesMessage && (
            <p className={`places-status places-status--${placesStatus}`}>
              {placesMessage}
            </p>
          )}
          {form.placeId && (
            <div className="google-place-summary" aria-live="polite">
              <div>
                <span>Selected place</span>
                <strong>{form.locationName}</strong>
              </div>
              {form.formattedAddress && <p>{form.formattedAddress}</p>}
            </div>
          )}
          {hasTbdLocation && (
            <div className="google-place-summary" aria-live="polite">
              <div>
                <span>Selected place</span>
                <strong>TBD</strong>
              </div>
              <p>Location will be added later.</p>
            </div>
          )}
          <button type="button" className="button button--secondary location-tbd-button" onClick={handleSetTbdLocation}>
            Set Location as TBD
          </button>
        </div>

        {form.locationName && (
          <label>
            Room
            <input type="text" value={form.room} onChange={handleChange('room')} placeholder="Room 101, auditorium, lobby..." />
          </label>
        )}

        <div className="sr-only" aria-hidden="true">
          <input type="hidden" value={form.locationName} readOnly />
          <input type="hidden" value={form.latitude} readOnly />
          <input type="hidden" value={form.longitude} readOnly />
          <input type="hidden" value={form.radiusMeters} readOnly />
        </div>

        {locationRequired && (errors.latitude || errors.longitude || errors.radiusMeters) && (
          <div className="form-error">
            Choose a Google place so check-in coordinates can be saved.
          </div>
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
