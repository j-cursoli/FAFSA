import { describe, expect, it, vi } from 'vitest'
import { renderWithForm, screen, within } from '../../../../../test/renderWithForm'
import { ReviewStep } from './ReviewStep'
import type { FafsaFormValues } from '../../../../../domain/schema'

const completedApplication: Partial<FafsaFormValues> = {
  firstName: 'Jane',
  lastName: 'Smith',
  ssn: '123-45-6789',
  dateOfBirth: '2003-05-15',
  stateOfResidence: 'CA',
  dependencyStatus: 'dependent',
  maritalStatus: 'single',
  numberInHousehold: 4,
  numberInCollege: 1,
  studentIncome: 5000,
  parentIncome: 65000,
}

function valueFor(label: RegExp | string): string {
  const term = screen.getByText(label)
  const value = term.nextElementSibling
  return value?.textContent ?? ''
}

describe('ReviewStep', () => {
  it('reads the answers back in a form the user can check', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, { defaultValues: completedApplication })

    expect(valueFor('First name')).toBe('Jane')
    expect(valueFor('Last name')).toBe('Smith')
    expect(valueFor('Date of birth')).toBe('May 15, 2003')
    expect(valueFor('State of legal residence')).toBe('California')
  })

  it('shows the state by name rather than the code the user picked it by', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, {
      defaultValues: { ...completedApplication, stateOfResidence: 'PR' },
    })

    expect(valueFor('State of legal residence')).toBe('Puerto Rico')
  })

  it('shows the Social Security number in full', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, { defaultValues: completedApplication })

    // Masking it here would defeat the point: this is the user's last chance to
    // catch a typo in the number.
    expect(valueFor('Social Security number')).toBe('123-45-6789')
  })

  it('shows incomes as money', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, { defaultValues: completedApplication })

    expect(valueFor('Your income')).toBe('$5,000')
    expect(valueFor('Parent income')).toBe('$65,000')
  })

  it('shows zero income as an amount rather than as a blank', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, {
      defaultValues: { ...completedApplication, studentIncome: 0 },
    })

    expect(valueFor('Your income')).toBe('$0')
  })

  it('omits parent income for an independent applicant', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, {
      defaultValues: { ...completedApplication, dependencyStatus: 'independent' },
    })

    expect(screen.queryByText('Parent income')).not.toBeInTheDocument()
  })

  it('includes spouse details for a married applicant', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, {
      defaultValues: {
        ...completedApplication,
        maritalStatus: 'married',
        spouseFirstName: 'Alex',
        spouseLastName: 'Smith',
        spouseSsn: '987-65-4321',
      },
    })

    expect(valueFor("Spouse's first name")).toBe('Alex')
    expect(valueFor("Spouse's Social Security number")).toBe('987-65-4321')
  })

  it('marks an unanswered question rather than leaving the row blank', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />)

    expect(valueFor('First name')).toBe('—')
    expect(valueFor('Number in household')).toBe('—')
  })

  it('names which section each Edit control returns to', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, { defaultValues: completedApplication })

    // Three controls all reading "Edit" would be indistinguishable to anyone
    // navigating by a list of buttons.
    expect(screen.getByRole('button', { name: /edit applicant/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit dependency/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /edit finances/i }),
    ).toBeInTheDocument()
  })

  it('asks to return to the step the user chose to edit', async () => {
    const onEdit = vi.fn()
    const { user } = renderWithForm(<ReviewStep onEdit={onEdit} />, {
      defaultValues: completedApplication,
    })

    await user.click(screen.getByRole('button', { name: /edit finances/i }))

    expect(onEdit).toHaveBeenCalledWith(2)
  })

  it('groups each set of answers under its own heading', () => {
    renderWithForm(<ReviewStep onEdit={() => {}} />, { defaultValues: completedApplication })

    const section = screen.getByRole('region', { name: /^applicant$/i })
    expect(within(section).getByText('First name')).toBeInTheDocument()
  })
})
