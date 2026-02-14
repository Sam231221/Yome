import type { Request, Response, NextFunction } from "express";
import { cloudinary } from "../lib/cloudinary.js";

/**
 * Upload audio to Cloudinary and return the URL. Message persistence is done by the chat service.
 */
export async function uploadAudio(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ ok: false, error: "Audio is required." });
      return;
    }

    const audio = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "Eduroclass/Uploads/Messages/AudioMessages/",
            secure: true,
            resource_type: "video",
          },
          (error, result) => {
            if (error) reject(new Error("Failed to upload audio"));
            else resolve(result!);
          }
        )
        .end(req.file!.buffer);
    });

    res.status(200).json({ ok: true, url: audio.secure_url, type: "audio" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/**
 * Upload image to Cloudinary and return the URL. Message persistence is done by the chat service.
 */
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ ok: false, error: "Image is required." });
      return;
    }

    const image = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "Eduroclass/Uploads/Messages/ImageMessages/" },
          (error, result) => {
            if (error) reject(new Error("Failed to upload image"));
            else resolve(result!);
          }
        )
        .end(req.file!.buffer);
    });

    res.status(200).json({ ok: true, url: image.secure_url, type: "image" });
  } catch (err) {
    next(err);
  }
}
