import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { env } from "../lib/env.js";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { sendMail } from "../lib/mailer.js";
import { otpEmail } from "../lib/emailTemplates.js";

export const authRouter = Router();

const isIitkEmail = (email: string) => /@iitk\.ac\.in$/i.test(email.trim());

// Rate limits
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." }
});

const registerOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req.body?.email || req.ip),
  message: { error: "Too many OTP requests. Try again later." }
});

// LOGIN: email + password (no OTP)
authRouter.post("/login", loginLimiter, async (req, res) => {
  const rawEmail = String(req.body?.email || "");
  const email = rawEmail.trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) return res.status(400).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user });
});

// REGISTER STEP 1: request OTP to verify email (only if not registered)
authRouter.post("/register/request-otp", registerOtpLimiter, async (req, res) => {
  const rawEmail = String(req.body?.email || "");
  const email = rawEmail.trim().toLowerCase();
  if (!email || !isIitkEmail(email)) return res.status(400).json({ error: "Valid IITK email required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already registered. Please login." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.create({ email, codeHash, expiresAt, purpose: "register" });

  const { subject, html, text } = otpEmail({ code });
  await sendMail({ to: email, subject, html, text }).catch(() => {});

  const payload: any = { ok: true };
  if (process.env.NODE_ENV !== "production") payload.devCode = code;
  res.json(payload);
});

// REGISTER STEP 2: verify code + create user with password
authRouter.post("/register", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const rawEmail = String(req.body?.email || "");
  const email = rawEmail.trim().toLowerCase();
  const password = String(req.body?.password || "");
  const code = String(req.body?.code || "");

  if (!username || username.length < 3) return res.status(400).json({ error: "username min length 3" });
  if (!email || !isIitkEmail(email)) return res.status(400).json({ error: "Valid IITK email required" });
  if (!password || password.length < 8) return res.status(400).json({ error: "password min length 8" });
  if (!code) return res.status(400).json({ error: "OTP code required" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already registered. Please login." });

  // Verify OTP
  const otp = await Otp.findOne({ email, consumed: false, purpose: "register" }).sort({ createdAt: -1 });
  if (!otp) return res.status(400).json({ error: "No active code. Request a new one." });

  const expiry = otp.expiresAt instanceof Date ? otp.expiresAt : (otp.expiresAt ? new Date(otp.expiresAt) : null);
  if (!expiry || expiry.getTime() < Date.now()) return res.status(400).json({ error: "Code expired" });

  const ok = await bcrypt.compare(code, otp.codeHash || "");
  otp.attempts = (otp.attempts ?? 0) + 1;
  if (!ok) { await otp.save(); return res.status(400).json({ error: "Invalid code" }); }

  otp.consumed = true;
  await otp.save();

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    username,
    name: username,
    passwordHash,
    emailVerified: true
  });

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user });
});

