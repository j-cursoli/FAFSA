import type { FieldPath, FieldValues } from 'react-hook-form'
import {
  ControlledNumberInput,
  type ControlledNumberInputProps,
} from '../ControlledNumberInput'

export interface ControlledCurrencyInputProps<TValues extends FieldValues>
  extends Omit<ControlledNumberInputProps<TValues>, 'prefix' | 'thousandSeparator'> {
  name: FieldPath<TValues>
  label: string
}

/**
 * A money field: dollar prefix, thousands separators, at most two decimals.
 *
 * Formatting as the user types means the number they see always matches the
 * number that will be submitted — there is no moment where "65000" turns into
 * something else after they look away.
 *
 * Negative values are still accepted by the input so that validation can
 * explain the rule ("income cannot be negative, enter 0") rather than the field
 * silently swallowing the minus sign and leaving the user confused.
 */
export function ControlledCurrencyInput<TValues extends FieldValues>(
  props: ControlledCurrencyInputProps<TValues>,
) {
  return (
    <ControlledNumberInput
      prefix="$"
      thousandSeparator=","
      decimalScale={2}
      inputMode="decimal"
      {...props}
    />
  )
}
