import { toast } from 'sonner'

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Structured error interface
export interface StructuredError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  code?: string
  statusCode?: number
  timestamp: string
  context?: Record<string, any>
  stack?: string
  userId?: string
  sessionId?: string
  requestId?: string
}

// Error logging service
class ErrorLogger {
  private static instance: ErrorLogger
  private errors: StructuredError[] = []
  private maxStoredErrors = 100

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(error: StructuredError): void {
    // Add to local storage (for debugging)
    this.errors.unshift(error)
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors)
    }

    // Console logging based on severity
    const logMethod = this.getLogMethod(error.severity)
    logMethod(`[${error.type.toUpperCase()}] ${error.message}`, {
      id: error.id,
      code: error.code,
      context: error.context,
      stack: error.stack
    })

    // In a production app, you would send critical/high severity errors
    // to your error monitoring service (e.g., Sentry, DataDog, etc.)
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      this.sendToMonitoring(error)
    }
  }

  private getLogMethod(severity: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error
      case ErrorSeverity.MEDIUM:
        return console.warn
      case ErrorSeverity.LOW:
      default:
        return console.info
    }
  }

  private sendToMonitoring(error: StructuredError): void {
    // In production, integrate with error monitoring service
    // Example: Sentry.captureException(error)
    console.error('CRITICAL ERROR - Would send to monitoring:', error)
  }

  getRecentErrors(count = 10): StructuredError[] {
    return this.errors.slice(0, count)
  }

  clearErrors(): void {
    this.errors = []
  }
}

// Error factory functions
export class ErrorFactory {
  private static logger = ErrorLogger.getInstance()

  static createError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    userMessage: string,
    options: {
      code?: string
      statusCode?: number
      context?: Record<string, any>
      originalError?: Error
      userId?: string
      sessionId?: string
      requestId?: string
    } = {}
  ): StructuredError {
    const error: StructuredError = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      userMessage,
      code: options.code,
      statusCode: options.statusCode,
      timestamp: new Date().toISOString(),
      context: options.context,
      stack: options.originalError?.stack,
      userId: options.userId,
      sessionId: options.sessionId,
      requestId: options.requestId
    }

    this.logger.log(error)
    return error
  }

  // Specific error type creators
  static validation(
    message: string,
    userMessage: string = 'Please check your input and try again',
    context?: Record<string, any>
  ): StructuredError {
    return this.createError(ErrorType.VALIDATION, ErrorSeverity.LOW, message, userMessage, { context })
  }

  static authentication(
    message: string = 'Authentication failed',
    userMessage: string = 'Please sign in to continue'
  ): StructuredError {
    return this.createError(ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, message, userMessage)
  }

  static authorization(
    message: string = 'Access denied',
    userMessage: string = 'You don\'t have permission to perform this action'
  ): StructuredError {
    return this.createError(ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM, message, userMessage)
  }

  static network(
    message: string,
    userMessage: string = 'Network error. Please check your connection and try again',
    statusCode?: number
  ): StructuredError {
    return this.createError(ErrorType.NETWORK, ErrorSeverity.MEDIUM, message, userMessage, { statusCode })
  }

  static database(
    message: string,
    userMessage: string = 'A database error occurred. Please try again',
    code?: string
  ): StructuredError {
    return this.createError(ErrorType.DATABASE, ErrorSeverity.HIGH, message, userMessage, { code })
  }

  static businessLogic(
    message: string,
    userMessage: string,
    context?: Record<string, any>
  ): StructuredError {
    return this.createError(ErrorType.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, message, userMessage, { context })
  }

  static system(
    message: string,
    userMessage: string = 'A system error occurred. Our team has been notified',
    originalError?: Error
  ): StructuredError {
    return this.createError(ErrorType.SYSTEM, ErrorSeverity.CRITICAL, message, userMessage, { originalError })
  }

  static unknown(
    originalError: Error,
    userMessage: string = 'An unexpected error occurred'
  ): StructuredError {
    return this.createError(
      ErrorType.UNKNOWN, 
      ErrorSeverity.HIGH, 
      originalError.message, 
      userMessage, 
      { originalError }
    )
  }
}

