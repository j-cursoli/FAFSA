import { MantineProvider } from '@mantine/core'
import { FafsaApplicationPage } from './pages/FafsaApplicationPage'
import { theme } from './theme'

export function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <FafsaApplicationPage />
    </MantineProvider>
  )
}
