import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../../test/renderWithProviders'
import { FafsaWizard } from './FafsaWizard'
import type { FafsaFormValues } from '../../../domain/schema'

type User = ReturnType<typeof renderWithProviders>['user']

function stepHeading(name: RegExp) {
  return screen.getByRole('heading', { level: 2, name })
}

async function completeStudentInformation(user: User) {
  await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane')
  await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Smith')
  await user.type(screen.getByRole('textbox', { name: /social security number/i }), '123456789')
  await user.type(screen.getByLabelText(/date of birth/i), '2003-05-15')
  await user.selectOptions(
    screen.getByRole('combobox', { name: /state of legal residence/i }),
    'CA',
  )
  await user.click(screen.getByRole('button', { name: /next/i }))
}

async function completeStatus(user: User) {
  await user.click(screen.getByRole('radio', { name: 'Dependent' }))
  await user.click(screen.getByRole('radio', { name: 'Single' }))
  await user.click(screen.getByRole('button', { name: /next/i }))
}

async function completeHouseholdAndFinances(user: User) {
  await user.type(screen.getByRole('textbox', { name: /number in household/i }), '4')
  await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
  await user.type(screen.getByRole('textbox', { name: /your income/i }), '5000')
  await user.type(screen.getByRole('textbox', { name: /parent income/i }), '65000')
  await user.click(screen.getByRole('button', { name: /next/i }))
}

describe('moving through the wizard', () => {
  it('starts the user on the first step', () => {
    renderWithProviders(<FafsaWizard />)

    expect(stepHeading(/student information/i)).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4: Student information')).toBeInTheDocument()
  })

  it('cannot go back from the first step', () => {
    renderWithProviders(<FafsaWizard />)

    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })

  it('keeps the user on the step when required answers are missing', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(stepHeading(/student information/i)).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('advances once the step is complete', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)

    expect(await screen.findByRole('heading', { level: 2, name: /^status$/i })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 4: Status')).toBeInTheDocument()
  })

  it('remembers what the user typed when they go back', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('Jane')
    expect(screen.getByRole('textbox', { name: /social security number/i })).toHaveValue(
      '123-45-6789',
    )
  })

  it('does not hold a step against answers that belong to a later one', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    // Income lives two steps away; the first step must not refuse to advance
    // because of a field the user has not been shown yet.
    await completeStudentInformation(user)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('reporting problems', () => {
  it('lists every problem on the step, not just the first', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    const summary = await screen.findByRole('alert')
    expect(within(summary).getByRole('link', { name: /first name/i })).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: /last name/i })).toBeInTheDocument()
    expect(
      within(summary).getByRole('link', { name: /social security number/i }),
    ).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: /date of birth/i })).toBeInTheDocument()
    expect(
      within(summary).getByRole('link', { name: /state of legal residence/i }),
    ).toBeInTheDocument()
  })

  it('counts the problems in the summary heading', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/there are 5 problems with your answers/i)).toBeInTheDocument()
  })

  it('uses the singular when only one problem remains', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane')
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Smith')
    await user.type(screen.getByRole('textbox', { name: /social security number/i }), '123456789')
    await user.type(screen.getByLabelText(/date of birth/i), '2003-05-15')
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/there is 1 problem with your answers/i)).toBeInTheDocument()
  })

  it('names the field and explains the fix in each entry', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.type(screen.getByRole('textbox', { name: /social security number/i }), '12345')
    await user.click(screen.getByRole('button', { name: /next/i }))

    const summary = await screen.findByRole('alert')
    expect(summary).toHaveTextContent(/social security number.*XXX-XX-XXXX/i)
  })

  it('moves focus to the field a summary link names', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))
    const summary = await screen.findByRole('alert')

    await user.click(within(summary).getByRole('link', { name: /date of birth/i }))

    await waitFor(() => expect(screen.getByLabelText(/date of birth/i)).toHaveFocus())
  })

  it('clears the summary once the answers are fixed', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await completeStudentInformation(user)

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})

describe('focus and announcements', () => {
  it('moves focus to the new step heading so the user is not stranded', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /^status$/i })).toHaveFocus(),
    )
  })

  it('moves focus to the summary when the step refuses to advance', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
  })

  it('announces which step the user is on', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)
    await completeStudentInformation(user)

    const announcement = await screen.findByText('Step 2 of 4: Status')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
  })
})

describe('reviewing and submitting', () => {
  it('shows the answers back to the user before they submit', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)

    expect(await screen.findByRole('heading', { name: /review and submit/i })).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('123-45-6789')).toBeInTheDocument()
    expect(screen.getByText('May 15, 2003')).toBeInTheDocument()
    expect(screen.getByText('California')).toBeInTheDocument()
    expect(screen.getByText('$65,000')).toBeInTheDocument()
  })

  it('lets the user jump back to a section from the review', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)

    await user.click(await screen.findByRole('button', { name: /edit student information/i }))

    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('Jane')
  })

  it('hands over the completed application on submit', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))

    const values = onSubmit.mock.calls[0][0] as FafsaFormValues
    expect(values).toMatchObject({
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
    })
  })

  it('confirms the submission and greets the applicant by name', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    expect(await screen.findByRole('heading', { name: /application submitted/i })).toBeInTheDocument()
    expect(screen.getByText(/thank you, jane/i)).toBeInTheDocument()
  })

  it('moves focus to the confirmation so the change is not silent', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /application submitted/i })).toHaveFocus(),
    )
  })

  it('gives the user a clean form when they start another application', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await completeStatus(user)
    await completeHouseholdAndFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))
    await user.click(await screen.findByRole('button', { name: /start another application/i }))

    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('')
    expect(screen.getByText('Step 1 of 4: Student information')).toBeInTheDocument()
  })
})

describe('the married and independent path', () => {
  it('requires spouse details before letting a married applicant advance', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await user.click(screen.getByRole('radio', { name: 'Independent' }))
    await user.click(screen.getByRole('radio', { name: 'Married' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    const summary = await screen.findByRole('alert')
    expect(within(summary).getByRole('link', { name: /spouse's first name/i })).toBeInTheDocument()
  })

  it('does not ask an independent applicant for parent income', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeStudentInformation(user)
    await user.click(screen.getByRole('radio', { name: 'Independent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByRole('textbox', { name: /your income/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /parent income/i })).not.toBeInTheDocument()
  })

  it('completes end to end for a married independent applicant', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeStudentInformation(user)
    await user.click(screen.getByRole('radio', { name: 'Independent' }))
    await user.click(screen.getByRole('radio', { name: 'Married' }))
    await user.type(screen.getByRole('textbox', { name: /spouse's first name/i }), 'Alex')
    await user.type(screen.getByRole('textbox', { name: /spouse's last name/i }), 'Smith')
    await user.type(
      screen.getByRole('textbox', { name: /spouse's social security number/i }),
      '987654321',
    )
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.type(await screen.findByRole('textbox', { name: /number in household/i }), '2')
    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
    await user.type(screen.getByRole('textbox', { name: /your income/i }), '18000')
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      dependencyStatus: 'independent',
      maritalStatus: 'married',
      spouseSsn: '987-65-4321',
    })
  })
})
