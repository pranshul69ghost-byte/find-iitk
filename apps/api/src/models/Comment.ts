import { Schema, model, Types } from "mongoose";

const CommentSchema = new Schema(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", index: true, required: true },
    userId: { type: Types.ObjectId, ref: "User", index: true, required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

export const Comment = model("Comment", CommentSchema);