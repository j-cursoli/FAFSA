import { Stack, Title, VisuallyHidden } from '@mantine/core'
import { useFormContext, useWatch } from 'react-hook-form'
import { ControlledCurrencyInput } from '../../../../../components/ControlledCurrencyInput'
import { ControlledNumberInput } from '../../../../../components/ControlledNumberInput'
import { requiresParentIncome, type FafsaFormValues } from '../../../../../domain/schema'
import styles from './HouseholdFinanceStep.module.css'

export function HouseholdFinanceStep() {
  const { control } = useFormContext<FafsaFormValues>()
  const dependencyStatus = useWatch({ control, name: 'dependencyStatus' })
  const showParentIncome = requiresParentIncome({ dependencyStatus })

  return (
    <Stack gap="lg">
      <ControlledNumberInput<FafsaFormValues>
        name="numberInHousehold"
        label="Number in household"
        required
        min={1}
        allowDecimal={false}
        allowNegative={false}
        description="Include yourself, your parents if you are dependent, and anyone they support."
      />

      <ControlledNumberInput<FafsaFormValues>
        name="numberInCollege"
        label="Number in college"
        required
        min={1}
        allowDecimal={false}
        allowNegative={false}
        description="How many people in your household will attend college, including you."
      />

      <div>
        <Title order={3} className={styles.subheading}>
          Income
        </Title>

        <Stack gap="lg">
          <ControlledCurrencyInput<FafsaFormValues>
            name="studentIncome"
            label="Your income"
            required
            description="Your income for the tax year. Enter 0 if you had none."
          />

          <VisuallyHidden role="status" aria-live="polite">
            {showParentIncome
              ? 'Parent income is now required. A field was added below.'
              : ''}
          </VisuallyHidden>

          {showParentIncome && (
            <ControlledCurrencyInput<FafsaFormValues>
              name="parentIncome"
              label="Parent income"
              required
              description="Dependent students must report parent income. Enter 0 if they had none."
            />
          )}
        </Stack>
      </div>
    </Stack>
  )
}
