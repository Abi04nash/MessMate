import { sendSuccess } from "../utils/apiResponse.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";
import * as authService from "../services/authService.js";

export async function register(req, res, next) {
  try {
    const user = await authService.registerStudent(req.body);
    sendSuccess(res, {
      statusCode: 201,
      message: "Registration submitted. Awaiting approval.",
      data: { user }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login({
      ...req.body,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      csrfToken: result.csrfToken
    });
    sendSuccess(res, {
      message: "Logged in",
      data: { user: result.user, csrfToken: result.csrfToken }
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await authService.refresh({
      refreshToken: req.cookies?.refresh_token,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      csrfToken: result.csrfToken
    });
    sendSuccess(res, {
      message: "Session refreshed",
      data: { user: result.user, csrfToken: result.csrfToken }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout({ refreshToken: req.cookies?.refresh_token });
    clearAuthCookies(res);
    sendSuccess(res, { message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.me(req.user);
    sendSuccess(res, { data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const user = await authService.changePassword({
      user: req.user,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });
    clearAuthCookies(res);
    sendSuccess(res, {
      message: "Password changed. Please log in again.",
      data: { user }
    });
  } catch (err) {
    next(err);
  }
}