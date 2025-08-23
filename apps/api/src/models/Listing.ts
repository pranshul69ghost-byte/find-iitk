import { Schema, model, Types } from "mongoose";

const ListingSchema = new Schema(
  {
    type: { type: String, enum: ["sale", "lost", "found"], required: true, index: true },
    title: { type: String, required: true },
    description: String,
    category: { type: String, index: true },
    price: Number,
    condition: { type: String, enum: ["new", "used"] },
    negotiable: Boolean,
    images: [String],
    tags: [String],

    // New: separate locations
    pickup: { label: String },       // for sale
    lostFound: { label: String },    // for lost/found

    ownerId: { type: Types.ObjectId, ref: "User", index: true },
    location: {
      label: String,
      geo: { type: { type: String, enum: ["Point"] }, coordinates: [Number] }
    },
    status: { type: String, enum: ["active", "pending", "claimed", "sold", "resolved"], default: "active", index: true }
  },
  { timestamps: true }
);

ListingSchema.index({ "location.geo": "2dsphere" });
// One combined text index for search
ListingSchema.index({ title: "text", description: "text", tags: "text" });

export const Listing = model("Listing", ListingSchema);