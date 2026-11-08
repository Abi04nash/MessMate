import express from "express";
import pinoHttp from "pino-http";
import cors from "cors";
import { env, isTest } from "./config/env.js";
import { applySecurity, apiLimiter, originCheck, corsOptions } from "./middleware/security.js";
import apiRouter from "./routes/index.js";
import "./models/index.js";

const app = express();
app.disable("x-powered-by");

app.use(pinoHttp({
  enabled: !isTest,
  redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"]
}));

applySecurity(app);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MESSMATE backend is healthy",
    data: { environment: env.NODE_ENV, uptimeSeconds: Math.round(process.uptime()) }
  });
});

// CORS applied ONLY to API routes. Static frontend files (served by
// server.js) never pass through CORS, so no more 403 for CSS/JS.
app.use("/api/v1", cors(corsOptions), apiLimiter, originCheck, apiRouter);

// NOTE: notFound and errorHandler are registered in server.js AFTER
// the static + SPA fallback middleware so they don't block the frontend.

export default app;