import { useEffect, useRef } from 'react'
import { Button, Stack, Text, Title } from '@mantine/core'
import styles from './ConfirmationStep.module.css'

export interface ConfirmationStepProps {
  applicantName: string
  onStartAnother: () => void
}

export function ConfirmationStep({ applicantName, onStartAnother }: ConfirmationStepProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The form the user was working in has been replaced. Without moving focus,
  // a keyboard or screen reader user is left on a button that no longer exists
  // and focus falls back to the top of the document with no explanation.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Stack gap="md" className={styles.confirmation} role="status">
      <Title order={2} ref={headingRef} tabIndex={-1} className={styles.heading}>
        Application submitted
      </Title>

      <Text>
        Thank you{applicantName ? `, ${applicantName}` : ''}. Your FAFSA application has been
        received.
      </Text>

      <Text c="dimmed" size="sm">
        This is a demonstration form, so nothing was sent to Federal Student Aid.
      </Text>

      <div>
        <Button type="button" onClick={onStartAnother} variant="default">
          Start another application
        </Button>
      </div>
    </Stack>
  )
}
