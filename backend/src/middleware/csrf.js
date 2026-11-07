import { ApiError } from "../utils/ApiError.js";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  // Bearer-authenticated requests aren't CSRF-vulnerable
  const authHeader = req.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, "CSRF token missing or invalid"));
  }
  return next();
}