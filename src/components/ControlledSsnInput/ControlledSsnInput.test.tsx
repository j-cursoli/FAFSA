import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../test/renderWithForm'
import { ControlledSsnInput } from './ControlledSsnInput'
import type { FafsaFormValues } from '../../domain/schema'

function SsnField() {
  return (
    <ControlledSsnInput<FafsaFormValues>
      name="ssn"
      label="Social Security number"
      required
    />
  )
}

function ssnInput() {
  return screen.getByRole('textbox', { name: /social security number/i })
}

describe('ControlledSsnInput', () => {
  it('adds the hyphens for the user as they type', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), '123456789')

    expect(ssnInput()).toHaveValue('123-45-6789')
  })

  it('accepts a number the user types with hyphens already in it', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), '123-45-6789')

    expect(ssnInput()).toHaveValue('123-45-6789')
  })

  it('ignores characters that cannot be part of a Social Security number', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), 'abc123def45ghi6789')

    expect(ssnInput()).toHaveValue('123-45-6789')
  })

  it('shows the number partly formatted while it is still incomplete', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), '1234')

    expect(ssnInput()).toHaveValue('123-4')
  })

  it('lets the user delete back through the hyphens', async () => {
    const { user } = renderWithForm(<SsnField />)
    const input = ssnInput()

    await user.type(input, '123456789')
    await user.type(input, '{backspace}{backspace}{backspace}{backspace}{backspace}')

    expect(ssnInput()).toHaveValue('123-4')
  })

  it('refuses digits past the ninth rather than accepting a too-long number', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), '1234567890000')

    expect(ssnInput()).toHaveValue('123-45-6789')
  })

  it('tells the user the expected format when they leave it incomplete', async () => {
    const { user } = renderWithForm(<SsnField />)

    await user.type(ssnInput(), '12345')
    await user.tab()

    expect(await screen.findByText(/XXX-XX-XXXX/)).toBeInTheDocument()
  })

  it('does not offer to autofill a Social Security number from the browser', () => {
    renderWithForm(<SsnField />)

    // Autofilling government identifiers from a saved profile is a privacy
    // hazard, and a wrong autofilled SSN is worse than an empty field.
    expect(ssnInput()).toHaveAttribute('autocomplete', 'off')
  })
})
