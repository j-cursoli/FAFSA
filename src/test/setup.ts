// NOTE: jsdom is pinned to ^26 on purpose. Under jsdom 29, dom-accessibility-api
// computes an empty accessible name for name-from-content elements, so every
// getByRole({ name }) query against a button, link or heading silently fails to
// match. Names derived from labels still work, which makes the breakage easy to
// mistake for a component bug. Re-test the suite before raising this.
import '@testing-library/jest-dom/vitest'
import { toHaveNoViolations } from 'jest-axe'
import { afterEach, expect } from 'vitest'

expect.extend(toHaveNoViolations)

// The form saves a draft to sessionStorage as the user types. Without this,
// one test's answers pre-fill the next test's form and failures appear in
// tests that have nothing to do with persistence.
afterEach(() => {
  window.sessionStorage.clear()
})

// Mantine reads these browser APIs on mount; jsdom does not implement them.
// Without the stubs every Mantine component throws before a test can run.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// jsdom has no layout engine, so scrollIntoView is undefined. Focus management
// in the wizard calls it after moving focus.
Element.prototype.scrollIntoView = () => {}
