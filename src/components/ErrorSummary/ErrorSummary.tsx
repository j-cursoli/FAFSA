import { forwardRef } from 'react'
import { Alert, Anchor, List, Text } from '@mantine/core'
import styles from './ErrorSummary.module.css'

export interface ErrorSummaryEntry {
  /** The field's id, which is also its form field name. */
  readonly fieldName: string
  readonly label: string
  readonly message: string
}

export interface ErrorSummaryProps {
  entries: readonly ErrorSummaryEntry[]
  /**
   * Called before focus moves, so the wizard can switch to the step the field
   * lives on. Returns nothing; focus is moved here once the DOM has caught up.
   */
  onNavigateToField?: (fieldName: string) => void
}

/**
 * Lists every outstanding error at the top of the form.
 *
 * WCAG 3.3.1 asks that errors be identified in text; a summary additionally
 * solves the problem that inline messages alone leave a user scrolling to find
 * what is wrong. Each entry is a link that moves focus to the field itself, so
 * a keyboard user reaches the problem in one keystroke rather than tabbing back
 * through the form.
 *
 * The alert role announces the summary the moment it appears, which is what
 * makes a failed "Next" perceivable to a screen reader user rather than a
 * silent refusal to advance.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(
  function ErrorSummary({ entries, onNavigateToField }, ref) {
    if (entries.length === 0) {
      return null
    }

    const heading =
      entries.length === 1
        ? 'There is 1 problem with your answers'
        : `There are ${entries.length} problems with your answers`

    return (
      <Alert
        ref={ref}
        role="alert"
        color="red"
        variant="light"
        tabIndex={-1}
        title={heading}
        className={styles.summary}
      >
        <Text size="sm" mb="xs">
          Select a link to go straight to the field.
        </Text>

        <List spacing="xs" size="sm">
          {entries.map((entry) => (
            <List.Item key={entry.fieldName}>
              <Anchor
                href={`#${entry.fieldName}`}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigateToField?.(entry.fieldName)
                }}
              >
                {entry.label}
              </Anchor>
              : {entry.message}
            </List.Item>
          ))}
        </List>
      </Alert>
    )
  },
)
