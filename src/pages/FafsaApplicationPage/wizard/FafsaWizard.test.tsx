import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../../test/renderWithProviders'
import { FafsaWizard } from './FafsaWizard'
import type { FafsaFormValues } from '../../../domain/schema'

type User = ReturnType<typeof renderWithProviders>['user']

function stepHeading(name: RegExp) {
  return screen.getByRole('heading', { level: 2, name })
}

async function completeApplicantStep(user: User) {
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

async function completeDependency(user: User) {
  await user.click(screen.getByRole('radio', { name: 'Dependent' }))
  await user.click(screen.getByRole('radio', { name: 'Single' }))
  await user.click(screen.getByRole('button', { name: /next/i }))
}

async function completeFinances(user: User) {
  await user.type(screen.getByRole('textbox', { name: /number in household/i }), '4')
  await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
  await user.type(screen.getByRole('textbox', { name: /your income/i }), '5000')
  await user.type(screen.getByRole('textbox', { name: /parent income/i }), '65000')
  await user.click(screen.getByRole('button', { name: /next/i }))
}

describe('moving through the wizard', () => {
  it('starts the user on the first step', () => {
    renderWithProviders(<FafsaWizard />)

    expect(stepHeading(/^applicant$/i)).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4: Applicant')).toBeInTheDocument()
  })

  it('cannot go back from the first step', () => {
    renderWithProviders(<FafsaWizard />)

    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })

  it('keeps the user on the step when required answers are missing', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(stepHeading(/^applicant$/i)).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('advances once the step is complete', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)

    expect(await screen.findByRole('heading', { level: 2, name: /^dependency$/i })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 4: Dependency')).toBeInTheDocument()
  })

  it('remembers what the user typed when they go back', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
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
    await completeApplicantStep(user)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('leaving the last question step', () => {
  it('stops at the review instead of filing the application', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)

    // Note: this asserts the correct behaviour but would NOT have caught the
    // bug it was written for. That bug needed the browser to resolve a click's
    // default action after React had re-rendered the clicked node into a
    // submit button; jsdom resolves the default action at dispatch time, so it
    // never reproduced. It was found and confirmed fixed in a real browser.
    expect(await screen.findByRole('heading', { level: 2, name: /^review$/i })).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: /application submitted/i })).not.toBeInTheDocument()
  })

  it('leaves the user in control of when the application is filed', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await screen.findByRole('button', { name: /submit application/i })

    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /submit application/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  })
})

describe('the step indicator', () => {
  // Asserting the step control's accessible name covers both what a sighted
  // user reads and what a screen reader announces for that control.
  it.each([
    ['Applicant', 'Identification'],
    ['Dependency', 'Marital status'],
    ['Finances', 'Household Income'],
    ['Review', 'Check answers'],
  ])('offers a %s step described as "%s"', (title, description) => {
    renderWithProviders(<FafsaWizard />)

    const step = screen.getByRole('button', { name: new RegExp(`${title}.*${description}`, 'i') })

    expect(step).toBeInTheDocument()
  })

  it('lets the user see the whole journey, review included', () => {
    renderWithProviders(<FafsaWizard />)

    expect(screen.getAllByRole('button', { name: /applicant|dependency|finances|review/i })).toHaveLength(4)
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

    await completeApplicantStep(user)

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})

describe('focus and announcements', () => {
  it('moves focus to the new step heading so the user is not stranded', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /^dependency$/i })).toHaveFocus(),
    )
  })

  it('moves focus to the summary when the step refuses to advance', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
  })

  it('announces which step the user is on', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)
    await completeApplicantStep(user)

    const announcement = await screen.findByText('Step 2 of 4: Dependency')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
  })
})

