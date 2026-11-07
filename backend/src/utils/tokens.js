import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

export function signAccessToken({ userId, role }) {
  return jwt.sign(
    { sub: String(userId), role, type: "access" },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL }
  );
}

export function signRefreshToken({ userId, sessionId, family }) {
  return jwt.sign(
    {
      sub: String(userId),
      sessionId: String(sessionId),
      family,
      type: "refresh",
      jti: crypto.randomUUID()
    },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL }
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function ttlToMs(ttl) {
  const m = /^(\d+)([smhd])$/.exec(String(ttl));
  if (!m) return 0;
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return Number(m[1]) * unit;
}