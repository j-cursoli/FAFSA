import { describe, expect, it } from 'vitest'
import { calculateAge, formatCurrency, formatDateOfBirth, normalizeSsn } from './format'

describe('calculateAge', () => {
  // Every case pins "today" explicitly so the suite cannot start failing on a
  // future date, which is the classic way age tests rot.
  const today = new Date(2026, 7, 26) // 26 Aug 2026

  it('counts full years that have elapsed', () => {
    expect(calculateAge(new Date(2003, 4, 15), today)).toBe(23)
  })

  it('treats a birthday that falls today as having been reached', () => {
    expect(calculateAge(new Date(2012, 7, 26), today)).toBe(14)
  })

  it('does not count a birthday that is still to come this year', () => {
    expect(calculateAge(new Date(2012, 7, 27), today)).toBe(13)
  })

  it('does not count a birthday later in the same month', () => {
    expect(calculateAge(new Date(2012, 8, 1), today)).toBe(13)
  })

  it('handles a 29 February birth date in a non-leap year', () => {
    expect(calculateAge(new Date(2008, 1, 29), new Date(2026, 1, 28))).toBe(17)
    expect(calculateAge(new Date(2008, 1, 29), new Date(2026, 2, 1))).toBe(18)
  })

  it('reports zero for someone born today', () => {
    expect(calculateAge(today, today)).toBe(0)
  })

  it('reports a negative age for a future date so callers can reject it', () => {
    expect(calculateAge(new Date(2027, 0, 1), today)).toBeLessThan(0)
  })
})

describe('formatCurrency', () => {
  it('renders whole dollars with grouping and no trailing cents', () => {
    expect(formatCurrency(65000)).toBe('$65,000')
  })

  it('renders zero as a dollar amount rather than an empty value', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('keeps cents when the amount is not a whole dollar', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
  })

  it('returns an em dash when there is no amount to show', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
  })
})

describe('normalizeSsn', () => {
  it('inserts the hyphens a reader expects once all nine digits are present', () => {
    expect(normalizeSsn('123456789')).toBe('123-45-6789')
  })

  it('leaves an already formatted number untouched', () => {
    expect(normalizeSsn('123-45-6789')).toBe('123-45-6789')
  })

  it('strips characters that are not digits', () => {
    expect(normalizeSsn('123 45 6789')).toBe('123-45-6789')
    expect(normalizeSsn('123.45.6789')).toBe('123-45-6789')
  })

  it('formats partial input as far as it can so typing stays readable', () => {
    expect(normalizeSsn('12')).toBe('12')
    expect(normalizeSsn('1234')).toBe('123-4')
    expect(normalizeSsn('123456')).toBe('123-45-6')
  })

  it('ignores digits beyond the ninth', () => {
    expect(normalizeSsn('1234567890123')).toBe('123-45-6789')
  })

  it('returns an empty string when there is nothing to format', () => {
    expect(normalizeSsn('')).toBe('')
    expect(normalizeSsn('abc')).toBe('')
  })
})

describe('formatDateOfBirth', () => {
  it('spells the month out so the date is unambiguous when reviewed', () => {
    expect(formatDateOfBirth(new Date(2003, 4, 15))).toBe('May 15, 2003')
  })

  it('returns an em dash when no date has been entered', () => {
    expect(formatDateOfBirth(null)).toBe('—')
  })
})
