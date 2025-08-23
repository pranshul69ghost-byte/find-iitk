import { Schema, model } from "mongoose";

const OtpSchema = new Schema(
  {
    email: { type: String, index: true },
    codeHash: String,
    expiresAt: { type: Date, index: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// TTL — auto-delete after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model("Otp", OtpSchema);