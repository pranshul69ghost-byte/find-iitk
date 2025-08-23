import { Router } from "express";
import { Listing } from "../models/Listing.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import { Comment } from "../models/Comment.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../lib/env.js";
import mongoose from "mongoose";

function rx(q: string) {
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(safe, "i");
}
export const listingsRouter = Router();

// GET list (auth required) — hides non-active by default
listingsRouter.get("/", requireAuth, async (req, res) => {
  const { type, category, q, minPrice, maxPrice, status } = req.query as Record<string, string>;
  const filter: any = {};
  filter.status = status || "active"; // default to active
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (minPrice || maxPrice) filter.price = { ...(minPrice ? { $gte: +minPrice } : {}), ...(maxPrice ? { $lte: +maxPrice } : {}) };

  let query: mongoose.Query<any[], any>;
  if (q && q.trim()) {
    const r = rx(q.trim());
    query = Listing.find({ ...filter, $or: [{ title: r }, { description: r }, { tags: r }] });
  } else {
    query = Listing.find(filter);
  }
  const docs = await query.sort({ updatedAt: -1 }).limit(100);
  res.json(docs);
});

// POST create (auth + phone required)
listingsRouter.post("/", requireAuth, requireProfileComplete, async (req: any, res) => {
  const body = { ...req.body, ownerId: req.user.id };
  const doc = await Listing.create(body);

  const recipients = (env.NOTIFY_EMAILS || "").split(",").map(s=>s.trim()).filter(Boolean);
  if (recipients.length) {
    try {
      const populated = await Listing.findById(doc._id).populate("ownerId", "name email");
      const { postNotificationEmail } = await import("../lib/emailTemplates.js");
      const { subject, html, text } = postNotificationEmail({
        listing: populated,
        owner: (populated as any)?.ownerId,
        webUrl: env.WEB_URL
      });
      sendMail({ to: recipients, subject, html, text }).catch((e) => console.error("notify email error:", e));
    } catch (e) { console.error("notify email error:", e); }
  }
  res.status(201).json(doc);
});

// Details
listingsRouter.get("/:id", requireAuth, async (req, res) => {
  const doc = await Listing.findById(req.params.id)
    .populate("ownerId", "name email avatar reputation hostel department gradYear phone whatsapp bio");
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// Comments (auth req)
listingsRouter.get("/:id/comments", requireAuth, async (req, res) => {
  const rows = await Comment.find({ listingId: req.params.id })
    .sort({ createdAt: 1 })
    .populate("userId", "name email avatar reputation hostel department gradYear phone");
  res.json(rows);
});
listingsRouter.post("/:id/comments", requireAuth, async (req: any, res) => {
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "text required" });
  const row = await Comment.create({ listingId: req.params.id, userId: req.user.id, text });
  const populated = await row.populate("userId", "name email avatar reputation hostel department gradYear phone");
  res.status(201).json(populated);
});

// PATCH status (owner only) — mark sold/claimed/resolved; will be hidden by default
listingsRouter.patch("/:id/status", requireAuth, async (req: any, res) => {
  const { status } = req.body as { status: "sold" | "claimed" | "resolved" };
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (doc.ownerId?.toString() !== req.user.id) return res.status(403).json({ error: "Only owner can update status" });

  // Guard allowed transitions
  const allowed = doc.type === "sale" ? ["sold"] : ["claimed", "resolved"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status for this listing type" });

  doc.status = status;
  await doc.save();
  res.json({ ok: true, listing: doc });
});

// DELETE listing (owner only)
listingsRouter.delete("/:id", requireAuth, async (req: any, res) => {
  const doc = await Listing.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (doc.ownerId?.toString() !== req.user.id) return res.status(403).json({ error: "Only owner can delete" });
  await doc.deleteOne();
  res.json({ ok: true });
});