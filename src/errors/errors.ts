export class BaseError extends Error {
  public statusCode: number;
  public message: string;
  public data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      status: this.statusCode,
      message: this.message,
      ...(this.data && { data: this.data }),
    };
  }
}

export class BadRequestError extends BaseError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = "Resource Not Found") {
    super(404, message);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class ConflictError extends BaseError {
  constructor(message = "Conflict error") {
    super(409, message);
  }
}

export class ValidationError extends BaseError {
  constructor(data: any, message = "VALIDATION_ERROR") {
    super(422, message, data);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = "Internal Server Error") {
    super(500, message);
  }
}
