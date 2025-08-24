import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Types.ObjectId, ref: "Chat", index: true, required: true },
    senderId: { type: Types.ObjectId, ref: "User", index: true, required: true },
    clientId: { type: String, required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });
// Idempotency: same sender in same chat with same clientId can only exist once
MessageSchema.index({ chatId: 1, senderId: 1, clientId: 1 }, { unique: true });

export const Message = model("Message", MessageSchema);