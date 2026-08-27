import { describe, expect, it } from 'vitest'
import { renderWithForm, screen, waitFor } from '../../test/renderWithForm'
import { ControlledTextInput } from './ControlledTextInput'
import type { FafsaFormValues } from '../../domain/schema'

function FirstNameField() {
  return <ControlledTextInput<FafsaFormValues> name="firstName" label="First name" required />
}

describe('ControlledTextInput', () => {
  it('gives the user a text box they can find by its label', async () => {
    const { user } = renderWithForm(<FirstNameField />)

    const input = screen.getByRole('textbox', { name: /first name/i })
    await user.type(input, 'Jane')

    expect(input).toHaveValue('Jane')
  })

  it('reports the field as required to assistive technology', () => {
    renderWithForm(<FirstNameField />)

    expect(screen.getByRole('textbox', { name: /first name/i })).toBeRequired()
  })

  it('explains the problem once the user leaves the field empty', async () => {
    const { user } = renderWithForm(<FirstNameField />)

    await user.click(screen.getByRole('textbox', { name: /first name/i }))
    await user.tab()

    expect(await screen.findByText(/enter your first name/i)).toBeInTheDocument()
  })

  it('stays quiet until the user has actually visited the field', async () => {
    renderWithForm(<FirstNameField />)

    expect(screen.queryByText(/enter your first name/i)).not.toBeInTheDocument()
  })

  it('announces the error as part of the field, not as loose text nearby', async () => {
    const { user } = renderWithForm(<FirstNameField />)
    const input = screen.getByRole('textbox', { name: /first name/i })

    await user.click(input)
    await user.tab()

    await waitFor(() => expect(input).toBeInvalid())
    expect(input).toHaveAccessibleDescription(/enter your first name/i)
  })

  it('clears the error as soon as the user fixes the value', async () => {
    const { user } = renderWithForm(<FirstNameField />)
    const input = screen.getByRole('textbox', { name: /first name/i })

    await user.click(input)
    await user.tab()
    expect(await screen.findByText(/enter your first name/i)).toBeInTheDocument()

    await user.type(input, 'Jane')

    await waitFor(() =>
      expect(screen.queryByText(/enter your first name/i)).not.toBeInTheDocument(),
    )
  })
})
