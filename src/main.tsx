import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ColorSchemeScript } from '@mantine/core'
import { App } from './App'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container #root was not found in the document.')
}

createRoot(container).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <App />
  </StrictMode>,
)
