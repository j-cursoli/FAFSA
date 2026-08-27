import { Stack, Title } from '@mantine/core'
import { ControlledDateInput } from '../../../../../components/ControlledDateInput'
import { ControlledNativeSelect } from '../../../../../components/ControlledNativeSelect'
import { ControlledSsnInput } from '../../../../../components/ControlledSsnInput'
import { ControlledTextInput } from '../../../../../components/ControlledTextInput'
import { toIsoDate } from '../../../../../domain/format'
import { MINIMUM_STUDENT_AGE, type FafsaFormValues } from '../../../../../domain/schema'
import { US_STATES } from '../../../../../domain/states'
import styles from './StudentInfoStep.module.css'

const STATE_OPTIONS = [
  { value: '', label: 'Select a state' },
  ...US_STATES.map((state) => ({ value: state.code, label: state.name })),
]

export function StudentInfoStep() {
  // Recomputed per render rather than at module load, so a session left open
  // overnight does not keep yesterday's ceiling.
  const today = toIsoDate(new Date())

  return (
    <Stack gap="lg">
      <ControlledTextInput<FafsaFormValues>
        name="firstName"
        label="First name"
        required
        autoComplete="given-name"
      />

      <ControlledTextInput<FafsaFormValues>
        name="lastName"
        label="Last name"
        required
        autoComplete="family-name"
      />

      <ControlledSsnInput<FafsaFormValues>
        name="ssn"
        label="Social Security number"
        required
        description="9 digits. Hyphens are added as you type."
      />

      <ControlledDateInput<FafsaFormValues>
        name="dateOfBirth"
        label="Date of birth"
        required
        max={today}
        description={`You must be at least ${MINIMUM_STUDENT_AGE} years old to apply.`}
        autoComplete="bday"
      />

      <div>
        <Title order={3} className={styles.subheading}>
          Residence
        </Title>

        <ControlledNativeSelect<FafsaFormValues>
          name="stateOfResidence"
          label="State of legal residence"
          required
          data={STATE_OPTIONS}
          description="The state where you legally reside, which may differ from where you attend school."
        />
      </div>
    </Stack>
  )
}
