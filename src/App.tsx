import { MantineProvider } from '@mantine/core'
import { FafsaApplicationPage } from './pages/FafsaApplicationPage'
import { cssVariablesResolver, theme } from './theme'

export function App() {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      cssVariablesResolver={cssVariablesResolver}
    >
      <FafsaApplicationPage />
    </MantineProvider>
  )
}
