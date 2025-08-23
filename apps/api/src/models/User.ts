import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, index: true },
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