// User-friendly error handler
export class UserErrorHandler {
  static handle(error: StructuredError, options: {
    showToast?: boolean
    toastDuration?: number
    logToConsole?: boolean
  } = {}): void {
    const {
      showToast = true,
      toastDuration = 5000,
      logToConsole = false
    } = options

    if (logToConsole) {
      console.error('Handled error:', error)
    }

    if (showToast) {
      const toastOptions = {
        duration: toastDuration,
        description: error.context?.description || undefined,
        action: error.context?.action || undefined
      }

      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          toast.error(error.userMessage, toastOptions)
          break
        case ErrorSeverity.MEDIUM:
          toast.warning(error.userMessage, toastOptions)
          break
        case ErrorSeverity.LOW:
        default:
          toast.info(error.userMessage, toastOptions)
          break
      }
    }
  }

  static handleApiResponse(response: { success: boolean; error?: any }): void {
    if (!response.success && response.error) {
      const error = this.parseApiError(response.error)
      this.handle(error)
    }
  }

  private static parseApiError(apiError: any): StructuredError {
    const code = apiError.code || 'UNKNOWN_API_ERROR'
    const message = apiError.message || 'API request failed'
    const details = apiError.details

    // Map common API error codes to user-friendly messages
    const userMessage = this.getUserFriendlyMessage(code, message)

    return ErrorFactory.createError(
      this.mapErrorType(code),
      this.mapErrorSeverity(code),
      message,
      userMessage,
      { code, context: details }
    )
  }

  private static getUserFriendlyMessage(code: string, originalMessage: string): string {
    const messageMap: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again',
      'UNAUTHENTICATED': 'Please sign in to continue',
      'INSUFFICIENT_PERMISSIONS': 'You don\'t have permission to perform this action',
      'NOT_FOUND': 'The requested item was not found',
      'EMAIL_ALREADY_EXISTS': 'This email address is already registered',
      'INVALID_EMAIL_DOMAIN': 'Please use your company email address',
      'USER_CREATION_FAILED': 'Failed to create user account',
      'UPDATE_FAILED': 'Failed to save changes',
      'DELETE_FAILED': 'Failed to delete item',
      'NETWORK_ERROR': 'Network error. Please check your connection and try again',
      'DATABASE_ERROR': 'A database error occurred. Please try again',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again',
      'MAINTENANCE_MODE': 'The system is currently under maintenance. Please try again later'
    }

    return messageMap[code] || originalMessage || 'An error occurred'
  }

  private static mapErrorType(code: string): ErrorType {
    const typeMap: Record<string, ErrorType> = {
      'VALIDATION_ERROR': ErrorType.VALIDATION,
      'UNAUTHENTICATED': ErrorType.AUTHENTICATION,
      'INSUFFICIENT_PERMISSIONS': ErrorType.AUTHORIZATION,
      'NOT_FOUND': ErrorType.BUSINESS_LOGIC,
      'NETWORK_ERROR': ErrorType.NETWORK,
      'DATABASE_ERROR': ErrorType.DATABASE
    }

    return typeMap[code] || ErrorType.UNKNOWN
  }

  private static mapErrorSeverity(code: string): ErrorSeverity {
    const severityMap: Record<string, ErrorSeverity> = {
      'VALIDATION_ERROR': ErrorSeverity.LOW,
      'UNAUTHENTICATED': ErrorSeverity.MEDIUM,
      'INSUFFICIENT_PERMISSIONS': ErrorSeverity.MEDIUM,
      'NOT_FOUND': ErrorSeverity.LOW,
      'NETWORK_ERROR': ErrorSeverity.MEDIUM,
      'DATABASE_ERROR': ErrorSeverity.HIGH,
      'SYSTEM_ERROR': ErrorSeverity.CRITICAL
    }

    return severityMap[code] || ErrorSeverity.MEDIUM
  }
}

// Retry utility for handling transient errors
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number
      delay?: number
      backoffMultiplier?: number
      retryCondition?: (error: any) => boolean
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoffMultiplier = 2,
      retryCondition = (error) => this.isRetriableError(error)
    } = options

    let lastError: any
    let currentDelay = delay

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        // Don't retry on last attempt or if error is not retriable
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw error
        }

        // Log retry attempt
        console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${currentDelay}ms:`, error)

        // Wait before retry
        await this.sleep(currentDelay)
        currentDelay *= backoffMultiplier
      }
    }

    throw lastError
  }

  private static isRetriableError(error: any): boolean {
    // Network errors are usually retriable
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return true
    }

    // Timeout errors are retriable
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return true
    }

    // HTTP 5xx errors are retriable (server errors)
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true
    }

    // HTTP 429 (rate limit) is retriable
    if (error.statusCode === 429) {
      return true
    }

    // Database connection errors might be retriable
    if (error.code === '08000' || error.code === '08003' || error.code === '08006') {
      return true
    }

    return false
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Error boundary helper for React components
export class ErrorBoundaryHelper {
  static captureError(error: Error, errorInfo?: any): StructuredError {
    const structuredError = ErrorFactory.system(
      error.message,
      'Something went wrong. Please refresh the page and try again.',
      error
    )

    // Add additional context if available
    if (errorInfo) {
      structuredError.context = {
        ...structuredError.context,
        componentStack: errorInfo.componentStack
      }
    }

    return structuredError
  }
}

// Global error handler setup
export const setupGlobalErrorHandling = (): void => {
  // Handle unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ErrorFactory.system(
      event.reason?.message || 'Unhandled promise rejection',
      'An unexpected error occurred',
      event.reason
    )
    UserErrorHandler.handle(error)
    event.preventDefault() // Prevent default browser error handling
  })

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    const error = ErrorFactory.system(
      event.error?.message || event.message,
      'A JavaScript error occurred',
      event.error
    )
    UserErrorHandler.handle(error)
  })
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()

// Convenience exports (avoid duplicate exports)
export { UserErrorHandler as ErrorHandler }