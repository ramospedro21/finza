export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, options?: ErrorOptions) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404, options);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'VALIDATION_ERROR', 400, options);
    this.name = 'ValidationError';
  }
}