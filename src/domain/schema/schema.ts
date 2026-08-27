import { z } from 'zod'
import { calculateAge } from '../format'
import { US_STATE_CODES } from '../states'

export const DEPENDENCY_STATUSES = ['dependent', 'independent'] as const
export const MARITAL_STATUSES = ['single', 'married'] as const

export type DependencyStatus = (typeof DEPENDENCY_STATUSES)[number]
export type MaritalStatus = (typeof MARITAL_STATUSES)[number]

/** Mantine's NumberInput yields '' while a numeric field is empty. */
export type NumericValue = number | ''

export interface FafsaFormValues {
  firstName: string
  lastName: string
  ssn: string
  dateOfBirth: Date | null
  stateOfResidence: string
  dependencyStatus: DependencyStatus | ''
  maritalStatus: MaritalStatus | ''
  spouseFirstName: string
  spouseLastName: string
  spouseSsn: string
  numberInHousehold: NumericValue
  numberInCollege: NumericValue
  studentIncome: NumericValue
  parentIncome: NumericValue
}

export const MINIMUM_STUDENT_AGE = 14

const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/

/**
 * The form is held flat rather than nested. Flat names keep react-hook-form
 * registration, the per-step field lists and the error summary's field lookup
 * trivial; the nested shape the API expects is produced by
 * `toApplicationPayload` at submit time instead.
 */
export const defaultFafsaFormValues: FafsaFormValues = {
  firstName: '',
  lastName: '',
  ssn: '',
  dateOfBirth: null,
  stateOfResidence: '',
  dependencyStatus: '',
  maritalStatus: '',
  spouseFirstName: '',
  spouseLastName: '',
  spouseSsn: '',
  numberInHousehold: '',
  numberInCollege: '',
  studentIncome: '',
  parentIncome: '',
}

const numericValue = z.union([z.number(), z.literal('')])

/**
 * The base schema checks *shape* only — every content rule lives in the
 * superRefine below.
 *
 * This matters: Zod skips refinements when the underlying schema fails, so a
 * single bad field would suppress every cross-field error and the user would
 * fix one problem only to be shown the next. Keeping the base permissive means
 * one parse reports all outstanding problems at once, which is what the error
 * summary promises.
 */
const baseSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  ssn: z.string(),
  dateOfBirth: z.date().nullable(),
  stateOfResidence: z.string(),
  dependencyStatus: z.union([z.enum(DEPENDENCY_STATUSES), z.literal('')]),
  maritalStatus: z.union([z.enum(MARITAL_STATUSES), z.literal('')]),
  spouseFirstName: z.string(),
  spouseLastName: z.string(),
  spouseSsn: z.string(),
  numberInHousehold: numericValue,
  numberInCollege: numericValue,
  studentIncome: numericValue,
  parentIncome: numericValue,
})

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

/**
 * Whether spouse details apply. Exported so the form can decide what to render
 * and the wizard can decide what to validate from the same predicate the schema
 * uses — one definition of "applies", not three.
 */
export function requiresSpouseInformation(values: Pick<FafsaFormValues, 'maritalStatus'>): boolean {
  return values.maritalStatus === 'married'
}

/** Whether parent income applies. Same single-source reasoning as above. */
export function requiresParentIncome(values: Pick<FafsaFormValues, 'dependencyStatus'>): boolean {
  return values.dependencyStatus === 'dependent'
}

