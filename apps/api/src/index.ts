import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import path from "path";

import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { listingsRouter } from "./routes/listings.js";
import { usersRouter } from "./routes/users.js";
import { filesRouter } from "./routes/files.js";
import { chatsRouter } from "./routes/chats.js";

const app = express();
app.use(cors({ origin: env.API_ORIGIN, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/listings", listingsRouter);
app.use("/files", filesRouter);
app.use("/chats", chatsRouter);

// Serve local uploads (when not using Cloudinary)
app.use("/uploads", express.static(path.resolve("uploads")));

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: env.API_ORIGIN } });

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
    server.listen(env.API_PORT, () => console.log(`API running http://localhost:${env.API_PORT}`));
  })
  .catch((e) => {
    console.error("Mongo error", e);
    process.exit(1);
  });