import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

export function signQrPass({ userId, sessionId, registrationId, ttlMinutes = 10 }) {
  return jwt.sign(
    {
      type: "qr_pass",
      sub: String(userId),
      sessionId: String(sessionId),
      registrationId: String(registrationId),
      nonce: crypto.randomUUID()
    },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: ttlMinutes + "m" }
  );
}

export function verifyQrPass(token) {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  if (payload.type !== "qr_pass") {
    throw new Error("Invalid QR pass type");
  }
  return payload;
}