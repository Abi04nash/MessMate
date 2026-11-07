import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

export async function protect(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw new ApiError(401, "Authentication required");

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Session expired or invalid");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, "Account not found");
    if (user.status !== "active") throw new ApiError(403, "Account is " + user.status);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient permissions"));
    }
    next();
  };
}

// CRITICAL: If a token is present but expired/invalid, return 401 (not silent
// anonymous). This triggers auto-refresh on the client so the user's session
// self-heals instead of silently showing stale data with no registrations.
export function optionalAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return next(new ApiError(401, "Session expired"));
  }
}