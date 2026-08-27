import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraft, initialValuesFromDraft, loadDraft, saveDraft } from './useFormDraft'
import { defaultFafsaFormValues, type FafsaFormValues } from '../../../../domain/schema'

const completed: FafsaFormValues = {
  ...defaultFafsaFormValues,
  firstName: 'Jane',
  lastName: 'Smith',
  ssn: '123-45-6789',
  dateOfBirth: '2003-05-15',
  stateOfResidence: 'CA',
  dependencyStatus: 'dependent',
  maritalStatus: 'married',
  spouseFirstName: 'Alex',
  spouseLastName: 'Smith',
  spouseSsn: '987-65-4321',
  numberInHousehold: 4,
  numberInCollege: 1,
  studentIncome: 5000,
  parentIncome: 65000,
}

describe('saving a draft', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('brings the answers back after the page is reloaded', () => {
    saveDraft(completed)

    const restored = loadDraft()

    expect(restored?.firstName).toBe('Jane')
    expect(restored?.numberInHousehold).toBe(4)
    expect(restored?.dependencyStatus).toBe('dependent')
  })

  it('never writes a Social Security number to storage', () => {
    saveDraft(completed)

    // Not just absent from the parsed draft — absent from the raw string, so a
    // regression cannot hide behind the loader filtering it out on the way back.
    const raw = window.sessionStorage.getItem('fafsa-application-draft') ?? ''

    expect(raw).not.toContain('123-45-6789')
    expect(raw).not.toContain('987-65-4321')
    expect(loadDraft()?.firstName).toBe('Jane')
  })

  it('makes the user re-enter their Social Security number', () => {
    saveDraft(completed)

    const values = initialValuesFromDraft()

    expect(values.ssn).toBe('')
    expect(values.spouseSsn).toBe('')
    expect(values.firstName).toBe('Jane')
  })

  it('uses session storage, so the draft dies with the tab', () => {
    saveDraft(completed)

    expect(window.sessionStorage.getItem('fafsa-application-draft')).not.toBeNull()
    expect(window.localStorage.getItem('fafsa-application-draft')).toBeNull()
  })

  it('starts from a blank form when nothing was saved', () => {
    expect(loadDraft()).toBeNull()
    expect(initialValuesFromDraft()).toEqual(defaultFafsaFormValues)
  })

  it('forgets the draft once it is cleared', () => {
    saveDraft(completed)
    clearDraft()

    expect(loadDraft()).toBeNull()
  })
})

describe('when the stored draft cannot be trusted', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('falls back to a blank form rather than crashing on damaged data', () => {
    window.sessionStorage.setItem('fafsa-application-draft', 'not json{')

    expect(loadDraft()).toBeNull()
    expect(initialValuesFromDraft()).toEqual(defaultFafsaFormValues)
  })

  it('ignores fields the form does not have', () => {
    window.sessionStorage.setItem(
      'fafsa-application-draft',
      JSON.stringify({ firstName: 'Jane', isAdmin: true }),
    )

    const values = initialValuesFromDraft()

    expect(values.firstName).toBe('Jane')
    expect('isAdmin' in values).toBe(false)
  })

  it('ignores a Social Security number planted in storage', () => {
    window.sessionStorage.setItem(
      'fafsa-application-draft',
      JSON.stringify({ firstName: 'Jane', ssn: '111-22-3333' }),
    )

    expect(initialValuesFromDraft().ssn).toBe('')
  })
})
