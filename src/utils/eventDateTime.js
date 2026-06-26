const DATE_DISPLAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  day: 'numeric',
})

const TIME_DISPLAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const date = new Date(2000, 0, 1, hours, minutes)
  return TIME_DISPLAY_FORMATTER.format(date)
})

export function formatDisplayDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return DATE_DISPLAY_FORMATTER.format(new Date(year, month - 1, day))
  }

  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return DATE_DISPLAY_FORMATTER.format(date)
}

export function formatDisplayTime(value) {
  if (!value) return ''
  if (value.includes('AM') || value.includes('PM')) return value

  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value

  return TIME_DISPLAY_FORMATTER.format(new Date(2000, 0, 1, hours, minutes))
}

export function toDateInputValue(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseEventTimeMinutes(time) {
  if (!time) return Number.NaN

  const [hourMinute, period] = time.includes(' ') ? time.split(' ') : [time, null]
  const [hourValue, minuteValue = 0] = hourMinute.split(':').map(Number)
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return Number.NaN

  let hour = hourValue
  if (period) {
    const normalizedPeriod = period.toUpperCase()
    if (normalizedPeriod === 'PM' && hour !== 12) hour += 12
    if (normalizedPeriod === 'AM' && hour === 12) hour = 0
  }

  return hour * 60 + minuteValue
}

export function buildEventDateTime(dateInput, time) {
  if (!dateInput) return null
  const minutes = parseEventTimeMinutes(time)
  const date = new Date(`${dateInput}T00:00:00`)
  if (Number.isNaN(date.getTime()) || Number.isNaN(minutes)) return null

  date.setMinutes(minutes)
  return date
}
