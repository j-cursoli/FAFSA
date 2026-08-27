import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../../../../test/renderWithForm'
import { StudentInfoStep } from './StudentInfoStep'
import { toIsoDate } from '../../../../../domain/format'

describe('StudentInfoStep', () => {
  it('collects the student identity details', () => {
    renderWithForm(<StudentInfoStep />)

    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /social security number/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
  })

  it('groups the state of residence under its own heading', () => {
    renderWithForm(<StudentInfoStep />)

    expect(screen.getByRole('heading', { name: /residence/i })).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /state of legal residence/i }),
    ).toBeInTheDocument()
  })

  it('tells the user the age requirement before they enter a date', () => {
    renderWithForm(<StudentInfoStep />)

    // Stating the rule up front is cheaper for the user than discovering it
    // through an error after they have typed.
    expect(screen.getByLabelText(/date of birth/i)).toHaveAccessibleDescription(
      /at least 14 years old/i,
    )
  })

  it('stops the date picker offering a date in the future', () => {
    renderWithForm(<StudentInfoStep />)

    expect(screen.getByLabelText(/date of birth/i)).toHaveAttribute('max', toIsoDate(new Date()))
  })

  it('explains the Social Security number format up front', () => {
    renderWithForm(<StudentInfoStep />)

    expect(screen.getByRole('textbox', { name: /social security number/i })).toHaveAccessibleDescription(
      /9 digits/i,
    )
  })

  it('lets the user complete every field on the step', async () => {
    const { user } = renderWithForm(<StudentInfoStep />)

    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane')
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Smith')
    await user.type(screen.getByRole('textbox', { name: /social security number/i }), '123456789')
    await user.type(screen.getByLabelText(/date of birth/i), '2003-05-15')
    await user.selectOptions(screen.getByRole('combobox', { name: /state of legal residence/i }), 'CA')

    expect(screen.getByRole('textbox', { name: /social security number/i })).toHaveValue('123-45-6789')
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue('2003-05-15')
    expect(screen.getByRole('combobox', { name: /state of legal residence/i })).toHaveDisplayValue('California')
  })
})
