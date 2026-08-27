import { NativeSelect, type NativeSelectProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'

export interface ControlledNativeSelectProps<TValues extends FieldValues>
  extends Omit<NativeSelectProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'id'> {
  name: FieldPath<TValues>
  label: string
}

/**
 * Binds a native <select> to react-hook-form.
 *
 * NativeSelect rather than Mantine's searchable Select: for a list of 56 states
 * the native control gives type-ahead, full keyboard support and the platform's
 * own wheel picker on mobile, with no listbox ARIA for us to get wrong. A
 * custom combobox would look more polished and behave worse.
 */
export function ControlledNativeSelect<TValues extends FieldValues>({
  name,
  ...props
}: ControlledNativeSelectProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <NativeSelect
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
