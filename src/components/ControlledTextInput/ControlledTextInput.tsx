import { TextInput, type TextInputProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'

export interface ControlledTextInputProps<TValues extends FieldValues>
  extends Omit<TextInputProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'id'> {
  name: FieldPath<TValues>
  label: string
}

/**
 * Binds a Mantine TextInput to react-hook-form.
 *
 * The input's `id` is the field name rather than a generated one so the error
 * summary can move focus to a field it only knows by name.
 *
 * Mantine derives the accessible wiring from `error` and `label`: it sets
 * aria-invalid, links the message through aria-describedby, and renders a real
 * <label for>. We deliberately do not hand-roll that here.
 */
export function ControlledTextInput<TValues extends FieldValues>({
  name,
  ...props
}: ControlledTextInputProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <TextInput
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