export const fafsaFormSchema = baseSchema.superRefine((values, ctx) => {
  const addIssue = (path: keyof FafsaFormValues, message: string) => {
    ctx.addIssue({ code: 'custom', path: [path], message })
  }

  if (isBlank(values.firstName)) {
    addIssue('firstName', 'Enter your first name as it appears on your Social Security card.')
  }

  if (isBlank(values.lastName)) {
    addIssue('lastName', 'Enter your last name as it appears on your Social Security card.')
  }

  // Rule 2 — SSN format.
  if (isBlank(values.ssn)) {
    addIssue('ssn', 'Enter your 9-digit Social Security number, for example 123-45-6789.')
  } else if (!SSN_PATTERN.test(values.ssn)) {
    addIssue(
      'ssn',
      'Social Security number must be 9 digits in the format XXX-XX-XXXX, for example 123-45-6789.',
    )
  }

  // Rule 1 — the student must be at least 14.
  if (!values.dateOfBirth) {
    addIssue('dateOfBirth', 'Enter your date of birth.')
  } else {
    const age = calculateAge(values.dateOfBirth)

    if (age < 0) {
      addIssue('dateOfBirth', 'Date of birth cannot be in the future. Check the year you entered.')
    } else if (age < MINIMUM_STUDENT_AGE) {
      addIssue(
        'dateOfBirth',
        `You must be at least ${MINIMUM_STUDENT_AGE} years old to apply. The date entered makes you ${age} years old — check the year.`,
      )
    }
  }

  // Rule 6 — state of legal residence.
  if (isBlank(values.stateOfResidence)) {
    addIssue('stateOfResidence', 'Select your state of legal residence.')
  } else if (!US_STATE_CODES.includes(values.stateOfResidence)) {
    addIssue(
      'stateOfResidence',
      'Select a state of legal residence from the list of US states and territories.',
    )
  }

  if (values.dependencyStatus === '') {
    addIssue('dependencyStatus', 'Select whether you are a dependent or independent student.')
  }

  if (values.maritalStatus === '') {
    addIssue('maritalStatus', 'Select your marital status.')
  }

  // Rule 7 — spouse details are required once the student is married.
  if (requiresSpouseInformation(values)) {
    if (isBlank(values.spouseFirstName)) {
      addIssue('spouseFirstName', "Enter your spouse's first name. Married applicants must report spouse details.")
    }

    if (isBlank(values.spouseLastName)) {
      addIssue('spouseLastName', "Enter your spouse's last name. Married applicants must report spouse details.")
    }

    if (isBlank(values.spouseSsn)) {
      addIssue('spouseSsn', "Enter your spouse's 9-digit Social Security number, for example 123-45-6789.")
    } else if (!SSN_PATTERN.test(values.spouseSsn)) {
      addIssue(
        'spouseSsn',
        "Spouse's Social Security number must be 9 digits in the format XXX-XX-XXXX.",
      )
    }
  }

  // Household counts must both be at least 1 — the student is always counted.
  if (values.numberInHousehold === '') {
    addIssue('numberInHousehold', 'Enter how many people are in your household, including yourself.')
  } else if (!Number.isInteger(values.numberInHousehold)) {
    addIssue('numberInHousehold', 'Enter the number of people in your household as a whole number.')
  } else if (values.numberInHousehold < 1) {
    addIssue(
      'numberInHousehold',
      'Your household must include at least 1 person — count yourself.',
    )
  }

  if (values.numberInCollege === '') {
    addIssue('numberInCollege', 'Enter how many people in your household will attend college, including yourself.')
  } else if (!Number.isInteger(values.numberInCollege)) {
    addIssue('numberInCollege', 'Enter the number attending college as a whole number.')
  } else if (values.numberInCollege < 1) {
    addIssue(
      'numberInCollege',
      'At least 1 person must be attending college — count yourself.',
    )
  } else if (
    // Rule 5 — household logic.
    typeof values.numberInHousehold === 'number' &&
    values.numberInCollege > values.numberInHousehold
  ) {
    addIssue(
      'numberInCollege',
      `Number in college (${values.numberInCollege}) cannot be more than the number in your household (${values.numberInHousehold}). Lower this number or increase your household size.`,
    )
  }

  // Rule 4 — income cannot be negative.
  if (values.studentIncome === '') {
    addIssue('studentIncome', 'Enter your income for the tax year. Enter 0 if you had no income.')
  } else if (values.studentIncome < 0) {
    addIssue('studentIncome', 'Income cannot be negative. Enter 0 if you had no income.')
  }

  // Rule 3 — dependent students must report parent income.
  if (requiresParentIncome(values)) {
    if (values.parentIncome === '') {
      addIssue(
        'parentIncome',
        'Dependent students must report parent income. Enter 0 if your parents had no income.',
      )
    } else if (values.parentIncome < 0) {
      addIssue('parentIncome', 'Income cannot be negative. Enter 0 if your parents had no income.')
    }
  } else if (typeof values.parentIncome === 'number' && values.parentIncome < 0) {
    addIssue('parentIncome', 'Income cannot be negative. Enter 0 if your parents had no income.')
  }
})

export type FafsaFieldName = keyof FafsaFormValues
