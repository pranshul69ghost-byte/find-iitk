import { v2 as cloudinarySDK } from "cloudinary";
import { env } from "./env.js";

export const hasCloudinary = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (hasCloudinary) {
  cloudinarySDK.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!
  });
}

export const cloudinary = cloudinarySDK;