/**
 * Base class for predictable, "operational" errors (bad input, not found,
 * conflict, etc.) as opposed to programming errors/bugs. The global error
 * handler uses `isOperational` to decide what's safe to expose to clients.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    options?: { code?: string; details?: unknown }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = options?.code;
    this.details = options?.details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', options?: { code?: string; details?: unknown }) {
    super(message, 400, true, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', options?: { code?: string; details?: unknown }) {
    super(message, 404, true, options);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', options?: { code?: string; details?: unknown }) {
    super(message, 409, true, options);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unable to process request', options?: { code?: string; details?: unknown }) {
    super(message, 422, true, options);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}


export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}