const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/

/** Returns YYYY-MM-DD in the user's local timezone (not UTC). */
export const getLocalDateISO = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Validates a YYYY-MM-DD calendar date string. */
export const isValidDateISO = (dateStr: string): boolean => {
  if (!DATE_ISO_RE.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Coerces to a valid local date string, falling back to today. */
export const coerceDateISO = (dateStr?: string | null): string =>
  dateStr && isValidDateISO(dateStr.trim()) ? dateStr.trim() : getLocalDateISO()

/** Extracts the local calendar date from an ISO timestamp string. */
export const getLocalDateFromISO = (iso: string): string =>
  getLocalDateISO(new Date(iso))

/** Local calendar day bounds as ISO timestamps for Supabase range queries. */
export const getLocalDayBoundsISO = (dateStr: string): { start: string; end: string } => {
  const safe = coerceDateISO(dateStr)
  const [year, month, day] = safe.split('-').map(Number)
  const start = new Date(year, month - 1, day, 0, 0, 0, 0)
  const end = new Date(year, month - 1, day, 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export const getLocalRangeBoundsISO = (from: string, to: string): { start: string; end: string } => {
  const safeFrom = coerceDateISO(from)
  const safeTo = coerceDateISO(to)
  const start = getLocalDayBoundsISO(safeFrom).start
  const end = getLocalDayBoundsISO(safeTo).end
  return { start, end }
}
