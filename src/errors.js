export class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends CustomError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}
