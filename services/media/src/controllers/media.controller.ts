import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { cloudinary } from "../lib/cloudinary.js";

export async function addAudioMessage(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).send("Audio is required.");
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

    const prisma = getPrismaInstance();
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");
    const chatType = String(req.query.chatType ?? "");

    if (chatType === "user") {
      const message = await prisma.messages.create({
        data: {
          messageStatus: "sent",
          message: audio.secure_url,
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          type: "audio",
        },
      });
      res.status(201).json({ message });
      return;
    }
    if (chatType === "group") {
      const message = await prisma.messages.create({
        data: {
          group: { connect: { id: to } },
          msgType: "group",
          messageStatus: "sent",
          message: audio.secure_url,
          sender: { connect: { id: parseInt(from) } },
          type: "audio",
        },
      });
      res.status(201).json({ message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
}

export async function addImageMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).send("Image is required.");
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

    const prisma = getPrismaInstance();
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");
    const chatType = String(req.query.chatType ?? "");

    if (chatType === "user") {
      const message = await prisma.messages.create({
        data: {
          messageStatus: "sent",
          message: image.secure_url,
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          type: "image",
        },
      });
      res.status(201).json({ message });
      return;
    }
    if (chatType === "group") {
      const message = await prisma.messages.create({
        data: {
          group: { connect: { id: to } },
          msgType: "group",
          messageStatus: "sent",
          message: image.secure_url,
          sender: { connect: { id: parseInt(from) } },
          type: "image",
        },
      });
      res.status(201).json({ message });
    }
  } catch (err) {
    next(err);
  }
}
