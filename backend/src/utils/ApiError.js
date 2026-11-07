export class ApiError extends Error {
  constructor(statusCode, message, details = undefined, code = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(m = "Bad request", d) { return new ApiError(400, m, d); }
  static unauthorized(m = "Authentication required") { return new ApiError(401, m); }
  static forbidden(m = "You do not have permission to perform this action") { return new ApiError(403, m); }
  static notFound(m = "Resource not found") { return new ApiError(404, m); }
  static conflict(m = "Conflicting operation", d) { return new ApiError(409, m, d); }
  static unprocessable(m = "Semantically invalid input", d) { return new ApiError(422, m, d); }
  static tooManyRequests(m = "Too many requests") { return new ApiError(429, m); }
  static internal(m = "Internal server error") { return new ApiError(500, m); }
}