import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../test/renderWithForm'
import { ControlledCurrencyInput } from './ControlledCurrencyInput'
import type { FafsaFormValues } from '../../domain/schema'

function IncomeField() {
  return (
    <ControlledCurrencyInput<FafsaFormValues>
      name="studentIncome"
      label="Your income"
      required
    />
  )
}

function incomeInput() {
  return screen.getByRole('textbox', { name: /your income/i })
}

describe('ControlledCurrencyInput', () => {
  it('shows the amount as money while the user types it', async () => {
    const { user } = renderWithForm(<IncomeField />)

    await user.type(incomeInput(), '65000')

    expect(incomeInput()).toHaveValue('$65,000')
  })

  it('keeps cents the user enters', async () => {
    const { user } = renderWithForm(<IncomeField />)

    await user.type(incomeInput(), '1234.56')

    expect(incomeInput()).toHaveValue('$1,234.56')
  })

  it('accepts zero as a real answer rather than treating it as blank', async () => {
    const submitted: FafsaFormValues[] = []
    const { user } = renderWithForm(<IncomeField />, {
      onSubmit: (values) => submitted.push(values),
    })

    await user.type(incomeInput(), '0')
    await user.tab()

    expect(incomeInput()).toHaveValue('$0')
    expect(screen.queryByText(/enter your income/i)).not.toBeInTheDocument()
  })

  it('explains that zero is the value to use when the user leaves it blank', async () => {
    const { user } = renderWithForm(<IncomeField />)

    await user.click(incomeInput())
    await user.tab()

    expect(await screen.findByText(/enter 0 if you had no income/i)).toBeInTheDocument()
  })

  it('keeps a negative amount visible so the rule can be explained', async () => {
    const { user } = renderWithForm(<IncomeField />)

    // Silently dropping the minus sign would leave the user staring at a
    // number they did not type with no idea why.
    await user.type(incomeInput(), '-1000')
    await user.tab()

    expect(await screen.findByText(/income cannot be negative/i)).toBeInTheDocument()
  })

  it('raises a numeric keypad on touch devices', () => {
    renderWithForm(<IncomeField />)

    expect(incomeInput()).toHaveAttribute('inputmode', 'decimal')
  })
})
