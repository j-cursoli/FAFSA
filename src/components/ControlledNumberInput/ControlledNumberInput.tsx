import { NumberInput, type NumberInputProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'

export interface ControlledNumberInputProps<TValues extends FieldValues>
  extends Omit<NumberInputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'id'> {
  name: FieldPath<TValues>
  label: string
}

/**
 * Binds a Mantine NumberInput to react-hook-form.
 *
 * NumberInput reports '' while the field is empty, which is exactly the shape
 * the schema expects — an empty count is "not answered yet", not zero, and the
 * two need different error messages.
 *
 * `clampBehavior="none"` is deliberate: silently rewriting a number the user
 * typed hides the mistake instead of explaining it. Out-of-range values are
 * kept so validation can say what is wrong.
 */
export function ControlledNumberInput<TValues extends FieldValues>({
  name,
  ...props
}: ControlledNumberInputProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <NumberInput
      clampBehavior="none"
      {...props}
      id={name}
      name={field.name}
      ref={field.ref}
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )
}
