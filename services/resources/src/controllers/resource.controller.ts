import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import getPrismaInstance from "@repo/database";

type PrismaClient = ReturnType<typeof getPrismaInstance>;
type TransactionClient = Pick<
  PrismaClient,
  "resource" | "resourceSave" | "resourceHelpfulVote"
>;

type ResourceQuery = {
  search?: string;
  subject?: string;
  type?: string;
  level?: string;
  limit?: number;
  cursor?: string;
  sort?: "helpful" | "recent" | "saved";
};

type CreateResourceBody = {
  title: string;
  slug?: string;
  subject: string;
  topic: string;
  level: string;
  type: string;
  tone: string;
  description: string;
  fileUrl?: string;
  externalUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
};

type ResourceRecord = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  topic: string;
  level: string;
  type: string;
  tone: string;
  description: string;
  fileUrl: string | null;
  externalUrl: string | null;
  saveCount: number;
  helpfulCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    firstname: string;
    lastname: string;
    name: string | null;
    username: string;
    profilePicture: string;
  };
  saves?: Array<{ userId: number }>;
  helpfulVotes?: Array<{ userId: number }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAuthenticatedUserId(req: Request): number | null {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getResourceWhere(id: string) {
  return uuidPattern.test(id) ? { id } : { slug: id };
}

function buildAuthorName(resource: ResourceRecord): string {
  return (
    [resource.author.firstname, resource.author.lastname].filter(Boolean).join(" ").trim() ||
    resource.author.name ||
    resource.author.username ||
    "Yome contributor"
  );
}

function mapResource(resource: ResourceRecord, viewerId: number | null) {
  return {
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    subject: resource.subject,
    topic: resource.topic,
    level: resource.level,
    type: resource.type,
    tone: resource.tone,
    description: resource.description,
    fileUrl: resource.fileUrl,
    externalUrl: resource.externalUrl,
    saveCount: resource.saveCount,
    helpfulCount: resource.helpfulCount,
    ratingAverage: resource.ratingAverage,
    ratingCount: resource.ratingCount,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    isSaved: viewerId
      ? (resource.saves ?? []).some((save) => save.userId === viewerId)
      : false,
    isHelpful: viewerId
      ? (resource.helpfulVotes ?? []).some((vote) => vote.userId === viewerId)
      : false,
    author: {
      id: resource.author.id,
      name: buildAuthorName(resource),
      username: resource.author.username,
      profilePicture: resource.author.profilePicture,
    },
  };
}

async function findResourceByIdOrSlug(id: string, viewerId: number | null) {
  const prisma = getPrismaInstance();
  return prisma.resource.findUnique({
    where: getResourceWhere(id),
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          name: true,
          username: true,
          profilePicture: true,
        },
      },
      saves: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
      helpfulVotes: viewerId
        ? { where: { userId: viewerId }, select: { userId: true } }
        : false,
    },
  }) as Promise<ResourceRecord | null>;
}

