import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import path from "path";

import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { listingsRouter } from "./routes/listings.js";
import { usersRouter } from "./routes/users.js";
import { filesRouter } from "./routes/files.js";
import { chatsRouter } from "./routes/chats.js";

const app = express();
const allowed = (process.env.API_ORIGIN || "").split(",").map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked: " + origin));
  },
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/users", usersRouter);

// Rate limits for duplicate prevention
const listingLimit = rateLimit({ windowMs: 2000, max: 1, standardHeaders: true, legacyHeaders: false, message: { error: "Too many posts, slow down." } });
const messageLimit = rateLimit({ windowMs: 1000, max: 3, standardHeaders: true, legacyHeaders: false, message: { error: "Too many messages, slow down." } });

app.use("/listings", listingLimit, listingsRouter);
app.use("/files", filesRouter);
app.use("/chats/:id/messages", messageLimit);
app.use("/chats", chatsRouter);

// Serve local uploads (when not using Cloudinary)
app.use("/uploads", express.static(path.resolve("uploads")));

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: allowed } });

// simple token auth for sockets
io.on("connection", (socket) => {
  socket.on("auth", (token: string) => {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.userId = payload.id;
      socket.join(`user:${payload.id}`);
    } catch {
      socket.disconnect();
    }
  });
});

app.set("io", io);

mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    const PORT = Number(process.env.PORT || env.API_PORT || 4000);
    server.listen(PORT, "0.0.0.0", () => console.log(`API running on :${PORT}`));
  })
  .catch((e) => {
    console.error("Mongo error", e);
    process.exit(1);
  });