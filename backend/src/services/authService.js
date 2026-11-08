import crypto from "node:crypto";
import { User } from "../models/User.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { Bill } from "../models/Bill.js";
import { Attendance } from "../models/Attendance.js";
import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  hashToken, generateCsrfToken, ttlToMs
} from "../utils/tokens.js";
import { env } from "../config/env.js";
import { ROLES, normalizeRole } from "../constants/roles.js";

function expiryFromTtl(ttl) {
  const ms = ttlToMs(ttl);
  const fallback = 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + (ms || fallback));
}

async function issueTokens(user, family, meta) {
  const session = await RefreshSession.create({
    user: user._id, tokenHash: "pending", family,
    expiresAt: expiryFromTtl(env.REFRESH_TOKEN_TTL),
    ip: meta?.ip || "", userAgent: meta?.userAgent || ""
  });
  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id, sessionId: session._id, family });
  session.tokenHash = hashToken(refreshToken);
  await session.save();
  return { accessToken, refreshToken, session };
}

export async function registerStudent({ name, email, password, studentId, phone, semester }) {
  const emailLower = email.toLowerCase().trim();

  // Block registration with privileged emails
  if (["warden@gmail.com", "admin@gmail.com", "staff@gmail.com"].includes(emailLower)) {
    throw new ApiError(409, "This email is reserved for a system account. Use a different email.");
  }

  const domain = env.ALLOWED_STUDENT_EMAIL_DOMAIN.toLowerCase().trim();
  if (domain && !emailLower.endsWith("@" + domain)) {
    throw new ApiError(422, "Student email must end with @" + domain + ". Use your institutional email.");
  }

  const existing = await User.findOne({
    $or: [{ email: emailLower }, { studentId: studentId.toUpperCase() }]
  });
  if (existing) throw new ApiError(409, "An account with this email or student ID already exists");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name, email: emailLower, passwordHash, role: ROLES.STUDENT,
    status: "pending", studentId: studentId.toUpperCase(), phone, semester
  });
  return user.toSafeJSON();
}

export async function login({ email, password, ip, userAgent }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

  // Clear, distinct error messages
  if (!user) {
    throw new ApiError(401, "No account found with this email. Students must register first.");
  }
  if (user.status === "pending") {
    throw new ApiError(403, "Your account is pending admin approval. Please wait or contact the mess office.");
  }
  if (user.status === "suspended") {
    throw new ApiError(403, "Your account has been suspended. Contact the warden office.");
  }
  if (user.status === "rejected") {
    throw new ApiError(403, "Your registration was rejected. Contact the mess office.");
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, "Incorrect password. Please try again.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const family = crypto.randomUUID();
  const tokens = await issueTokens(user, family, { ip, userAgent });
  const csrfToken = generateCsrfToken();

  const u = user.toSafeJSON(); u.role = normalizeRole(u.role); return { user: u, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, csrfToken };
}

export async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) throw new ApiError(401, "No refresh token");
  let payload;
  try { payload = verifyRefreshToken(refreshToken); }
  catch { throw new ApiError(401, "Invalid refresh token"); }
  const session = await RefreshSession.findById(payload.sessionId);
  if (!session) throw new ApiError(401, "Session not found");
  if (session.revokedAt) {
    await RefreshSession.updateMany({ family: payload.family, revokedAt: null }, { revokedAt: new Date() });
    throw new ApiError(401, "Session revoked");
  }
  if (session.expiresAt < new Date()) throw new ApiError(401, "Session expired");
  if (session.tokenHash !== hashToken(refreshToken)) {
    await RefreshSession.updateMany({ family: payload.family, revokedAt: null }, { revokedAt: new Date() });
    throw new ApiError(401, "Refresh token reuse detected");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") throw new ApiError(401, "Account not active");
  session.revokedAt = new Date();
  await session.save();
  const tokens = await issueTokens(user, payload.family, { ip, userAgent });
  const csrfToken = generateCsrfToken();
  const u = user.toSafeJSON(); u.role = normalizeRole(u.role); return { user: u, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, csrfToken };
}

export async function logout({ refreshToken }) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshSession.updateOne({ _id: payload.sessionId, revokedAt: null }, { revokedAt: new Date() });
  } catch {}
}

export async function changePassword({ user, currentPassword, newPassword }) {
  const fresh = await User.findById(user._id).select("+passwordHash");
  if (!fresh) throw new ApiError(404, "User not found");
  const ok = await fresh.comparePassword(currentPassword);
  if (!ok) throw new ApiError(401, "Current password is incorrect");
  fresh.passwordHash = await User.hashPassword(newPassword);
  fresh.passwordChangedAt = new Date();
  await fresh.save();
  await RefreshSession.updateMany({ user: fresh._id, revokedAt: null }, { revokedAt: new Date() });
  return fresh.toSafeJSON();
}

export async function me(user) {
  const fresh = await User.findById(user._id).populate("hostel", "name code gender");
  if (!fresh) throw new ApiError(404, "User not found");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [unreadNotifications, currentBill, attendanceThisMonth] = await Promise.all([
    Notification.countDocuments({ user: fresh._id, readAt: null }),
    Bill.findOne({ user: fresh._id }).sort({ year: -1, month: -1 }).lean(),
    Attendance.countDocuments({ user: fresh._id, date: { $gte: monthStart } })
  ]);

  return {
    ...fresh.toSafeJSON(),
    context: {
      unreadNotifications,
      currentBill: currentBill ? {
        _id: currentBill._id, month: currentBill.month, year: currentBill.year,
        total: currentBill.total, outstanding: currentBill.outstanding, status: currentBill.status
      } : null,
      attendanceThisMonth
    }
  };
}