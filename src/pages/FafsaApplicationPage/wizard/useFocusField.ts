import { useCallback } from 'react'

/**
 * Moves focus to a form field by its id.
 *
 * The lookup is deferred to the next frame because the caller usually changes
 * the visible step first: the target field does not exist in the DOM yet at the
 * moment the summary link is activated.
 */
export function useFocusField() {
  return useCallback((fieldName: string) => {
    requestAnimationFrame(() => {
      const field = document.getElementById(fieldName)

      if (field instanceof HTMLElement) {
        field.focus()
        field.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    })
  }, [])
}
