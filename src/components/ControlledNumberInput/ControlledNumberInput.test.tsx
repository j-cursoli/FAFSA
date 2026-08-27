import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../test/renderWithForm'
import { ControlledNumberInput } from './ControlledNumberInput'
import type { FafsaFormValues } from '../../domain/schema'

function HouseholdField() {
  return (
    <ControlledNumberInput<FafsaFormValues>
      name="numberInHousehold"
      label="Number in household"
      required
      min={1}
      allowDecimal={false}
    />
  )
}

function householdInput() {
  return screen.getByRole('textbox', { name: /number in household/i })
}

describe('ControlledNumberInput', () => {
  it('records the number the user types', async () => {
    const { user } = renderWithForm(<HouseholdField />)

    await user.type(householdInput(), '4')

    expect(householdInput()).toHaveValue('4')
  })

  it('keeps an out-of-range number on screen instead of quietly rewriting it', async () => {
    const { user } = renderWithForm(<HouseholdField />)

    // Clamping 0 up to 1 behind the user's back would hide the mistake; the
    // rule is better explained than silently applied.
    await user.type(householdInput(), '0')
    await user.tab()

    expect(householdInput()).toHaveValue('0')
    expect(await screen.findByText(/at least 1 person/i)).toBeInTheDocument()
  })

  it('asks for an answer when the field is left empty', async () => {
    const { user } = renderWithForm(<HouseholdField />)

    await user.click(householdInput())
    await user.tab()

    expect(await screen.findByText(/how many people are in your household/i)).toBeInTheDocument()
  })

  it('reports the household rule against the number in college', async () => {
    const { user } = renderWithForm(
      <>
        <HouseholdField />
        <ControlledNumberInput<FafsaFormValues>
          name="numberInCollege"
          label="Number in college"
          required
          min={1}
          allowDecimal={false}
        />
      </>,
      { defaultValues: { numberInHousehold: 2 } },
    )

    await user.type(screen.getByRole('textbox', { name: /number in college/i }), '5')
    await user.tab()

    const message = await screen.findByText(/number in college \(5\)/i)
    expect(message).toHaveTextContent(/household \(2\)/i)
    expect(message).toHaveTextContent(/lower this number or increase your household size/i)
  })
})
