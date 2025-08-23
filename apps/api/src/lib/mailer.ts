import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE === "true",
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    });
  } else {
    // Dev: auto-create Ethereal test account
    const testAcc = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAcc.smtp.host,
      port: testAcc.smtp.port,
      secure: testAcc.smtp.secure,
      auth: { user: testAcc.user, pass: testAcc.pass }
    });
    console.log("Using Ethereal test SMTP. Emails will have Preview URLs in the API console.");
  }
  return transporter;
}

export async function sendMail(opts: { to: string | string[]; subject: string; html: string; text?: string; from?: string }) {
  const t = await getTransporter();
  const info = await t!.sendMail({
    from: opts.from || env.MAIL_FROM || env.SMTP_USER || `Find@IITK <no-reply@findiitk.local>`,
    to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html
  });
  if (!env.SMTP_HOST) {
    console.log("Email preview URL:", nodemailer.getTestMessageUrl(info));
  }
  return info;
}