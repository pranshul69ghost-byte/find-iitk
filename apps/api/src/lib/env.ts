import { config } from "dotenv";
import { z } from "zod";
import { join } from "path";

// Load .env from project root
config({ path: join(process.cwd(), "../../.env") });

const schema = z.object({
  API_PORT: z.coerce.number().default(4000),
  API_ORIGIN: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/findiitk"),
  JWT_SECRET: z.string().default("dev-secret-key-change-in-production"),
  WEB_URL: z.string().default("http://localhost:5173"),
  MAIL_FROM: z.string().optional(),

  // Optional email + uploads
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(), // "true" | "false"
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  NOTIFY_EMAILS: z.string().optional(), // comma-separated list

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

export const env = schema.parse(process.env);