import { Schema, model, Types } from "mongoose";

const ChatSchema = new Schema(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", index: true },
    participants: [{ type: Types.ObjectId, ref: "User", index: true }],
    lastMessage: String,
    lastMessageAt: { type: Date, index: true }
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });

export const Chat = model("Chat", ChatSchema);