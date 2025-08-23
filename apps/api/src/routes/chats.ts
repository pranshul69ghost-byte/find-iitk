import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import { Chat } from "../models/Chat.js";
import { Listing } from "../models/Listing.js";
import { Message } from "../models/Message.js";

export const chatsRouter = Router();

// Create or get chat for a listing with owner
chatsRouter.post("/", requireAuth, requireProfileComplete, async (req: any, res) => {
  const { listingId } = req.body as { listingId: string };
  if (!listingId) return res.status(400).json({ error: "listingId required" });
  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  const userId = req.user.id.toString();
  const ownerId = listing.ownerId.toString();
  const participants = [userId, ownerId].sort();

  let chat = await Chat.findOne({ listingId, participants: { $all: participants, $size: 2 } });
  if (!chat) {
    chat = await Chat.create({ listingId, participants, lastMessageAt: new Date() });
  }
  res.json(chat);
});

// List my chats
chatsRouter.get("/", requireAuth, async (req: any, res) => {
  const uid = req.user.id;
  const rows = await Chat.find({ participants: uid })
    .sort({ lastMessageAt: -1 })
    .populate("listingId", "title images type")
    .populate("participants", "name email avatar hostel department gradYear phone whatsapp");
  res.json(rows);
});

// Get messages for a chat
chatsRouter.get("/:id/messages", requireAuth, async (req: any, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.participants.map(String).includes(req.user.id.toString()))
    return res.status(403).json({ error: "Not allowed" });
  const msgs = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
  res.json(msgs);
});

// Send a message
chatsRouter.post("/:id/messages", requireAuth, requireProfileComplete, async (req: any, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.participants.map(String).includes(req.user.id.toString()))
    return res.status(403).json({ error: "Not allowed" });
  const text = (req.body?.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "text required" });

  const msg = await Message.create({ chatId: chat._id, senderId: req.user.id, text });
  chat.lastMessage = text;
  chat.lastMessageAt = new Date();
  await chat.save();

  // emit to both participants
  const io = req.app.get("io");
  const others = chat.participants.map(String).filter((id) => id !== req.user.id.toString());
  others.forEach((id) => io.to(`user:${id}`).emit("message:new", { chatId: chat._id.toString(), message: msg }));

  res.status(201).json(msg);
});