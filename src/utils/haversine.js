const toRadians = (degrees) => (degrees * Math.PI) / 180

export function haversineDistance(userLat, userLon, eventLat, eventLon) {
  const earthRadius = 6371000
  const deltaLat = toRadians(eventLat - userLat)
  const deltaLon = toRadians(eventLon - userLon)
  const lat1 = toRadians(userLat)
  const lat2 = toRadians(eventLat)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}
