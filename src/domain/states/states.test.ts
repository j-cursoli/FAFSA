import { describe, expect, it } from 'vitest'
import { US_STATES, US_STATE_CODES, findStateByCode } from './states'

describe('US_STATES', () => {
  it('covers the 50 states, DC and the eligible territories', () => {
    expect(US_STATES).toHaveLength(56)
  })

  it('offers no duplicate codes for the user to choose between', () => {
    expect(new Set(US_STATE_CODES).size).toBe(US_STATE_CODES.length)
  })

  it('lists every state with a readable name', () => {
    for (const state of US_STATES) {
      expect(state.name.length).toBeGreaterThan(3)
      expect(state.code).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('includes territories whose residents are eligible for federal aid', () => {
    expect(US_STATE_CODES).toContain('PR')
    expect(US_STATE_CODES).toContain('GU')
    expect(US_STATE_CODES).toContain('DC')
  })
})

describe('findStateByCode', () => {
  it('resolves a code to the name a reader recognises', () => {
    expect(findStateByCode('CA')?.name).toBe('California')
  })

  it('returns nothing for a code that is not a state', () => {
    expect(findStateByCode('ZZ')).toBeUndefined()
  })
})
