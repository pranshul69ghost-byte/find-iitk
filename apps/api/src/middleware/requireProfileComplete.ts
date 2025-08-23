import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";

export async function requireProfileComplete(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user?.id).select("phone");
    if (!user?.phone) return res.status(403).json({ error: "Profile incomplete: phone required" });
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message || "profile check failed" });
  }
}