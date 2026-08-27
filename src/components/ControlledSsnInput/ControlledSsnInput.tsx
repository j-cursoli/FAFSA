import { TextInput, type TextInputProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'
import { normalizeSsn } from '../../domain/format'

export interface ControlledSsnInputProps<TValues extends FieldValues>
  extends Omit<
    TextInputProps,
    'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'id' | 'type' | 'inputMode'
  > {
  name: FieldPath<TValues>
  label: string
}

/**
 * A Social Security number field that lays in the hyphens as the user types.
 *
 * Formatting on every keystroke — rather than only on blur — means the value in
 * the field always matches the format the error message asks for, so the user
 * is never told to add punctuation the field would have added for them.
 *
 * inputMode="numeric" raises a number pad on touch devices without the spinner
 * and locale quirks that type="number" brings, and autoComplete is off because
 * browsers should not be filling an SSN from a saved profile.
 */
export function ControlledSsnInput<TValues extends FieldValues>({
  name,
  ...props
}: ControlledSsnInputProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <TextInput
      placeholder="123-45-6789"
      {...props}
      id={name}
      name={field.name}
      ref={field.ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={11}
      value={field.value ?? ''}
      onChange={(event) => field.onChange(normalizeSsn(event.currentTarget.value))}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )
}
