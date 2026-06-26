export function formatEventLocation(event) {
  const locationName = event?.locationName || event?.location || ''
  const room = event?.room || ''

  return [locationName, room].filter(Boolean).join(', ')
}
