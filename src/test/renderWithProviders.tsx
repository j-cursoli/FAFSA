import type { ReactElement, ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cssVariablesResolver, theme } from '../theme'

function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      cssVariablesResolver={cssVariablesResolver}
    >
      {children}
    </MantineProvider>
  )
}

/**
 * Renders a component inside the same providers the real application uses, so
 * tests exercise the component exactly as a user encounters it. Returns a
 * pre-configured `user` alongside the usual render result.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup()
  return { user, ...render(ui, { wrapper: Providers, ...options }) }
}

export * from '@testing-library/react'
