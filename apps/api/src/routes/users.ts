import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req: any, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

usersRouter.patch("/me", requireAuth, async (req: any, res) => {
  const allowed = ["name", "phone", "altEmail", "telegram", "whatsapp", "bio", "hostel", "department", "gradYear", "avatar"];
  const update: any = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
  res.json(user);
});

usersRouter.get("/:id", requireAuth, async (req, res) => {
  const user = await User.findById(req.params.id).select("name email avatar reputation hostel department gradYear phone whatsapp bio");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});