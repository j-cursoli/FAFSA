import { describe, expect, it } from 'vitest'
import { renderWithForm, screen, waitFor } from '../../../../../test/renderWithForm'
import { HouseholdFinanceStep } from './HouseholdFinanceStep'

function parentIncome() {
  return screen.queryByRole('textbox', { name: /parent income/i })
}

describe('HouseholdFinanceStep', () => {
  it('asks for both household counts and the student income', () => {
    renderWithForm(<HouseholdFinanceStep />)

    expect(screen.getByRole('textbox', { name: /number in household/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /number in college/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /your income/i })).toBeInTheDocument()
  })

  it('does not ask for parent income before dependency is known', () => {
    renderWithForm(<HouseholdFinanceStep />)

    expect(parentIncome()).not.toBeInTheDocument()
  })

  it('asks for parent income from a dependent student', () => {
    renderWithForm(<HouseholdFinanceStep />, {
      defaultValues: { dependencyStatus: 'dependent' },
    })

    expect(parentIncome()).toBeInTheDocument()
  })

  it('does not ask an independent student for parent income', () => {
    renderWithForm(<HouseholdFinanceStep />, {
      defaultValues: { dependencyStatus: 'independent' },
    })

    expect(parentIncome()).not.toBeInTheDocument()
  })

  it('enforces the household rule against the numbers the user entered', async () => {
    const { user } = renderWithForm(<HouseholdFinanceStep />)

    await user.type(screen.getByRole('textbox', { name: /number in household/i }), '2')
    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '5')
    await user.tab()

    const message = await screen.findByText(/number in college \(5\)/i)
    expect(message).toHaveTextContent(/household \(2\)/i)
  })

  it('accepts a complete dependent household', async () => {
    const submitted: unknown[] = []
    const { user } = renderWithForm(<HouseholdFinanceStep />, {
      defaultValues: {
        firstName: 'Jane',
        lastName: 'Smith',
        ssn: '123-45-6789',
        dateOfBirth: '2003-05-15',
        stateOfResidence: 'CA',
        dependencyStatus: 'dependent',
        maritalStatus: 'single',
      },
      onSubmit: (values) => submitted.push(values),
    })

    await user.type(screen.getByRole('textbox', { name: /number in household/i }), '4')
    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '1')
    await user.type(screen.getByRole('textbox', { name: /your income/i }), '5000')
    await user.type(screen.getByRole('textbox', { name: /parent income/i }), '65000')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(submitted).toHaveLength(1))
  })
})
