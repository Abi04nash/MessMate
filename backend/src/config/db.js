import mongoose from "mongoose";
import { env, isProduction } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: !isProduction });
  const { host, name } = mongoose.connection;
  console.log("[db] connected to " + host + "/" + name);
  mongoose.connection.on("error", (e) => console.error("[db] connection error", e));
  mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[db] disconnected cleanly");
  }
}