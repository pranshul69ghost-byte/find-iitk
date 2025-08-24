import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, index: true, required: true },
    username: { type: String, unique: true, sparse: true },
    passwordHash: String,
    emailVerified: { type: Boolean, default: false },

    name: String,
    avatar: String,

    // Profile / contact
    phone: String,
    altEmail: String,
    telegram: String,
    whatsapp: String,
    bio: String,
    hostel: String,
    department: String,
    gradYear: Number,

    reputation: { type: Number, default: 0 },
    badges: [String]
  },
  { timestamps: true }
);

export const User = model("User", UserSchema);