describe('reviewing and submitting', () => {
  it('reassures the user that nothing has been submitted yet', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)

    // Landing on a screen headed "Review" with a Submit button is a natural
    // place to wonder whether the application has already gone in.
    expect(
      await screen.findByText(/nothing is submitted until you select submit application/i),
    ).toBeInTheDocument()
  })

  it('counts the review as the final step', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await screen.findByRole('heading', { level: 2, name: /^review$/i })

    expect(screen.getByText('Step 4 of 4: Review')).toBeInTheDocument()
  })

  it('shows the answers back to the user before they submit', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)

    expect(await screen.findByRole('heading', { level: 2, name: /^review$/i })).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('123-45-6789')).toBeInTheDocument()
    expect(screen.getByText('May 15, 2003')).toBeInTheDocument()
    expect(screen.getByText('California')).toBeInTheDocument()
    expect(screen.getByText('$65,000')).toBeInTheDocument()
  })

  it('lets the user jump back to a section from the review', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)

    await user.click(await screen.findByRole('button', { name: /edit applicant/i }))

    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('Jane')
  })

  it('hands over the completed application on submit', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
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

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    expect(await screen.findByRole('heading', { name: /application submitted/i })).toBeInTheDocument()
    expect(screen.getByText(/thank you, jane/i)).toBeInTheDocument()
  })

  it('moves focus to the confirmation so the change is not silent', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /application submitted/i })).toHaveFocus(),
    )
  })

  it('gives the user a clean form when they start another application', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))
    await user.click(await screen.findByRole('button', { name: /start another application/i }))

    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('')
    expect(screen.getByText('Step 1 of 4: Applicant')).toBeInTheDocument()
  })
})

describe('surviving a page refresh', () => {
  it('brings back the answers the user had already typed', async () => {
    const { user, unmount } = renderWithProviders(<FafsaWizard />)

    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane')
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Smith')
    await waitFor(() => expect(window.sessionStorage.length).toBeGreaterThan(0))

    // Unmount and mount again: the same thing the user's browser does on a
    // refresh, from the form's point of view.
    unmount()
    renderWithProviders(<FafsaWizard />)

    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Jane')
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('Smith')
  })

  it('makes the user type their Social Security number again', async () => {
    const { user, unmount } = renderWithProviders(<FafsaWizard />)

    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane')
    await user.type(screen.getByRole('textbox', { name: /social security number/i }), '123456789')
    await waitFor(() => expect(window.sessionStorage.length).toBeGreaterThan(0))

    unmount()
    renderWithProviders(<FafsaWizard />)

    // Deliberate: a Social Security number is not written to storage, so it
    // cannot come back. Re-typing nine digits is the cost of not leaving a
    // government identifier sitting in the browser.
    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Jane')
    expect(screen.getByRole('textbox', { name: /social security number/i })).toHaveValue('')
  })

  it('forgets the draft once the application is submitted', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await completeDependency(user)
    await completeFinances(user)
    await user.click(await screen.findByRole('button', { name: /submit application/i }))
    await screen.findByRole('heading', { name: /application submitted/i })

    await waitFor(() => expect(window.sessionStorage.length).toBe(0))
  })
})

describe('the married and independent path', () => {
  it('requires spouse details before letting a married applicant advance', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await user.click(screen.getByRole('radio', { name: 'Independent' }))
    await user.click(screen.getByRole('radio', { name: 'Married' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    const summary = await screen.findByRole('alert')
    expect(within(summary).getByRole('link', { name: /spouse's first name/i })).toBeInTheDocument()
  })

  it('does not ask an independent applicant for parent income', async () => {
    const { user } = renderWithProviders(<FafsaWizard />)

    await completeApplicantStep(user)
    await user.click(screen.getByRole('radio', { name: 'Independent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByRole('textbox', { name: /your income/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /parent income/i })).not.toBeInTheDocument()
  })

  it('completes end to end for a married independent applicant', async () => {
    const onSubmit = vi.fn()
    const { user } = renderWithProviders(<FafsaWizard onSubmit={onSubmit} />)

    await completeApplicantStep(user)
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
