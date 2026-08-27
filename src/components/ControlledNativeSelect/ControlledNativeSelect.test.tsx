import { describe, expect, it } from 'vitest'
import { renderWithForm, screen } from '../../test/renderWithForm'
import { ControlledNativeSelect } from './ControlledNativeSelect'
import { US_STATES } from '../../domain/states'
import type { FafsaFormValues } from '../../domain/schema'

function StateField() {
  return (
    <ControlledNativeSelect<FafsaFormValues>
      name="stateOfResidence"
      label="State of legal residence"
      required
      data={[
        { value: '', label: 'Select a state' },
        ...US_STATES.map((state) => ({ value: state.code, label: state.name })),
      ]}
    />
  )
}

function stateSelect() {
  return screen.getByRole('combobox', { name: /state of legal residence/i })
}

describe('ControlledNativeSelect', () => {
  it('lets the user pick a state by the name they know it by', async () => {
    const { user } = renderWithForm(<StateField />)

    await user.selectOptions(stateSelect(), 'CA')

    expect(stateSelect()).toHaveDisplayValue('California')
  })

  it('offers every state and territory that can be a legal residence', () => {
    renderWithForm(<StateField />)

    expect(screen.getByRole('option', { name: 'Puerto Rico' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'District of Columbia' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(US_STATES.length + 1)
  })

  it('starts on a prompt rather than silently defaulting to a state', () => {
    renderWithForm(<StateField />)

    expect(stateSelect()).toHaveDisplayValue('Select a state')
  })

  it('asks the user to choose when they move on without selecting', async () => {
    const { user } = renderWithForm(<StateField />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(
      await screen.findByText(/select your state of legal residence/i),
    ).toBeInTheDocument()
  })
})
