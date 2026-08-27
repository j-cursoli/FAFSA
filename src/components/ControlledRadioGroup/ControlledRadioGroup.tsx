import { Group, Radio, type RadioGroupProps } from '@mantine/core'
import { useController, type FieldPath, type FieldValues } from 'react-hook-form'

export interface RadioOption {
  readonly value: string
  readonly label: string
  readonly description?: string
}

export interface ControlledRadioGroupProps<TValues extends FieldValues>
  extends Omit<RadioGroupProps, 'name' | 'value' | 'onChange' | 'error' | 'id' | 'children'> {
  name: FieldPath<TValues>
  label: string
  options: readonly RadioOption[]
}

/**
 * Binds a Mantine Radio.Group to react-hook-form.
 *
 * Mantine renders this as a real fieldset with the label as its legend and
 * native radio inputs inside, so grouping is announced, arrow keys move within
 * the group, and Tab moves past it — all behaviour we would otherwise have to
 * rebuild and get subtly wrong.
 *
 * The first radio carries the field name as its id so the error summary can
 * send focus into the group, which is where a keyboard user needs to land.
 */
export function ControlledRadioGroup<TValues extends FieldValues>({
  name,
  options,
  ...props
}: ControlledRadioGroupProps<TValues>) {
  const { field, fieldState } = useController<TValues>({ name })

  return (
    <Radio.Group
      {...props}
      name={field.name}
      value={field.value ?? ''}
      onChange={field.onChange}
      error={fieldState.error?.message}
    >
      <Group mt="xs" gap="lg">
        {options.map((option, index) => (
          <Radio
            key={option.value}
            id={index === 0 ? name : `${name}-${option.value}`}
            value={option.value}
            label={option.label}
            description={option.description}
            onBlur={field.onBlur}
          />
        ))}
      </Group>
    </Radio.Group>
  )
}
