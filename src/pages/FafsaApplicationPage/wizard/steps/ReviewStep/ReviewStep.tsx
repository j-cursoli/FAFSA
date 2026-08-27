import { Anchor, Group, Stack, Title } from '@mantine/core'
import { useFormContext, useWatch } from 'react-hook-form'
import { formatCurrency, formatDateOfBirth } from '../../../../../domain/format'
import {
  requiresParentIncome,
  requiresSpouseInformation,
  type FafsaFormValues,
  type NumericValue,
} from '../../../../../domain/schema'
import { findStateByCode } from '../../../../../domain/states'
import styles from './ReviewStep.module.css'

const EM_DASH = '—'

export interface ReviewStepProps {
  /** Jumps back to a step so the user can change an answer in place. */
  onEdit: (stepIndex: number) => void
}

interface ReviewEntry {
  readonly label: string
  readonly value: string
}

function textOrDash(value: string): string {
  return value.trim() === '' ? EM_DASH : value
}

function countOrDash(value: NumericValue): string {
  return value === '' ? EM_DASH : String(value)
}

function ReviewSection({
  title,
  stepIndex,
  entries,
  onEdit,
}: {
  title: string
  stepIndex: number
  entries: readonly ReviewEntry[]
  onEdit: (stepIndex: number) => void
}) {
  return (
    <section aria-labelledby={`review-${stepIndex}`} className={styles.section}>
      <Group justify="space-between" align="baseline" wrap="nowrap">
        <Title order={3} id={`review-${stepIndex}`} className={styles.sectionTitle}>
          {title}
        </Title>

        {/*
          A link-styled button rather than an anchor: this changes the step
          rather than navigating, and the accessible name says which section it
          edits so it is not one of five identical "Edit" links in a row.
        */}
        <Anchor
          component="button"
          type="button"
          onClick={() => onEdit(stepIndex)}
          className={styles.editLink}
        >
          Edit<span className={styles.visuallyHidden}> {title.toLowerCase()}</span>
        </Anchor>
      </Group>

      <dl className={styles.list}>
        {entries.map((entry) => (
          <div key={entry.label} className={styles.row}>
            <dt className={styles.term}>{entry.label}</dt>
            <dd className={styles.definition}>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ReviewStep({ onEdit }: ReviewStepProps) {
  const { control } = useFormContext<FafsaFormValues>()
  const values = useWatch({ control }) as FafsaFormValues

  const studentEntries: ReviewEntry[] = [
    { label: 'First name', value: textOrDash(values.firstName) },
    { label: 'Last name', value: textOrDash(values.lastName) },
    // The full number is shown deliberately: this is the last chance to catch a
    // typo in it, and masking here would defeat the point of a review step.
    { label: 'Social Security number', value: textOrDash(values.ssn) },
    { label: 'Date of birth', value: formatDateOfBirth(values.dateOfBirth) },
    {
      label: 'State of legal residence',
      value: findStateByCode(values.stateOfResidence)?.name ?? EM_DASH,
    },
  ]

  const statusEntries: ReviewEntry[] = [
    { label: 'Dependency status', value: textOrDash(values.dependencyStatus) },
    { label: 'Marital status', value: textOrDash(values.maritalStatus) },
  ]

  if (requiresSpouseInformation(values)) {
    statusEntries.push(
      { label: "Spouse's first name", value: textOrDash(values.spouseFirstName) },
      { label: "Spouse's last name", value: textOrDash(values.spouseLastName) },
      { label: "Spouse's Social Security number", value: textOrDash(values.spouseSsn) },
    )
  }

  const financeEntries: ReviewEntry[] = [
    { label: 'Number in household', value: countOrDash(values.numberInHousehold) },
    { label: 'Number in college', value: countOrDash(values.numberInCollege) },
    {
      label: 'Your income',
      value: values.studentIncome === '' ? EM_DASH : formatCurrency(values.studentIncome),
    },
  ]

  if (requiresParentIncome(values)) {
    financeEntries.push({
      label: 'Parent income',
      value: values.parentIncome === '' ? EM_DASH : formatCurrency(values.parentIncome),
    })
  }

  return (
    <Stack gap="xl">
      <p className={styles.intro}>
        Check your answers before submitting. Use the Edit links to change anything.
      </p>

      <ReviewSection
        title="Student information"
        stepIndex={0}
        entries={studentEntries}
        onEdit={onEdit}
      />
      <ReviewSection title="Status" stepIndex={1} entries={statusEntries} onEdit={onEdit} />
      <ReviewSection
        title="Household and finances"
        stepIndex={2}
        entries={financeEntries}
        onEdit={onEdit}
      />
    </Stack>
  )
}
