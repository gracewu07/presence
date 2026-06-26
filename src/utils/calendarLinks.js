import { formatEventLocation } from './eventLocation'

const padDate = (value) => value.toString().padStart(2, '0')

export const toCalendarDate = (date) => {
  const value = new Date(date)
  return `${value.getUTCFullYear()}${padDate(value.getUTCMonth() + 1)}${padDate(value.getUTCDate())}T${padDate(value.getUTCHours())}${padDate(value.getUTCMinutes())}00Z`
}

export const buildCalendarUrls = (event) => {
  const start = toCalendarDate(event.startDate)
  const end = toCalendarDate(event.endDate)
  const title = encodeURIComponent(event.title || '')
  const details = encodeURIComponent(event.description || '')
  const location = encodeURIComponent(formatEventLocation(event))
  const dates = `${start}/${end}`

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${new Date(event.startDate).toISOString()}&enddt=${new Date(event.endDate).toISOString()}&body=${details}&location=${location}`,
  }
}

export const downloadIcs = (event) => {
  const start = toCalendarDate(event.startDate)
  const end = toCalendarDate(event.endDate)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Presence//Calendar Event//EN',
    'BEGIN:VEVENT',
    `UID:${event.id || event.title}@presence`,
    `SUMMARY:${event.title || ''}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `LOCATION:${formatEventLocation(event)}`,
    `DESCRIPTION:${event.description || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title || 'event'}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
