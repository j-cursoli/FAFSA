import { useEffect } from 'react'
import { useWatch, type Control } from 'react-hook-form'
import { defaultFafsaFormValues, type FafsaFormValues } from '../../../../domain/schema'

const STORAGE_KEY = 'fafsa-application-draft'

/**
 * Fields deliberately excluded from the saved draft.
 *
 * A Social Security number is exactly the kind of value that must not be left
 * sitting in browser storage: it survives beyond the moment the user is looking
 * at the form, is readable by any script on the origin, and is the single most
 * damaging field here to leak. Losing the convenience of restoring two fields
 * is a fair trade for not writing government identifiers to disk.
 */
const EXCLUDED_FIELDS = ['ssn', 'spouseSsn'] as const satisfies readonly (keyof FafsaFormValues)[]

type DraftValues = Omit<FafsaFormValues, (typeof EXCLUDED_FIELDS)[number]>

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && window.sessionStorage !== null
  } catch {
    // Access itself throws when storage is blocked by browser settings.
    return false
  }
}

export function saveDraft(values: FafsaFormValues): void {
  if (!isStorageAvailable()) return

  const draft: Partial<FafsaFormValues> = { ...values }

  for (const field of EXCLUDED_FIELDS) {
    delete draft[field]
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // A full or blocked quota must not break the form the user is filling in.
  }
}

export function loadDraft(): Partial<DraftValues> | null {
  if (!isStorageAvailable()) return null

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)

    if (!stored) return null

    const parsed: unknown = JSON.parse(stored)

    if (typeof parsed !== 'object' || parsed === null) return null

    // Only keys the form actually has are restored, so a stale or tampered
    // draft cannot inject unknown fields into form state.
    const known = Object.keys(defaultFafsaFormValues) as (keyof FafsaFormValues)[]
    const draft: Partial<FafsaFormValues> = {}

    for (const key of known) {
      if (key in parsed && !EXCLUDED_FIELDS.includes(key as (typeof EXCLUDED_FIELDS)[number])) {
        Object.assign(draft, { [key]: (parsed as Record<string, unknown>)[key] })
      }
    }

    return draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (!isStorageAvailable()) return

  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing useful to do if storage refuses.
  }
}

/** The values a form should start from: defaults, with any draft laid over. */
export function initialValuesFromDraft(): FafsaFormValues {
  return { ...defaultFafsaFormValues, ...loadDraft() }
}

/** Saves a draft as the user types, so a refresh does not lose their work. */
export function useFormDraft(control: Control<FafsaFormValues>): void {
  const values = useWatch({ control }) as FafsaFormValues

  useEffect(() => {
    saveDraft(values)
  }, [values])
}
