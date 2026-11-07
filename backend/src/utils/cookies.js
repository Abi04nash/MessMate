import { cookieBaseOptions } from "../middleware/security.js";
import { env } from "../config/env.js";
import { ttlToMs } from "./tokens.js";

export function setAuthCookies(res, { accessToken, refreshToken, csrfToken }) {
  const accessMax = ttlToMs(env.ACCESS_TOKEN_TTL);
  const refreshMax = ttlToMs(env.REFRESH_TOKEN_TTL);
  const csrfMax = refreshMax;

  res.cookie("access_token", accessToken, {
    ...cookieBaseOptions,
    maxAge: accessMax
  });

  res.cookie("refresh_token", refreshToken, {
    ...cookieBaseOptions,
    maxAge: refreshMax,
    path: "/api/v1/auth"
  });

  // CSRF token must be readable by JS (double-submit pattern)
  res.cookie("csrf_token", csrfToken, {
    ...cookieBaseOptions,
    httpOnly: false,
    maxAge: csrfMax
  });
}

export function clearAuthCookies(res) {
  const base = { ...cookieBaseOptions };
  res.clearCookie("access_token", base);
  res.clearCookie("refresh_token", { ...base, path: "/api/v1/auth" });
  res.clearCookie("csrf_token", { ...base, httpOnly: false });
}