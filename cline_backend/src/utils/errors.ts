/**
 * Consistent application error type. Every API failure is rendered as:
 * { success: false, error: { code, message, details? } }
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }

  toJSON() {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export const Errors = {
  validation: (details?: unknown) =>
    new AppError('VALIDATION_ERROR', 'Request validation failed', 400, details),

  unauthenticated: (message = 'Authentication required') =>
    new AppError('UNAUTHENTICATED', message, 401),

  invalidToken: (message = 'Session token is invalid or expired') =>
    new AppError('INVALID_TOKEN', message, 401),

  invalidCredentials: () =>
    new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401),

  forbidden: (message = 'You do not have permission to perform this action') =>
    new AppError('FORBIDDEN', message, 403),

  notFound: (entity: string, identifier?: string) =>
    new AppError(
      `${entity.toUpperCase()}_NOT_FOUND`,
      `${entity}${identifier ? ` '${identifier}'` : ''} not found`,
      404,
    ),

  conflict: (code: string, message: string, details?: unknown) =>
    new AppError(code, message, 409, details),

  businessRule: (code: string, message: string, details?: unknown) =>
    new AppError(code, message, 422, details),

  rateLimited: (message = 'Too many requests, please try again later') =>
    new AppError('RATE_LIMITED', message, 429),

  internal: (message = 'Internal server error') =>
    new AppError('INTERNAL_ERROR', message, 500),
};

/** Well-known error codes (kept centralized for documentation/tests). */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INCIDENT_NOT_ACTIVE: 'INCIDENT_NOT_ACTIVE',
  UNIT_NOT_AVAILABLE: 'UNIT_NOT_AVAILABLE',
  DUPLICATE_DISPATCH: 'DUPLICATE_DISPATCH',
  NO_UNITS_AVAILABLE: 'NO_UNITS_AVAILABLE',
  TASK_ALREADY_ASSIGNED: 'TASK_ALREADY_ASSIGNED',
  TASK_NOT_COMPLETED: 'TASK_NOT_COMPLETED',
  TASK_ALREADY_VERIFIED: 'TASK_ALREADY_VERIFIED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
} as const;
