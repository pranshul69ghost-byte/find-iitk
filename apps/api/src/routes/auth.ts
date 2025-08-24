import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { env } from "../lib/env.js";
import { sendMail } from "../lib/mailer.js";
import { otpEmail } from "../lib/emailTemplates.js";

export const authRouter = Router();

const isIitkEmail = (email: string) => /@iitk\.ac\.in$/i.test(email);

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

// Dev-only login (replace with LDAP later)
authRouter.post("/dev-login", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const user = await User.findOneAndUpdate(
    { email },
    { email, name: name || email.split("@")[0] },
    { upsert: true, new: true }
  );
  const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user });
});

authRouter.post("/request-otp", otpLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !isIitkEmail(email)) return res.status(400).json({ error: "Valid IITK email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.create({ email: email.toLowerCase(), codeHash, expiresAt });

  const { subject, html, text } = otpEmail({ code });
  await sendMail({ to: email, subject, html, text });

  res.json({ ok: true });
});

authRouter.post("/verify-otp", async (req, res) => {
  try {
    const rawEmail = (req.body?.email as string) || "";
    const email = rawEmail.trim().toLowerCase();
    const code = String(req.body?.code || "");
    const name = String(req.body?.name || "");

    if (!email || !code) return res.status(400).json({ error: "email and code required" });
    if (!isIitkEmail(email)) return res.status(400).json({ error: "IITK email required" });

    const otp = await Otp.findOne({ email, consumed: false }).sort({ createdAt: -1 });
    if (!otp) return res.status(400).json({ error: "No active code. Request a new one." });

    const expiry = otp.expiresAt instanceof Date ? otp.expiresAt : (otp.expiresAt ? new Date(otp.expiresAt) : null);
    if (!expiry || expiry.getTime() < Date.now()) return res.status(400).json({ error: "Code expired" });

    const hash = typeof otp.codeHash === "string" ? otp.codeHash : "";
    if (!hash) return res.status(400).json({ error: "Invalid code" });

    const ok = await bcrypt.compare(code, hash);

    otp.attempts = (otp.attempts ?? 0) + 1;
    if (!ok) {
      await otp.save();
      return res.status(400).json({ error: "Invalid code" });
    }

    otp.consumed = true;
    await otp.save();

    const user = await User.findOneAndUpdate(
      { email },
      { email, ...(name ? { name } : {}) },
      { upsert: true, new: true }
    );

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err: any) {
    console.error("verify-otp error:", err);
    res.status(500).json({ error: err?.message || "Verification failed" });
  }
});