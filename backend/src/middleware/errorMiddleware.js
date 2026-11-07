import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { isProduction } from "../config/env.js";

export function notFound(req, res, next) {
  next(new ApiError(404, "Route not found: " + req.method + " " + req.originalUrl));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let error = err;

  if (err instanceof ZodError) {
    error = new ApiError(422, "Validation failed",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = new ApiError(400, "Database validation failed",
      Object.values(err.errors).map((i) => i.message));
  } else if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(400, "Invalid value for " + err.path);
  } else if (err && err.code === 11000) {
    error = new ApiError(409, "Duplicate record", err.keyValue);
  } else if (err && err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid authentication token");
  } else if (err && err.name === "TokenExpiredError") {
    error = new ApiError(401, "Authentication token expired");
  } else if (err instanceof multer.MulterError) {
    error = new ApiError(400, "Upload error: " + err.message);
  }

  if (!(error instanceof ApiError)) {
    const sc = error.statusCode || 500;
    const msg = sc >= 500 && isProduction ? "Internal server error" : error.message || "Internal server error";
    error = new ApiError(sc, msg);
  }

  const statusCode = error.statusCode || 500;
  const payload = { success: false, message: error.message };
  if (error.code) payload.code = error.code;
  if (error.details) payload.errors = error.details;
  if (!isProduction && err && err.stack) payload.stack = err.stack;
  if (statusCode >= 500 && req.log) req.log.error({ err }, "Unhandled request error");
  return res.status(statusCode).json(payload);
}