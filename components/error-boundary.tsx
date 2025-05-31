"use client"

import React from "react"
import { Logger } from "@/lib/error-handler"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  errorId: string
  resetError: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger = Logger.getInstance()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: "",
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro
    this.logger.error(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorId: this.state.errorId,
    })

    // Callback personalizado
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: "",
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} errorId={this.state.errorId} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Componente de fallback padrão
function DefaultErrorFallback({ error, errorId, resetError }: ErrorFallbackProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.push("/")
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-coral-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Oops! Algo deu errado</h1>
          <p className="text-muted-foreground mb-6">
            Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-muted p-4 rounded-md mb-6 text-left">
              <p className="text-sm font-mono text-muted-foreground mb-2">Error ID: {errorId}</p>
              <p className="text-sm font-mono text-red-600">{error.message}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={resetError} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>

            <Button onClick={handleReload} className="w-full" variant="outline">
              Recarregar Página
            </Button>

            <Button onClick={handleGoHome} className="w-full" variant="ghost">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error Boundary específico para operações de IA
export function AIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={AIErrorFallback}
      onError={(error, errorInfo) => {
        Logger.getInstance().error(error, {
          context: "AI_OPERATION",
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function AIErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-coral-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Erro na Operação de IA</h3>
      <p className="text-muted-foreground mb-4">Não foi possível processar sua solicitação. Tente novamente.</p>
      <Button onClick={resetError} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  )
}

// Error Boundary para upload de arquivos
export function UploadErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={UploadErrorFallback}
      onError={(error, errorInfo) => {
        Logger.getInstance().error(error, {
          context: "FILE_UPLOAD",
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function UploadErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-muted rounded-lg">
      <AlertTriangle className="h-6 w-6 text-coral-500 mb-2" />
      <h4 className="font-medium mb-1">Erro no Upload</h4>
      <p className="text-sm text-muted-foreground mb-3">Não foi possível fazer upload do arquivo.</p>
      <Button onClick={resetError} size="sm" variant="outline">
        Tentar Novamente
      </Button>
    </div>
  )
}
