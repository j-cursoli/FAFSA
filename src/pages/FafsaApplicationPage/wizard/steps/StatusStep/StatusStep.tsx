import { Stack, Title, VisuallyHidden } from '@mantine/core'
import { useFormContext, useWatch } from 'react-hook-form'
import { ControlledRadioGroup } from '../../../../../components/ControlledRadioGroup'
import { ControlledSsnInput } from '../../../../../components/ControlledSsnInput'
import { ControlledTextInput } from '../../../../../components/ControlledTextInput'
import { requiresSpouseInformation, type FafsaFormValues } from '../../../../../domain/schema'
import styles from './StatusStep.module.css'

export function StatusStep() {
  const { control } = useFormContext<FafsaFormValues>()
  const maritalStatus = useWatch({ control, name: 'maritalStatus' })
  const showSpouseFields = requiresSpouseInformation({ maritalStatus })

  return (
    <Stack gap="lg">
      <ControlledRadioGroup<FafsaFormValues>
        name="dependencyStatus"
        label="Dependency status"
        description="Most students under 24 are dependent. Independent students report their own income only."
        options={[
          { value: 'dependent', label: 'Dependent' },
          { value: 'independent', label: 'Independent' },
        ]}
      />

      <ControlledRadioGroup<FafsaFormValues>
        name="maritalStatus"
        label="Marital status"
        options={[
          { value: 'single', label: 'Single' },
          { value: 'married', label: 'Married' },
        ]}
      />

      {/*
        The reveal is announced separately from the fields themselves. A screen
        reader user who selects "Married" is several tab stops away from the new
        inputs and would otherwise have no idea the form just grew.
      */}
      <VisuallyHidden role="status" aria-live="polite">
        {showSpouseFields ? 'Spouse information is now required. Three fields were added below.' : ''}
      </VisuallyHidden>

      {showSpouseFields && (
        <div className={styles.spouseSection}>
          <Title order={3} className={styles.subheading}>
            Spouse information
          </Title>

          <Stack gap="lg">
            <ControlledTextInput<FafsaFormValues>
              name="spouseFirstName"
              label="Spouse's first name"
              required
            />

            <ControlledTextInput<FafsaFormValues>
              name="spouseLastName"
              label="Spouse's last name"
              required
            />

            <ControlledSsnInput<FafsaFormValues>
              name="spouseSsn"
              label="Spouse's Social Security number"
              required
              description="9 digits. Hyphens are added as you type."
            />
          </Stack>
        </div>
      )}
    </Stack>
  )
}
