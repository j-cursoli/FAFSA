import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../test/renderWithForm'
import { ControlledDateInput } from './ControlledDateInput'
import type { FafsaFormValues } from '../../domain/schema'

function DateOfBirthField() {
  return (
    <ControlledDateInput<FafsaFormValues>
      name="dateOfBirth"
      label="Date of birth"
      required
      max="2026-08-26"
    />
  )
}

function dateInput() {
  return screen.getByLabelText(/date of birth/i)
}

describe('ControlledDateInput', () => {
  it('lets the user type a date without opening a picker', async () => {
    const { user } = renderWithForm(<DateOfBirthField />)

    await user.type(dateInput(), '2003-05-15')

    expect(dateInput()).toHaveValue('2003-05-15')
  })

  it('uses the platform date control so mobile and screen readers get theirs', () => {
    renderWithForm(<DateOfBirthField />)

    expect(dateInput()).toHaveAttribute('type', 'date')
  })

  it('stops the user picking a date in the future from the calendar itself', () => {
    renderWithForm(<DateOfBirthField />)

    expect(dateInput()).toHaveAttribute('max', '2026-08-26')
  })

  it('explains the age rule when the date makes the applicant too young', async () => {
    const { user } = renderWithForm(<DateOfBirthField />, {
      defaultValues: { dateOfBirth: '2015-01-01' },
    })

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/at least 14 years old/i)).toBeInTheDocument()
  })

  it('asks for a date when none has been entered', async () => {
    const { user } = renderWithForm(<DateOfBirthField />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/enter your date of birth/i)).toBeInTheDocument()
  })
})
