import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { renderWithProviders, screen, waitFor } from '../../test/renderWithProviders'
import { FafsaApplicationPage } from './FafsaApplicationPage'

type User = ReturnType<typeof renderWithProviders>['user']

/**
 * The whole page is scanned rather than a component in isolation, because
 * several rules axe checks — duplicate ids, heading order, landmark structure —
 * only mean anything when the page is assembled.
 */
async function expectNoViolations(container: HTMLElement) {
  expect(await axe(container)).toHaveNoViolations()
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

describe('FafsaApplicationPage', () => {
  it('presents the application under a single top-level heading', () => {
    renderWithProviders(<FafsaApplicationPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /federal student aid/i }),
    ).toBeInTheDocument()
  })

  it('puts the form inside a main landmark', () => {
    renderWithProviders(<FafsaApplicationPage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('lets a keyboard user reach the first field without a mouse', async () => {
    const { user } = renderWithProviders(<FafsaApplicationPage />)

    await user.tab()
    await user.tab()

    // Whatever the stepper contributes, a few tabs must reach real content
    // rather than dead-ending in decoration.
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('accessibility of each step', () => {
  it('has no violations on the applicant step', async () => {
    const { container } = renderWithProviders(<FafsaApplicationPage />)

    await expectNoViolations(container)
  })

  it('has no violations while errors are on screen', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    // Error states introduce their own markup — alerts, aria-invalid, described-by
    // wiring — that a clean-form scan never exercises.
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('alert')

    await expectNoViolations(container)
  })

  it('has no violations on the dependency step', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    await completeApplicantStep(user)
    await screen.findByRole('radiogroup', { name: /dependency status/i })

    await expectNoViolations(container)
  })

  it('has no violations once the conditional spouse fields appear', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    await completeApplicantStep(user)
    await user.click(await screen.findByRole('radio', { name: 'Married' }))
    await screen.findByRole('textbox', { name: /spouse's first name/i })

    await expectNoViolations(container)
  })

  it('has no violations on the finances step', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    await completeApplicantStep(user)
    await user.click(await screen.findByRole('radio', { name: 'Dependent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('textbox', { name: /number in household/i })

    await expectNoViolations(container)
  })

  it('has no violations on the review step', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    await completeApplicantStep(user)
    await user.click(await screen.findByRole('radio', { name: 'Dependent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.type(await screen.findByRole('textbox', { name: /number in household/i }), '4')
    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
    await user.type(screen.getByRole('textbox', { name: /your income/i }), '5000')
    await user.type(screen.getByRole('textbox', { name: /parent income/i }), '65000')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('button', { name: /submit application/i })

    await expectNoViolations(container)
  })

  it('has no violations on the confirmation', async () => {
    const { container, user } = renderWithProviders(<FafsaApplicationPage />)

    await completeApplicantStep(user)
    await user.click(await screen.findByRole('radio', { name: 'Dependent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.type(await screen.findByRole('textbox', { name: /number in household/i }), '4')
    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
    await user.type(screen.getByRole('textbox', { name: /your income/i }), '5000')
    await user.type(screen.getByRole('textbox', { name: /parent income/i }), '65000')
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(await screen.findByRole('button', { name: /submit application/i }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /application submitted/i })).toBeInTheDocument(),
    )

    await expectNoViolations(container)
  })
})
