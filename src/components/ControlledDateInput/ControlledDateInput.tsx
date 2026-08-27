import { TextInput, type TextInputProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'

export interface ControlledDateInputProps<TValues extends FieldValues>
  extends Omit<
    TextInputProps,
    'name' | 'value' | 'onChange' | 'onBlur' | 'error' | 'id' | 'type'
  > {
  name: FieldPath<TValues>
  label: string
  /** Latest date the user may pick, as YYYY-MM-DD. */
  max?: string
}

/**
 * A date field built on the native <input type="date">.
 *
 * Chosen over a custom calendar widget on purpose: the native control is
 * already keyboard operable and announced correctly by screen readers, it opens
 * the platform date picker on mobile, and it has no popover to trap focus in.
 * For a date of birth a calendar is the wrong shape anyway — nobody wants to
 * page back twenty years — and the native control accepts typed entry.
 *
 * The value is the YYYY-MM-DD string the element natively reads and writes, so
 * nothing has to be converted on the way in or out.
 */
export function ControlledDateInput<TValues extends FieldValues>({
  name,
  ...props
}: ControlledDateInputProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <TextInput
      {...props}
      id={name}
      name={field.name}
      ref={field.ref}
      type="date"
      value={field.value ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )
}
