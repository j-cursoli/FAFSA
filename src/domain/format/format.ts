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

/** Spells the month out; "05/15/2003" is read differently around the world. */
export function formatDateOfBirth(value: Date | null | undefined): string {
  if (!value) {
    return EM_DASH
  }

  return dateFormatter.format(value)
}
