import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    chatId: { type: Types.ObjectId, ref: "Chat", index: true, required: true },
    senderId: { type: Types.ObjectId, ref: "User", index: true, required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = model("Message", MessageSchema);