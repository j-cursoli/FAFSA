import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Somewhere to report the failure. Left injectable so it can be asserted on. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches a render failure so a crash shows an explanation instead of a blank
 * page.
 *
 * On a form holding half an hour of typing, an unhandled error that white-
 * screens the page loses everything the user entered with no explanation. This
 * at least tells them what happened and offers a way forward.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <Alert role="alert" color="red" variant="light" title="Something went wrong">
        <Stack gap="sm" align="flex-start">
          <Text size="sm">
            The application form could not be displayed. Your answers were not submitted.
            Reloading the page will start a new application.
          </Text>

          <Button type="button" onClick={this.handleReload} variant="default" size="sm">
            Reload the page
          </Button>
        </Stack>
      </Alert>
    )
  }
}
