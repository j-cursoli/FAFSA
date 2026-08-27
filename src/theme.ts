import {
  createTheme,
  type CSSVariablesResolver,
  type MantineThemeOverride,
} from '@mantine/core'

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

/**
 * Raises Mantine's dimmed and error text tokens to meet WCAG 2.1 AA.
 *
 * The default is gray.6 (#868e96), which measures 3.15:1 against the page
 * background — short of the 4.5:1 required for body text. Every field
 * description, hint and secondary line uses this one token, so correcting it
 * here fixes them all rather than patching each component.
 *
 * gray.7 (#495057) measures roughly 7.5:1 on the same background and still
 * reads as secondary next to the near-black body colour.
 *
 * This goes through cssVariablesResolver rather than a :root rule in CSS
 * because Mantine's own stylesheet would otherwise win on load order.
 */
export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': mantineTheme.colors.gray[7],
    // Mantine resolves --mantine-color-error to red.6 (#fa5252), which is
    // 3.28:1 on white — below AA for the error messages that use it. red.8
    // (#c92a2a) measures 5.9:1 and still reads unmistakably as an error.
    '--mantine-color-error': mantineTheme.colors.red[8],
  },
  dark: {},
})
