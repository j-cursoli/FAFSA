import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Box, Button, Group, Stepper, Text, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
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
import {
  FIELD_LABELS,
  PROGRESS_STEPS,
  REVIEW_STEP_INDEX,
  WIZARD_STEPS,
  stepIndexForField,
} from './steps'
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
  const submitRequested = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const shouldFocusHeading = useRef(false)
  const focusField = useFocusField()

  // Measured, not guessed: the four steps stay on one row down to 665px and
  // wrap into a ragged two-row block at 660px. Switching to vertical at 680px
  // clears that band with a little margin, so the indicator is only ever one
  // tidy row or a clean stack — never half-wrapped. Stacking also gives each
  // step a full-width touch target.
  const isNarrowViewport = useMediaQuery('(max-width: 680px)', false)

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

  /**
   * Only a press of the submit button files the application.
   *
   * Defence in depth against the class of bug described on the buttons below:
   * a submit event that nobody asked for gets dropped rather than quietly
   * filing someone's FAFSA. React's synthetic handler for the clicked node
   * runs before the browser performs the click's default action, so a stray
   * submission arrives with this flag still false.
   */
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!submitRequested.current) {
      event.preventDefault()
      return
    }

    submitRequested.current = false
    void submit(event)
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
        orientation={isNarrowViewport ? 'vertical' : 'horizontal'}
        size="sm"
        className={styles.stepper}
      >
        {PROGRESS_STEPS.map((wizardStep) => (
          <Stepper.Step
            key={wizardStep.id}
            label={wizardStep.title}
            description={wizardStep.description}
          />
        ))}
      </Stepper>

      <form onSubmit={handleFormSubmit} noValidate>
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
            {`Step ${stepIndex + 1} of ${PROGRESS_STEPS.length}: ${step.title}`}
          </Text>

          {/*
            Arriving at a screen headed "Review" that already lists every
            answer is a natural place to wonder whether the application has
            gone in, so the review step says plainly that it has not.
          */}
          <Text size="sm" c="dimmed" mb="md">
            {isReviewStep
              ? 'Nothing is submitted until you select Submit application.'
              : 'All fields are required unless marked optional.'}
          </Text>

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

          {/*
            The keys are load-bearing, not decoration.

            Without them React reuses one DOM node for both buttons and merely
            changes its type. Clicking "Next" on the last question step then
            runs handleNext, React re-renders that same node into the
            type="submit" button, and the browser carries out the click's
            default action against it — submitting the application. The review
            step rendered for about four milliseconds before the confirmation
            replaced it, so the user never saw the answers they were supposed
            to be checking.

            Distinct keys make React unmount one button and mount the other, so
            the clicked node is gone by the time the default action would run.
          */}
          {isReviewStep ? (
            <Button
              key="submit-application"
              type="submit"
              onClick={() => {
                submitRequested.current = true
              }}
            >
              Submit application
            </Button>
          ) : (
            <Button key="next-step" type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </Group>
      </form>
    </FormProvider>
  )
}
