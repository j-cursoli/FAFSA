import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '@mantine/core'
import {
  defaultFafsaFormValues,
  fafsaFormSchema,
  type FafsaFormValues,
} from '../domain/schema'
import { renderWithProviders } from './renderWithProviders'

interface FormHarnessProps {
  children: ReactNode
  defaultValues: FafsaFormValues
  onSubmit: (values: FafsaFormValues) => void
}

function FormHarness({ children, defaultValues, onSubmit }: FormHarnessProps) {
  const methods = useForm<FafsaFormValues>({
    defaultValues,
    resolver: zodResolver(fafsaFormSchema),
    mode: 'onTouched',
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        {children}
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  )
}

/**
 * Renders a field inside a real react-hook-form wired to the real schema, so
 * tests exercise the validation a user actually meets rather than a stand-in.
 * The Submit button gives tests a way to ask for validation the same way a user
 * would.
 */
export function renderWithForm(
  ui: ReactNode,
  options: {
    defaultValues?: Partial<FafsaFormValues>
    onSubmit?: (values: FafsaFormValues) => void
  } = {},
) {
  const onSubmit = options.onSubmit ?? (() => {})

  return renderWithProviders(
    <FormHarness
      defaultValues={{ ...defaultFafsaFormValues, ...options.defaultValues }}
      onSubmit={onSubmit}
    >
      {ui}
    </FormHarness>,
  )
}

export * from './renderWithProviders'
