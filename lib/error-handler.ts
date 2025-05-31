import { toast } from "@/components/ui/use-toast"

// Tipos de erro personalizados
export class ViralizeError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(message: string, code: string, statusCode = 500, isOperational = true, context?: Record<string, any>) {
    super(message)
    this.name = "ViralizeError"
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Manter stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Códigos de erro padronizados
export const ERROR_CODES = {
  // Autenticação
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_INVALID: "AUTH_INVALID",
  AUTH_EXPIRED: "AUTH_EXPIRED",

  // Replicate
  REPLICATE_NOT_CONFIGURED: "REPLICATE_NOT_CONFIGURED",
  REPLICATE_API_ERROR: "REPLICATE_API_ERROR",
  REPLICATE_TIMEOUT: "REPLICATE_TIMEOUT",
  REPLICATE_QUOTA_EXCEEDED: "REPLICATE_QUOTA_EXCEEDED",

  // Supabase
  SUPABASE_CONNECTION_ERROR: "SUPABASE_CONNECTION_ERROR",
  SUPABASE_QUERY_ERROR: "SUPABASE_QUERY_ERROR",

  // Upload/Arquivo
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_INVALID_TYPE: "FILE_INVALID_TYPE",
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // Validação
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Genérico
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const

// Mensagens de erro amigáveis
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_REQUIRED]: "Você precisa estar logado para realizar esta ação",
  [ERROR_CODES.AUTH_INVALID]: "Credenciais inválidas",
  [ERROR_CODES.AUTH_EXPIRED]: "Sua sessão expirou. Faça login novamente",

  [ERROR_CODES.REPLICATE_NOT_CONFIGURED]: "Serviço de IA não configurado",
  [ERROR_CODES.REPLICATE_API_ERROR]: "Erro no serviço de IA. Tente novamente",
  [ERROR_CODES.REPLICATE_TIMEOUT]: "Operação demorou muito para completar",
  [ERROR_CODES.REPLICATE_QUOTA_EXCEEDED]: "Limite de uso atingido. Upgrade seu plano",

  [ERROR_CODES.SUPABASE_CONNECTION_ERROR]: "Erro de conexão com o banco de dados",
  [ERROR_CODES.SUPABASE_QUERY_ERROR]: "Erro ao processar dados",

  [ERROR_CODES.FILE_TOO_LARGE]: "Arquivo muito grande. Máximo 10MB",
  [ERROR_CODES.FILE_INVALID_TYPE]: "Tipo de arquivo não suportado",
  [ERROR_CODES.UPLOAD_FAILED]: "Falha no upload do arquivo",

  [ERROR_CODES.VALIDATION_ERROR]: "Dados inválidos fornecidos",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: "Campo obrigatório não preenchido",

  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Muitas tentativas. Aguarde um momento",

  [ERROR_CODES.NETWORK_ERROR]: "Erro de conexão. Verifique sua internet",
  [ERROR_CODES.UNKNOWN_ERROR]: "Erro inesperado. Tente novamente",
} as const

// Logger centralizado
export class Logger {
  private static instance: Logger

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  public error(error: Error | ViralizeError, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      ...(error instanceof ViralizeError && {
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        errorContext: error.context,
      }),
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 Error:", errorData)
    }

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring(errorData)
    }
  }

  public warn(message: string, context?: Record<string, any>) {
    const logData = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Warning:", logData)
    }
  }

  public info(message: string, context?: Record<string, any>) {
    const logData = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (process.env.NODE_ENV === "development") {
      console.info("ℹ️ Info:", logData)
    }
  }

  private sendToMonitoring(errorData: any) {
    // Implementar integração com Sentry, LogRocket, etc.
    // Por enquanto, apenas log
    console.error("Production Error:", errorData)
  }
}

// Handler de erro global
export class ErrorHandler {
  private static logger = Logger.getInstance()

  public static handle(error: Error | ViralizeError, context?: Record<string, any>): ViralizeError {
    // Log do erro
    this.logger.error(error, context)

    // Se já é um ViralizeError, retornar como está
    if (error instanceof ViralizeError) {
      return error
    }

    // Mapear erros conhecidos
    const mappedError = this.mapError(error)
    if (mappedError) {
      return mappedError
    }

    // Erro genérico
    return new ViralizeError(ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR], ERROR_CODES.UNKNOWN_ERROR, 500, false, {
      originalError: error.message,
      ...context,
    })
  }

  private static mapError(error: Error): ViralizeError | null {
    const message = error.message.toLowerCase()

    // Erros de rede
    if (message.includes("network") || message.includes("fetch")) {
      return new ViralizeError(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR], ERROR_CODES.NETWORK_ERROR, 503)
    }

    // Erros do Replicate
    if (message.includes("replicate")) {
      if (message.includes("timeout")) {
        return new ViralizeError(ERROR_MESSAGES[ERROR_CODES.REPLICATE_TIMEOUT], ERROR_CODES.REPLICATE_TIMEOUT, 408)
      }
      if (message.includes("quota") || message.includes("limit")) {
        return new ViralizeError(
          ERROR_MESSAGES[ERROR_CODES.REPLICATE_QUOTA_EXCEEDED],
          ERROR_CODES.REPLICATE_QUOTA_EXCEEDED,
          429,
        )
      }
      return new ViralizeError(ERROR_MESSAGES[ERROR_CODES.REPLICATE_API_ERROR], ERROR_CODES.REPLICATE_API_ERROR, 502)
    }

    // Erros de autenticação
    if (message.includes("unauthorized") || message.includes("auth")) {
      return new ViralizeError(ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED], ERROR_CODES.AUTH_REQUIRED, 401)
    }

    // Erros do Supabase
    if (message.includes("supabase") || message.includes("postgres")) {
      return new ViralizeError(
        ERROR_MESSAGES[ERROR_CODES.SUPABASE_CONNECTION_ERROR],
        ERROR_CODES.SUPABASE_CONNECTION_ERROR,
        503,
      )
    }

    return null
  }

  public static showUserError(error: ViralizeError) {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    })
  }

  public static showUserSuccess(message: string) {
    toast({
      title: "Sucesso",
      description: message,
    })
  }

  public static showUserWarning(message: string) {
    toast({
      title: "Atenção",
      description: message,
      variant: "destructive",
    })
  }
}

// Hook para tratamento de erros em componentes
export function useErrorHandler() {
  const handleError = (error: Error | ViralizeError, context?: Record<string, any>) => {
    const processedError = ErrorHandler.handle(error, context)
    ErrorHandler.showUserError(processedError)
    return processedError
  }

  const handleSuccess = (message: string) => {
    ErrorHandler.showUserSuccess(message)
  }

  const handleWarning = (message: string) => {
    ErrorHandler.showUserWarning(message)
  }

  return {
    handleError,
    handleSuccess,
    handleWarning,
  }
}

// Wrapper para operações assíncronas
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
): Promise<{ data: T | null; error: ViralizeError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const processedError = ErrorHandler.handle(error as Error, context)
    return { data: null, error: processedError }
  }
}

// Retry com backoff exponencial
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  context?: Record<string, any>,
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw ErrorHandler.handle(lastError, { ...context, attempts: attempt })
      }

      // Backoff exponencial
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))

      Logger.getInstance().warn(`Retry attempt ${attempt}/${maxRetries}`, {
        error: lastError.message,
        delay,
        ...context,
      })
    }
  }

  throw lastError!
}
