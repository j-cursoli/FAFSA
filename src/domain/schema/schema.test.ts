import { describe, expect, it } from 'vitest'
import { defaultFafsaFormValues, fafsaFormSchema, type FafsaFormValues } from './schema'

/** A date of birth that puts the applicant exactly `years` years old today. */
function bornYearsAgo(years: number): Date {
  const today = new Date()
  return new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
}

/**
 * The valid application from the assignment's sample data, expressed as form
 * values. The literal 2003-05-15 is replaced with a relative date so the
 * fixture keeps meaning "an adult applicant" as years pass.
 */
const validApplication: FafsaFormValues = {
  ...defaultFafsaFormValues,
  firstName: 'Jane',
  lastName: 'Smith',
  ssn: '123-45-6789',
  dateOfBirth: bornYearsAgo(23),
  stateOfResidence: 'CA',
  dependencyStatus: 'dependent',
  maritalStatus: 'single',
  numberInHousehold: 4,
  numberInCollege: 1,
  studentIncome: 5000,
  parentIncome: 65000,
}

/** The assignment's invalid application, which breaks seven rules at once. */
const invalidApplication: FafsaFormValues = {
  ...defaultFafsaFormValues,
  firstName: 'John',
  lastName: 'Doe',
  ssn: 'invalid',
  dateOfBirth: bornYearsAgo(9),
  stateOfResidence: '',
  dependencyStatus: 'dependent',
  maritalStatus: 'married',
  spouseFirstName: '',
  spouseLastName: '',
  spouseSsn: '',
  numberInHousehold: 2,
  numberInCollege: 5,
  studentIncome: -1000,
  parentIncome: '',
}

/** Field paths that failed, so tests read as "which fields are flagged". */
function failingFields(values: FafsaFormValues): string[] {
  const result = fafsaFormSchema.safeParse(values)
  if (result.success) return []
  return result.error.issues.map((issue) => String(issue.path[0]))
}

function messageFor(values: FafsaFormValues, field: keyof FafsaFormValues): string | undefined {
  const result = fafsaFormSchema.safeParse(values)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('the assignment sample applications', () => {
  it('accepts the valid application', () => {
    expect(fafsaFormSchema.safeParse(validApplication).success).toBe(true)
  })

  it('accepts an independent, married applicant with complete spouse details', () => {
    const independentMarried: FafsaFormValues = {
      ...validApplication,
      dependencyStatus: 'independent',
      maritalStatus: 'married',
      spouseFirstName: 'Alex',
      spouseLastName: 'Smith',
      spouseSsn: '987-65-4321',
      parentIncome: '',
    }

    expect(fafsaFormSchema.safeParse(independentMarried).success).toBe(true)
  })

  it('reports every problem in the invalid application at once, not one at a time', () => {
    // The assignment lists seven distinct problems; a user who fixes one should
    // not have to submit again to discover the next.
    expect(failingFields(invalidApplication)).toEqual(
      expect.arrayContaining([
        'ssn',
        'dateOfBirth',
        'stateOfResidence',
        'spouseFirstName',
        'spouseLastName',
        'spouseSsn',
        'numberInCollege',
        'studentIncome',
        'parentIncome',
      ]),
    )
  })

  it('finds nothing wrong with the fields the invalid application got right', () => {
    const flagged = failingFields(invalidApplication)

    expect(flagged).not.toContain('firstName')
    expect(flagged).not.toContain('lastName')
    expect(flagged).not.toContain('numberInHousehold')
    expect(flagged).not.toContain('dependencyStatus')
    expect(flagged).not.toContain('maritalStatus')
  })
})

describe('rule 1 — the student must be at least 14 years old', () => {
  it('accepts an applicant whose 14th birthday is today', () => {
    const values = { ...validApplication, dateOfBirth: bornYearsAgo(14) }
    expect(failingFields(values)).not.toContain('dateOfBirth')
  })

  it('rejects an applicant one day short of 14', () => {
    const almost = bornYearsAgo(14)
    almost.setDate(almost.getDate() + 1)

    expect(failingFields({ ...validApplication, dateOfBirth: almost })).toContain('dateOfBirth')
  })

  it('explains the minimum age and the age the entered date implies', () => {
    const message = messageFor({ ...validApplication, dateOfBirth: bornYearsAgo(9) }, 'dateOfBirth')

    expect(message).toMatch(/at least 14 years old/i)
    expect(message).toMatch(/9 years old/i)
  })

  it('rejects a date of birth in the future with its own explanation', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)

    expect(messageFor({ ...validApplication, dateOfBirth: future }, 'dateOfBirth')).toMatch(
      /cannot be in the future/i,
    )
  })

  it('requires a date of birth at all', () => {
    expect(messageFor({ ...validApplication, dateOfBirth: null }, 'dateOfBirth')).toMatch(
      /enter your date of birth/i,
    )
  })
})

describe('rule 2 — SSN format', () => {
  it('accepts a correctly formatted number', () => {
    expect(failingFields({ ...validApplication, ssn: '000-11-2222' })).not.toContain('ssn')
  })

  it.each(['invalid', '123456789', '12-345-6789', '123-45-678', '123-45-67890', 'abc-de-fghi'])(
    'rejects %s',
    (ssn) => {
      expect(failingFields({ ...validApplication, ssn })).toContain('ssn')
    },
  )

  it('shows the expected format in the error message', () => {
    expect(messageFor({ ...validApplication, ssn: 'invalid' }, 'ssn')).toMatch(/XXX-XX-XXXX/)
  })
})

