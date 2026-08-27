const EM_DASH = '—'

const wholeDollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const centsFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/**
 * Full years elapsed between `dateOfBirth` and `asOf`.
 *
 * `asOf` is a parameter rather than an internal `new Date()` so that callers —
 * and tests — control the reference point. A birthday falling on `asOf` counts
 * as reached, which is how age eligibility is read in practice. A future birth
 * date yields a negative number so callers can reject it rather than silently
 * seeing zero.
 */
export function calculateAge(dateOfBirth: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear()
  const monthDelta = asOf.getMonth() - dateOfBirth.getMonth()
  const hasHadBirthdayThisYear =
    monthDelta > 0 || (monthDelta === 0 && asOf.getDate() >= dateOfBirth.getDate())

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  return age
}

/**
 * Renders an amount for display. Whole dollars drop the ".00" as noise, but an
 * amount with cents shows both digits — "$1,234.5" reads as broken.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return EM_DASH
  }

  return Number.isInteger(value)
    ? wholeDollarFormatter.format(value)
    : centsFormatter.format(value)
}

/**
 * Formats digits as XXX-XX-XXXX, laying in hyphens only once the surrounding
 * digits exist so partial input stays readable while the user is still typing.
 * Anything that is not a digit is discarded, as are digits past the ninth.
 */
export function normalizeSsn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Parses a YYYY-MM-DD string into a date in the viewer's own timezone.
 *
 * `new Date('2003-05-15')` parses as UTC midnight, which lands on 14 May for
 * anyone west of Greenwich and would silently shift a birthday by a day. Naming
 * the parts avoids that. Returns null for anything that is not a real calendar
 * date, including 31 February.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const match = ISO_DATE_PATTERN.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  const isRealCalendarDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)

  return isRealCalendarDate ? date : null
}

/** Renders a date the way <input type="date"> reads and writes it. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Spells the month out; "05/15/2003" is read differently around the world. */
export function formatDateOfBirth(value: string | null | undefined): string {
  const date = parseIsoDate(value)

  if (!date) {
    return EM_DASH
  }

  return dateFormatter.format(date)
}
