import { describe, expect, it } from 'vitest'
import { renderWithForm, screen, waitFor } from '../../test/renderWithForm'
import { ControlledRadioGroup } from './ControlledRadioGroup'
import type { FafsaFormValues } from '../../domain/schema'

function MaritalStatusField() {
  return (
    <ControlledRadioGroup<FafsaFormValues>
      name="maritalStatus"
      label="Marital status"
      options={[
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married' },
      ]}
    />
  )
}

describe('ControlledRadioGroup', () => {
  it('presents the choices as a named group', () => {
    renderWithForm(<MaritalStatusField />)

    const group = screen.getByRole('radiogroup', { name: /marital status/i })

    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Single' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Married' })).toBeInTheDocument()
  })

  it('starts with nothing chosen so the user makes a deliberate answer', () => {
    renderWithForm(<MaritalStatusField />)

    expect(screen.getByRole('radio', { name: 'Single' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Married' })).not.toBeChecked()
  })

  it('records the choice the user clicks', async () => {
    const { user } = renderWithForm(<MaritalStatusField />)

    await user.click(screen.getByRole('radio', { name: 'Married' }))

    expect(screen.getByRole('radio', { name: 'Married' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Single' })).not.toBeChecked()
  })

  it('lets a keyboard user choose with the arrow keys', async () => {
    const { user } = renderWithForm(<MaritalStatusField />)

    await user.tab()
    await user.keyboard('{ArrowDown}')

    // Tab enters the group and lands on the first radio; one arrow press moves
    // to and selects the next, which is how native radio groups behave.
    expect(screen.getByRole('radio', { name: 'Married' })).toBeChecked()
  })

  it('moves past the whole group on a single Tab press', async () => {
    const { user } = renderWithForm(<MaritalStatusField />)

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Single' })).toHaveFocus()

    await user.tab()

    expect(screen.getByRole('button', { name: /submit/i })).toHaveFocus()
  })

  it('explains the problem when the user submits without choosing', async () => {
    const { user } = renderWithForm(<MaritalStatusField />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/select your marital status/i)).toBeInTheDocument()
  })

  it('clears the error once a choice is made', async () => {
    const { user } = renderWithForm(<MaritalStatusField />)

    await user.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/select your marital status/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Single' }))

    await waitFor(() =>
      expect(screen.queryByText(/select your marital status/i)).not.toBeInTheDocument(),
    )
  })
})
