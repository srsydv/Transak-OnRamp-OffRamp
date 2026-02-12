export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "bad_request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "unauthorized");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "not_found");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "conflict");
  }
}
