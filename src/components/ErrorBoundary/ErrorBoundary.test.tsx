import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/renderWithProviders'
import { ErrorBoundary } from './ErrorBoundary'

function Exploding(): never {
  throw new Error('render failed')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; the test asserts the recovery, not the noise.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows its children while nothing is wrong', () => {
    renderWithProviders(
      <ErrorBoundary>
        <p>The form</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('The form')).toBeInTheDocument()
  })

  it('explains the failure instead of leaving a blank page', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
  })

  it('tells the user their answers were not submitted', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    )

    // Leaving someone unsure whether a form went through is worse than the
    // crash itself.
    expect(screen.getByRole('alert')).toHaveTextContent(/were not submitted/i)
  })

  it('offers a way to recover', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Exploding />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('button', { name: /reload the page/i })).toBeInTheDocument()
  })

  it('reports the failure so it can be logged', () => {
    const onError = vi.fn()

    renderWithProviders(
      <ErrorBoundary onError={onError}>
        <Exploding />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})
