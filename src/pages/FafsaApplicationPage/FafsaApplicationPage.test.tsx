import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { renderWithProviders, screen } from '../../test/renderWithProviders'
import { FafsaApplicationPage } from './FafsaApplicationPage'

describe('FafsaApplicationPage', () => {
  it('presents the application under a single top-level heading', () => {
    renderWithProviders(<FafsaApplicationPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: /federal student aid/i }),
    ).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderWithProviders(<FafsaApplicationPage />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
