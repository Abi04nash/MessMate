import { Server } from "socket.io";
import { allowedOrigins } from "../config/env.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

let io = null;
export function getIO() { return io; }

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (!match) return next(new Error("No auth"));
      const payload = verifyAccessToken(decodeURIComponent(match[1]));
      const user = await User.findById(payload.sub).lean();
      if (!user || user.status !== "active") return next(new Error("Bad user"));
      socket.userId = String(user._id);
      socket.role = user.role;
      next();
    } catch { next(new Error("Auth failed")); }
  });

  io.on("connection", (socket) => {
    socket.join("user:" + socket.userId);
    socket.join("role:" + socket.role);
    socket.on("disconnect", () => {});
  });

  console.log("[socket] Socket.IO ready");
  return io;
}