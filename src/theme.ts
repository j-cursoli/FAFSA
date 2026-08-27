import { createTheme, type MantineThemeOverride } from '@mantine/core'

/**
 * WCAG 2.1 AA requires 4.5:1 contrast for body text and 3:1 for non-text
 * indicators like focus rings and input borders. Mantine's default red.6
 * (#fa5252) only reaches ~3.4:1 on white, so error text is pinned to a darker
 * shade. Colours here are checked against #ffffff.
 */
export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'blue',
  primaryShade: 8,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'sm',
  colors: {
    // #c92a2a on white = 5.9:1 — passes AA for normal-size error text.
    red: [
      '#fff5f5',
      '#ffe3e3',
      '#ffc9c9',
      '#ffa8a8',
      '#ff8787',
      '#ff6b6b',
      '#fa5252',
      '#f03e3e',
      '#c92a2a',
      '#a51111',
    ],
  },
  components: {
    InputWrapper: {
      defaultProps: {
        inputWrapperOrder: ['label', 'description', 'input', 'error'],
      },
    },
  },
})