describe('rule 3 — dependent students must report parent income', () => {
  it('requires parent income when the student is dependent', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      dependencyStatus: 'dependent',
      parentIncome: '',
    }

    expect(messageFor(values, 'parentIncome')).toMatch(/dependent students must report parent income/i)
  })

  it('accepts zero as a reported parent income', () => {
    const values: FafsaFormValues = { ...validApplication, parentIncome: 0 }
    expect(failingFields(values)).not.toContain('parentIncome')
  })

  it('does not require parent income from an independent student', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      dependencyStatus: 'independent',
      parentIncome: '',
    }

    expect(failingFields(values)).not.toContain('parentIncome')
  })
})

describe('rule 4 — income cannot be negative', () => {
  it('rejects negative student income', () => {
    expect(messageFor({ ...validApplication, studentIncome: -1000 }, 'studentIncome')).toMatch(
      /cannot be negative/i,
    )
  })

  it('rejects negative parent income', () => {
    expect(messageFor({ ...validApplication, parentIncome: -1 }, 'parentIncome')).toMatch(
      /cannot be negative/i,
    )
  })

  it('accepts zero income', () => {
    const values: FafsaFormValues = { ...validApplication, studentIncome: 0, parentIncome: 0 }
    expect(fafsaFormSchema.safeParse(values).success).toBe(true)
  })

  it('tells the user that zero is the value to enter when they had no income', () => {
    expect(messageFor({ ...validApplication, studentIncome: '' }, 'studentIncome')).toMatch(
      /enter 0/i,
    )
  })
})

describe('rule 5 — number in college cannot exceed the household', () => {
  it('rejects more people in college than in the household', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      numberInHousehold: 2,
      numberInCollege: 5,
    }

    const message = messageFor(values, 'numberInCollege')
    expect(message).toContain('(5)')
    expect(message).toContain('(2)')
    expect(message).toMatch(/lower this number or increase your household size/i)
  })

  it('accepts a whole household attending college', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      numberInHousehold: 3,
      numberInCollege: 3,
    }

    expect(failingFields(values)).not.toContain('numberInCollege')
  })

  it('requires at least one person in the household and in college', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      numberInHousehold: 0,
      numberInCollege: 0,
    }

    expect(messageFor(values, 'numberInHousehold')).toMatch(/at least 1 person/i)
    expect(messageFor(values, 'numberInCollege')).toMatch(/at least 1 person/i)
  })
})

describe('rule 6 — state of legal residence must be a real US state', () => {
  it('accepts a state code from the list', () => {
    expect(failingFields({ ...validApplication, stateOfResidence: 'PR' })).not.toContain(
      'stateOfResidence',
    )
  })

  it('rejects a code that is not a state', () => {
    expect(messageFor({ ...validApplication, stateOfResidence: 'ZZ' }, 'stateOfResidence')).toMatch(
      /from the list/i,
    )
  })

  it('asks the user to choose when nothing is selected', () => {
    expect(messageFor({ ...validApplication, stateOfResidence: '' }, 'stateOfResidence')).toMatch(
      /select your state of legal residence/i,
    )
  })
})

describe('rule 7 — married students must supply spouse information', () => {
  it('requires all three spouse fields when married', () => {
    const values: FafsaFormValues = { ...validApplication, maritalStatus: 'married' }
    const flagged = failingFields(values)

    expect(flagged).toContain('spouseFirstName')
    expect(flagged).toContain('spouseLastName')
    expect(flagged).toContain('spouseSsn')
  })

  it("validates the spouse's SSN format too", () => {
    const values: FafsaFormValues = {
      ...validApplication,
      maritalStatus: 'married',
      spouseFirstName: 'Alex',
      spouseLastName: 'Smith',
      spouseSsn: '12345',
    }

    expect(messageFor(values, 'spouseSsn')).toMatch(/XXX-XX-XXXX/)
  })

  it('ignores spouse fields entirely when the student is single', () => {
    const values: FafsaFormValues = { ...validApplication, maritalStatus: 'single' }
    const flagged = failingFields(values)

    expect(flagged).not.toContain('spouseFirstName')
    expect(flagged).not.toContain('spouseLastName')
    expect(flagged).not.toContain('spouseSsn')
  })
})

describe('required identity fields', () => {
  it('requires a first and last name', () => {
    const values: FafsaFormValues = { ...validApplication, firstName: '', lastName: '   ' }

    expect(messageFor(values, 'firstName')).toMatch(/enter your first name/i)
    expect(messageFor(values, 'lastName')).toMatch(/enter your last name/i)
  })

  it('requires both status answers', () => {
    const values: FafsaFormValues = {
      ...validApplication,
      dependencyStatus: '',
      maritalStatus: '',
    }

    expect(messageFor(values, 'dependencyStatus')).toMatch(/dependent or independent/i)
    expect(messageFor(values, 'maritalStatus')).toMatch(/marital status/i)
  })
})

describe('an empty form', () => {
  it('flags every required field rather than only the first', () => {
    const flagged = failingFields(defaultFafsaFormValues)

    expect(flagged).toEqual(
      expect.arrayContaining([
        'firstName',
        'lastName',
        'ssn',
        'dateOfBirth',
        'stateOfResidence',
        'dependencyStatus',
        'maritalStatus',
        'numberInHousehold',
        'numberInCollege',
        'studentIncome',
      ]),
    )
  })
})