export async function getResources(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const viewerId = getAuthenticatedUserId(req);
    const {
      search,
      subject,
      type,
      level,
      limit = 24,
      cursor,
      sort = "helpful",
    } = req.query as ResourceQuery;

    const where = {
      ...(subject && subject !== "All" ? { subject } : {}),
      ...(type && type !== "All" ? { type } : {}),
      ...(level && level !== "All" ? { level } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { topic: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { author: { username: { contains: search, mode: "insensitive" } } },
              { author: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const orderBy =
      sort === "recent"
        ? [{ createdAt: "desc" as const }]
        : sort === "saved"
          ? [{ saveCount: "desc" as const }, { createdAt: "desc" as const }]
          : [{ helpfulCount: "desc" as const }, { ratingAverage: "desc" as const }, { createdAt: "desc" as const }];

    const resources = (await prisma.resource.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        saves: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
        helpfulVotes: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
    })) as ResourceRecord[];

    const page = resources.slice(0, limit);
    const nextCursor = resources.length > limit ? page[page.length - 1]?.id ?? null : null;

    res.status(200).json({
      ok: true,
      resources: page.map((resource) => mapResource(resource, viewerId)),
      pageInfo: { nextCursor, hasMore: resources.length > limit },
    });
  } catch (error) {
    next(error);
  }
}

export async function getResourceById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const viewerId = getAuthenticatedUserId(req);
    const resource = await findResourceByIdOrSlug(String(req.params.id ?? ""), viewerId);

    if (!resource) {
      res.status(404).json({ ok: false, error: "Resource not found" });
      return;
    }

    const prisma = getPrismaInstance();
    const relatedResources = (await prisma.resource.findMany({
      where: {
        id: { not: resource.id },
        OR: [{ subject: resource.subject }, { topic: resource.topic }],
      },
      take: 4,
      orderBy: [{ helpfulCount: "desc" }, { saveCount: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        saves: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
        helpfulVotes: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
    })) as ResourceRecord[];

    res.status(200).json({
      ok: true,
      resource: mapResource(resource, viewerId),
      relatedResources: relatedResources.map((item) => mapResource(item, viewerId)),
    });
  } catch (error) {
    next(error);
  }
}

export async function createResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorId = getAuthenticatedUserId(req);
    if (authorId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const body = req.body as CreateResourceBody;
    const prisma = getPrismaInstance();
    const baseSlug = slugify(body.slug || body.title);
    let slug = baseSlug || crypto.randomUUID();
    let suffix = 2;
    while (await prisma.resource.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const resource = (await prisma.resource.create({
      data: {
        slug,
        title: body.title,
        subject: body.subject,
        topic: body.topic,
        level: body.level,
        type: body.type,
        tone: body.tone,
        description: body.description,
        fileUrl: body.fileUrl,
        externalUrl: body.externalUrl,
        ratingAverage: body.ratingAverage,
        ratingCount: body.ratingCount ?? 0,
        author: { connect: { id: authorId } },
      },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            profilePicture: true,
          },
        },
        saves: { where: { userId: authorId }, select: { userId: true } },
        helpfulVotes: { where: { userId: authorId }, select: { userId: true } },
      },
    })) as ResourceRecord;

    res.status(201).json({ ok: true, resource: mapResource(resource, authorId) });
  } catch (error) {
    next(error);
  }
}

export async function saveResource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const prisma = getPrismaInstance();
    const resource = await findResourceByIdOrSlug(String(req.params.id ?? ""), userId);
    if (!resource) {
      res.status(404).json({ ok: false, error: "Resource not found" });
      return;
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      const existing = await tx.resourceSave.findUnique({
        where: { resourceId_userId: { resourceId: resource.id, userId } },
      });
      if (!existing) {
        await tx.resourceSave.create({ data: { resourceId: resource.id, userId } });
        await tx.resource.update({
          where: { id: resource.id },
          data: { saveCount: { increment: 1 } },
        });
      }
    });

    const updated = await findResourceByIdOrSlug(resource.id, userId);
    res.status(200).json({
      ok: true,
      resource: updated ? mapResource(updated, userId) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteResourceSave(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const prisma = getPrismaInstance();
    const resource = await findResourceByIdOrSlug(String(req.params.id ?? ""), userId);
    if (!resource) {
      res.status(404).json({ ok: false, error: "Resource not found" });
      return;
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      const existing = await tx.resourceSave.findUnique({
        where: { resourceId_userId: { resourceId: resource.id, userId } },
      });
      if (existing) {
        await tx.resourceSave.delete({ where: { id: existing.id } });
        await tx.resource.update({
          where: { id: resource.id },
          data: { saveCount: { decrement: 1 } },
        });
      }
    });

    const updated = await findResourceByIdOrSlug(resource.id, userId);
    res.status(200).json({
      ok: true,
      resource: updated ? mapResource(updated, userId) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function markResourceHelpful(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const prisma = getPrismaInstance();
    const resource = await findResourceByIdOrSlug(String(req.params.id ?? ""), userId);
    if (!resource) {
      res.status(404).json({ ok: false, error: "Resource not found" });
      return;
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      const existing = await tx.resourceHelpfulVote.findUnique({
        where: { resourceId_userId: { resourceId: resource.id, userId } },
      });
      if (!existing) {
        await tx.resourceHelpfulVote.create({
          data: { resourceId: resource.id, userId },
        });
        await tx.resource.update({
          where: { id: resource.id },
          data: { helpfulCount: { increment: 1 } },
        });
      }
    });

    const updated = await findResourceByIdOrSlug(resource.id, userId);
    res.status(200).json({
      ok: true,
      resource: updated ? mapResource(updated, userId) : null,
    });
  } catch (error) {
    next(error);
  }
}
