import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../../../test/renderWithProviders'
import { ConfirmationStep } from './ConfirmationStep'

describe('ConfirmationStep', () => {
  it('confirms that the application went through', () => {
    renderWithProviders(<ConfirmationStep applicantName="Jane" onStartAnother={() => {}} />)

    expect(screen.getByRole('heading', { name: /application submitted/i })).toBeInTheDocument()
  })

  it('greets the applicant by name', () => {
    renderWithProviders(<ConfirmationStep applicantName="Jane" onStartAnother={() => {}} />)

    expect(screen.getByText(/thank you, jane/i)).toBeInTheDocument()
  })

  it('still reads properly when no name was captured', () => {
    renderWithProviders(<ConfirmationStep applicantName="" onStartAnother={() => {}} />)

    expect(screen.getByText(/^thank you\./i)).toBeInTheDocument()
  })

  it('is honest that nothing was really submitted', () => {
    renderWithProviders(<ConfirmationStep applicantName="Jane" onStartAnother={() => {}} />)

    expect(screen.getByText(/demonstration form/i)).toBeInTheDocument()
  })

  it('takes focus so the change of screen is not silent', async () => {
    renderWithProviders(<ConfirmationStep applicantName="Jane" onStartAnother={() => {}} />)

    // The form the user was working in has been replaced; without this, focus
    // falls back to the top of the document with no explanation.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /application submitted/i })).toHaveFocus(),
    )
  })

  it('announces itself to a screen reader', () => {
    renderWithProviders(<ConfirmationStep applicantName="Jane" onStartAnother={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent(/application submitted/i)
  })

  it('offers a way to fill in another application', async () => {
    const onStartAnother = vi.fn()
    const { user } = renderWithProviders(
      <ConfirmationStep applicantName="Jane" onStartAnother={onStartAnother} />,
    )

    await user.click(screen.getByRole('button', { name: /start another application/i }))

    expect(onStartAnother).toHaveBeenCalledTimes(1)
  })
})
