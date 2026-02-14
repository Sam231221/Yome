import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { v2 as cloudinary } from "cloudinary";
import { rankInstitutions } from "../lib/rank-institutions.js";

// EducationalInstitution and related models are not in the current Prisma schema.
// These endpoints will throw at runtime until the schema is extended (Phase 6).
type PrismaWithEI = Awaited<ReturnType<typeof getPrismaInstance>> & {
  educationalInstitution?: {
    findMany: (args: unknown) => Promise<unknown[]>;
    create: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

export async function getAllEducationalInstitutions(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance() as PrismaWithEI;
    if (!prisma.educationalInstitution) {
      res.status(501).json({
        error: "Educational institutions not configured",
        institutions: [],
      });
      return;
    }
    const institutions = await prisma.educationalInstitution.findMany({
      include: {
        albums: true,
        infrastructure: true,
        programs: true,
        faculty: true,
        extraActivities: true,
        cost: true,
        alumniSuccess: true,
      },
    }) as Array<Record<string, unknown> & { faculty?: Array<{ experience?: number }> }>;
    const institutionsByRanking = rankInstitutions(institutions);
    res.status(200).json({ institutions: institutionsByRanking });
  } catch (error) {
    next(error);
  }
}

export async function createEducationalInstitutions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance() as PrismaWithEI;
    if (!prisma.educationalInstitution) {
      res.status(501).json({
        msg: "Educational institutions not configured",
        status: 501,
      });
      return;
    }
    const userId = req.query.userId as string | undefined;
    const {
      name,
      description,
      address,
      type,
      category,
      accreditation_status,
      principal_name,
      principal_email,
      contact,
    } = req.body as Record<string, string>;

    if (!req.file?.buffer) {
      res.status(400).json({ msg: "Photo required", status: 400 });
      return;
    }

    const image = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "Eduroclass/Uploads/EducationInstitutions/" },
          (error, result) => {
            if (error) reject(new Error("Failed to upload photo"));
            else resolve(result!);
          }
        )
        .end(req.file!.buffer);
    });

    if (userId) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { role: "AGENT" },
      });
    }

    const existingByName = await prisma.educationalInstitution.findUnique({
      where: { name },
    }) as { name: string } | null;
    if (existingByName) {
      res.json({
        msg: "This Educational institution is already owned by other.",
        status: 409,
      });
      return;
    }

    const institution = await prisma.educationalInstitution.create({
      data: {
        name,
        thumbnail: image.secure_url,
        description,
        address,
        type,
        category,
        accreditation_status,
        principal_name,
        principal_email,
        principal_phone_number: contact,
        owner: userId ? { connect: { id: parseInt(userId) } } : undefined,
      },
    });

    res.json({
      msg: "Institution Created Successfully",
      status: 200,
      data: institution,
    });
  } catch (error) {
    console.error(error);
    res.json({ msg: "Internal Server Error", status: 500 });
  }
}
