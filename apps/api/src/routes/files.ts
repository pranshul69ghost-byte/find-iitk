import { Router } from "express";
import multer, { FileFilterCallback } from "multer";
import type { Express } from "express";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import { cloudinary, hasCloudinary } from "../lib/cloudinary.js";

export const filesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
    cb(new Error("Invalid file type"));
  }
});

filesRouter.post("/upload", requireAuth, upload.array("files", 5), async (req, res) => {
  try {
    const files = (req as any).files as Express.Multer.File[] || [];
    const urls: string[] = [];

    if (hasCloudinary) {
      for (const f of files) {
        const result = await cloudinary.uploader.upload(`data:${f.mimetype};base64,${f.buffer.toString("base64")}`, {
          folder: "find-iitk"
        });
        urls.push(result.secure_url);
      }
    } else {
      const dir = path.resolve("uploads");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      for (const f of files) {
        const ext = f.mimetype.split("/")[1] || "jpg";
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = path.join(dir, name);
        fs.writeFileSync(filePath, f.buffer);
        urls.push(`/uploads/${name}`);
      }
    }

    res.json({ urls });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || "upload failed" });
  }
});