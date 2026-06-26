let googleMapsPlacesPromise

export function hasGoogleMapsApiKey() {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
}

export function loadGoogleMapsPlaces() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY.'))
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'))
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }

  if (googleMapsPlacesPromise) {
    return googleMapsPlacesPromise
  }

  googleMapsPlacesPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps-places="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google))
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google Maps.')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googleMapsPlaces = 'true'
    script.addEventListener('load', () => {
      if (window.google?.maps?.places) {
        resolve(window.google)
      } else {
        reject(new Error('Google Places did not load correctly.'))
      }
    })
    script.addEventListener('error', () => reject(new Error('Unable to load Google Maps.')))
    document.head.appendChild(script)
  })

  return googleMapsPlacesPromise
}
