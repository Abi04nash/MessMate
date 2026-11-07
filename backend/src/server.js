import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app from "./app.js";
import { initSocket } from "./sockets/index.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Stable ES-module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server.js is at backend/src/server.js â†’ project root is two levels up
const projectRoot = path.resolve(__dirname, "../..");
const frontendDist = path.join(projectRoot, "frontend", "dist");

// ---------- Serve frontend ----------
app.use(express.static(frontendDist));

// SPA fallback â€” every non-API GET serves index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

// ---------- Error handlers (must be LAST) ----------
app.use(notFound);
app.use(errorHandler);

// ---------- HTTP server ----------
const server = http.createServer(app);
let shuttingDown = false;

async function start() {
  await connectDB();

  // Startup migration: backfill requestType on leave records
  try {
    const { migrateRequestTypes } = await import("./services/leaveService.js");
    const result = await migrateRequestTypes();
    if (result.fixed > 0) {
      console.log(`[migration] Backfilled requestType on ${result.fixed} leave records`);
    } else {
      console.log("[migration] No stale leave records found");
    }
  } catch (err) {
    console.error("[migration] Failed:", err.message);
  }

  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`[server] MESSMATE API listening on http://localhost:${env.PORT}`);
    console.log(`[server] Serving frontend from ${frontendDist}`);
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[server] received " + signal + ". Shutting down...");
  const forceExit = setTimeout(() => {
    console.error("[server] forced shutdown");
    process.exit(1);
  }, 10000);
  forceExit.unref();
  server.close(async () => {
    try {
      await disconnectDB();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (e) {
      console.error("[server] error during shutdown", e);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (r) => { console.error("[server] unhandled rejection", r); shutdown("unhandledRejection"); });
process.on("uncaughtException", (e) => { console.error("[server] uncaught exception", e); shutdown("uncaughtException"); });

start().catch((e) => {
  console.error("[server] failed to start", e);
  process.exit(1);
});