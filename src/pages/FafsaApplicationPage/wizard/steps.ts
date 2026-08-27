import {
  requiresParentIncome,
  requiresSpouseInformation,
  type FafsaFieldName,
  type FafsaFormValues,
} from '../../../domain/schema'

export interface WizardStep {
  readonly id: string
  readonly title: string
  /**
   * The fields this step is responsible for, given the answers so far.
   *
   * Conditional fields are absent until they apply, so "Next" never validates a
   * field the user cannot see — the classic way a wizard traps someone on a
   * step with no visible reason.
   */
  readonly fieldsFor: (values: FafsaFormValues) => readonly FafsaFieldName[]
}

export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    id: 'student-information',
    title: 'Student information',
    fieldsFor: () => ['firstName', 'lastName', 'ssn', 'dateOfBirth', 'stateOfResidence'],
  },
  {
    id: 'status',
    title: 'Status',
    fieldsFor: (values) =>
      requiresSpouseInformation(values)
        ? ['dependencyStatus', 'maritalStatus', 'spouseFirstName', 'spouseLastName', 'spouseSsn']
        : ['dependencyStatus', 'maritalStatus'],
  },
  {
    id: 'household-and-finances',
    title: 'Household and finances',
    fieldsFor: (values) =>
      requiresParentIncome(values)
        ? ['numberInHousehold', 'numberInCollege', 'studentIncome', 'parentIncome']
        : ['numberInHousehold', 'numberInCollege', 'studentIncome'],
  },
  {
    id: 'review',
    title: 'Review and submit',
    fieldsFor: () => [],
  },
]

export const REVIEW_STEP_INDEX = WIZARD_STEPS.length - 1

/**
 * Field labels for the error summary, which has to name a field the user has
 * possibly scrolled past. These match the visible labels exactly — a summary
 * that calls a field something different from its label sends the user hunting.
 */
export const FIELD_LABELS: Record<FafsaFieldName, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  ssn: 'Social Security number',
  dateOfBirth: 'Date of birth',
  stateOfResidence: 'State of legal residence',
  dependencyStatus: 'Dependency status',
  maritalStatus: 'Marital status',
  spouseFirstName: "Spouse's first name",
  spouseLastName: "Spouse's last name",
  spouseSsn: "Spouse's Social Security number",
  numberInHousehold: 'Number in household',
  numberInCollege: 'Number in college',
  studentIncome: 'Your income',
  parentIncome: 'Parent income',
}

/** The step a given field lives on, so the summary can jump to the right one. */
export function stepIndexForField(field: FafsaFieldName, values: FafsaFormValues): number {
  return WIZARD_STEPS.findIndex((step) => step.fieldsFor(values).includes(field))
}
