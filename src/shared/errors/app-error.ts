export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden for your role', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}
