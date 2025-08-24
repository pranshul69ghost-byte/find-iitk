import { Schema, model } from "mongoose";

const OtpSchema = new Schema(
  {
    email: { type: String, index: true },
    codeHash: String,
    expiresAt: Date,
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    purpose: { type: String, enum: ["register"], default: "register", index: true }
  },
  { timestamps: true }
);

// TTL — auto-delete after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model("Otp", OtpSchema);