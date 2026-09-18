import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class ExperienceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[PromoCatch] render error', error, info.componentStack)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <p className="runtime-message" role="alert">
          No se pudo mostrar la experiencia interactiva. Usa Reiniciar demo
          para intentarlo de nuevo.
        </p>
      )
    }

    return this.props.children
  }
}
