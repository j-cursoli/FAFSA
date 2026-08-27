import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Group, Stepper, Text, Title } from '@mantine/core'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { ErrorSummary, type ErrorSummaryEntry } from '../../../components/ErrorSummary'
import {
  defaultFafsaFormValues,
  fafsaFormSchema,
  type FafsaFieldName,
  type FafsaFormValues,
} from '../../../domain/schema'
import { ConfirmationStep } from './steps/ConfirmationStep'
import { HouseholdFinanceStep } from './steps/HouseholdFinanceStep'
import { ReviewStep } from './steps/ReviewStep'
import { StatusStep } from './steps/StatusStep'
import { StudentInfoStep } from './steps/StudentInfoStep'
import { FIELD_LABELS, REVIEW_STEP_INDEX, WIZARD_STEPS, stepIndexForField } from './steps'
import { clearDraft, initialValuesFromDraft, useFormDraft } from './useFormDraft'
import { useFocusField } from './useFocusField'
import styles from './FafsaWizard.module.css'

export interface FafsaWizardProps {
  onSubmit?: (values: FafsaFormValues) => void
}

export function FafsaWizard({ onSubmit }: FafsaWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [submittedName, setSubmittedName] = useState<string | null>(null)
  const [focusSummaryRequest, setFocusSummaryRequest] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const shouldFocusHeading = useRef(false)
  const focusField = useFocusField()

  const methods = useForm<FafsaFormValues>({
    // Restores anything the user had already typed before a refresh — minus
    // the Social Security numbers, which are never written to storage.
    defaultValues: initialValuesFromDraft(),
    resolver: zodResolver(fafsaFormSchema),
    // Validate a field the first time the user leaves it, then live on every
    // keystroke. Validating before they have finished typing scolds someone
    // mid-word; waiting until submit hides problems until it is too late.
    mode: 'onTouched',
  })

  const { control, formState, getValues, handleSubmit, reset, trigger } = methods

  useFormDraft(control)
  const step = WIZARD_STEPS[stepIndex]
  const isReviewStep = stepIndex === REVIEW_STEP_INDEX

  // Only surface errors for fields on the current step. Being told about a
  // problem three steps away, with no way to see it, is not actionable.
  const visibleFields: readonly FafsaFieldName[] = isReviewStep
    ? (Object.keys(FIELD_LABELS) as FafsaFieldName[])
    : step.fieldsFor(getValues())

  const summaryEntries: ErrorSummaryEntry[] = visibleFields
    .filter((field) => formState.errors[field])
    .map((field) => ({
      fieldName: field,
      label: FIELD_LABELS[field],
      message: String(formState.errors[field]?.message ?? ''),
    }))

  useEffect(() => {
    if (shouldFocusHeading.current) {
      shouldFocusHeading.current = false
      headingRef.current?.focus()
    }
  }, [stepIndex])

  // The summary does not exist in the DOM at the moment validation fails, so
  // focusing it has to wait for the render that adds it.
  useEffect(() => {
    if (focusSummaryRequest > 0) {
      summaryRef.current?.focus()
    }
  }, [focusSummaryRequest])

  const goToStep = useCallback((next: number) => {
    shouldFocusHeading.current = true
    setStepIndex(next)
  }, [])

  const handleNext = async () => {
    const isValid = await trigger(step.fieldsFor(getValues()) as FafsaFieldName[])

    if (!isValid) {
      // Focus the summary rather than the first bad field: the user gets the
      // full picture before being dropped into one input.
      setFocusSummaryRequest((request) => request + 1)
      return
    }

    goToStep(Math.min(stepIndex + 1, REVIEW_STEP_INDEX))
  }

  const handleBack = () => {
    goToStep(Math.max(stepIndex - 1, 0))
  }

  const handleSummaryNavigation = (fieldName: string) => {
    const targetStep = stepIndexForField(fieldName as FafsaFieldName, getValues())

    if (targetStep >= 0 && targetStep !== stepIndex) {
      setStepIndex(targetStep)
    }

    focusField(fieldName)
  }

  const submit = handleSubmit(
    (values) => {
      // The application is submitted; keeping a copy of it in storage serves
      // no one and only widens the window where personal data sits around.
      clearDraft()
      setSubmittedName(values.firstName)
      onSubmit?.(values)
    },
    () => {
      setFocusSummaryRequest((request) => request + 1)
    },
  )

  const handleStartAnother = () => {
    clearDraft()
    reset(defaultFafsaFormValues)
    setSubmittedName(null)
    setStepIndex(0)
  }

  if (submittedName !== null) {
    return <ConfirmationStep applicantName={submittedName} onStartAnother={handleStartAnother} />
  }

  return (
    <FormProvider {...methods}>
      <Stepper
        active={stepIndex}
        onStepClick={goToStep}
        allowNextStepsSelect={false}
        size="sm"
        className={styles.stepper}
      >
        {WIZARD_STEPS.map((wizardStep) => (
          <Stepper.Step key={wizardStep.id} label={wizardStep.title} />
        ))}
      </Stepper>

      <form onSubmit={submit} noValidate>
        <Box component="section" aria-labelledby="wizard-step-heading" className={styles.panel}>
          <Title
            order={2}
            id="wizard-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className={styles.heading}
          >
            {step.title}
          </Title>

          {/*
            The visible step counter is itself the live region, so a screen
            reader user hears exactly what a sighted user reads. A separate
            hidden announcement would say the same thing twice.
          */}
          <Text size="sm" c="dimmed" role="status" aria-live="polite">
            {`Step ${stepIndex + 1} of ${WIZARD_STEPS.length}: ${step.title}`}
          </Text>

          {!isReviewStep && (
            <Text size="sm" c="dimmed" mb="md">
              All fields are required unless marked optional.
            </Text>
          )}

          <ErrorSummary
            ref={summaryRef}
            entries={summaryEntries}
            onNavigateToField={handleSummaryNavigation}
          />

          <Box mt="lg">
            {stepIndex === 0 && <StudentInfoStep />}
            {stepIndex === 1 && <StatusStep />}
            {stepIndex === 2 && <HouseholdFinanceStep />}
            {isReviewStep && <ReviewStep onEdit={goToStep} />}
          </Box>
        </Box>

        <Group justify="space-between" mt="xl" className={styles.actions}>
          <Button
            type="button"
            variant="default"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            Back
          </Button>

          {isReviewStep ? (
            <Button type="submit">Submit application</Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </Group>
      </form>
    </FormProvider>
  )
}
