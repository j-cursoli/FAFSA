import { describe, expect, it } from 'vitest'
import { renderWithForm, screen, waitFor } from '../../../../../test/renderWithForm'
import { StatusStep } from './StatusStep'

function spouseFirstName() {
  return screen.queryByRole('textbox', { name: /spouse's first name/i })
}

describe('StatusStep', () => {
  it('asks for dependency and marital status', () => {
    renderWithForm(<StatusStep />)

    expect(screen.getByRole('radiogroup', { name: /dependency status/i })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /marital status/i })).toBeInTheDocument()
  })

  it('does not ask about a spouse until the user says they are married', () => {
    renderWithForm(<StatusStep />)

    expect(spouseFirstName()).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /spouse information/i })).not.toBeInTheDocument()
  })

  it('asks for spouse details once the user chooses Married', async () => {
    const { user } = renderWithForm(<StatusStep />)

    await user.click(screen.getByRole('radio', { name: 'Married' }))

    expect(await screen.findByRole('heading', { name: /spouse information/i })).toBeInTheDocument()
    expect(spouseFirstName()).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /spouse's last name/i })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: /spouse's social security number/i }),
    ).toBeInTheDocument()
  })

  it('announces the new fields rather than adding them silently', async () => {
    const { user } = renderWithForm(<StatusStep />)

    await user.click(screen.getByRole('radio', { name: 'Married' }))

    // A screen reader user is several tab stops above the new inputs and would
    // otherwise never learn the form grew.
    expect(await screen.findByRole('status')).toHaveTextContent(
      /spouse information is now required/i,
    )
  })

  it('removes the spouse fields again if the user corrects their answer', async () => {
    const { user } = renderWithForm(<StatusStep />)

    await user.click(screen.getByRole('radio', { name: 'Married' }))
    expect(await screen.findByRole('heading', { name: /spouse information/i })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Single' }))

    await waitFor(() => expect(spouseFirstName()).not.toBeInTheDocument())
  })

  it('validates the spouse fields once they apply', async () => {
    const { user } = renderWithForm(<StatusStep />)

    await user.click(screen.getByRole('radio', { name: 'Married' }))
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(await screen.findByText(/enter your spouse's first name/i)).toBeInTheDocument()
  })

  it('does not block a single applicant on empty spouse fields', async () => {
    const submitted: unknown[] = []
    const { user } = renderWithForm(<StatusStep />, {
      defaultValues: {
        firstName: 'Jane',
        lastName: 'Smith',
        ssn: '123-45-6789',
        dateOfBirth: '2003-05-15',
        stateOfResidence: 'CA',
        numberInHousehold: 4,
        numberInCollege: 1,
        studentIncome: 5000,
        parentIncome: 65000,
      },
      onSubmit: (values) => submitted.push(values),
    })

    await user.click(screen.getByRole('radio', { name: 'Dependent' }))
    await user.click(screen.getByRole('radio', { name: 'Single' }))
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(submitted).toHaveLength(1))
  })
})
