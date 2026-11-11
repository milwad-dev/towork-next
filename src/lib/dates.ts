import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export const WEEK_STARTS_ON = 1 // Monday

/** Format a Date as the API's `YYYY-MM-DD`. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayISO(now = new Date()): string {
  return toISODate(now)
}

/** Parse an API `YYYY-MM-DD` date as a local date (not UTC). */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = parseISO(String(value).slice(0, 10))
  return isValid(d) ? d : null
}

/** Days from today to the given ISO date (negative = past). */
export function daysFromToday(value: string | null | undefined, now = new Date()): number | null {
  const d = parseDate(value)
  return d ? differenceInCalendarDays(d, now) : null
}

/**
 * Human label for a due date: "Today", "Tomorrow", "Yesterday", weekday within
 * the next week, otherwise "Mar 4" (or "Mar 4, 2027" outside this year).
 */
export function formatDue(value: string | null | undefined, now = new Date()): string {
  const d = parseDate(value)
  if (!d) return ''
  const diff = differenceInCalendarDays(d, now)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return format(d, 'EEEE')
  return format(d, d.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy')
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later' | 'none'

/** Tone of a due chip. */
export function dueTone(value: string | null | undefined, done = false, now = new Date()): DueTone {
  const diff = daysFromToday(value, now)
  if (diff === null) return 'none'
  if (done) return 'later'
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 2) return 'soon'
  return 'later'
}

/** "14:30" -> "2:30 PM" style based on the user's locale. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return ''
  const [h, m] = String(value).split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** Heading for a group of tasks on a given date in the Upcoming view. */
export function dayHeading(value: string | null | undefined, now = new Date()): string {
  const d = parseDate(value)
  if (!d) return 'No date'
  const diff = differenceInCalendarDays(d, now)
  const base = format(d, 'EEE, MMM d')
  if (diff === 0) return `Today · ${base}`
  if (diff === 1) return `Tomorrow · ${base}`
  return base
}

/** The 5×7 or 6×7 grid of dates that covers a month, Monday first. */
export function monthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON })
  const days: Date[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return days
}

/** Quick date options shown in date pickers. */
export function quickDates(now = new Date()) {
  const nextMonday = addDays(startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }), 7)
  return [
    { key: 'today', label: 'Today', value: toISODate(now) },
    { key: 'tomorrow', label: 'Tomorrow', value: toISODate(addDays(now, 1)) },
    { key: 'next-week', label: 'Next week', value: toISODate(nextMonday) },
  ]
}

/** Convert an API ISO timestamp to a `datetime-local` input value (local time). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (!isValid(d)) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

/** Convert a `datetime-local` input value back to an ISO timestamp (UTC). */
export function fromLocalInput(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  return isValid(d) ? d.toISOString() : null
}
