import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import getPrismaInstance from "@repo/database";
import { getAuthenticatedUserId, isUuid, slugify } from "@repo/contracts";
import { cacheAside, hashQuery } from "@repo/cache";
import { withOutbox } from "@repo/events";

/** B12: cache-aside TTL for the resource list, per data-architecture-plan.md's Redis key
 * table (`yome:cache:resources:<queryHash>`, 300s) — a fixed constant like group-discover's,
 * not an env var (only CACHE_TTL_DASHBOARD_SECONDS is in the plan's env var table). */
const RESOURCE_LIST_CACHE_TTL_SECONDS = 300;

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
  // B12: Date | string, not just Date -- a resource coming back from the cache-aside list
  // (services/core/src/modules/learning/resources/resources.controller.ts's getResources)
  // has been through a JSON round trip, which turns Date into a plain ISO string.
  createdAt: Date | string;
  updatedAt: Date | string;
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

function getResourceWhere(id: string) {
  return isUuid(id) ? { id } : { slug: id };
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
    createdAt: new Date(resource.createdAt).toISOString(),
    updatedAt: new Date(resource.updatedAt).toISOString(),
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

    // B12: cached without viewerId in the key or the payload — the query below never
    // includes viewer-scoped saves/helpfulVotes, so the cached list is safe to share across
    // every viewer. Per-viewer isSaved/isHelpful are resolved fresh below, after the cache
    // read, exactly the mixing-shared-and-per-viewer-fields risk
    // api-and-dataflow-plan.md calls out for this endpoint by name.
    const cacheKey = `yome:cache:resources:${hashQuery({ where, orderBy, limit, cursor })}`;
    const resources = await cacheAside(
      cacheKey,
      RESOURCE_LIST_CACHE_TTL_SECONDS,
      async () =>
        (await prisma.resource.findMany({
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
          },
        })) as ResourceRecord[]
    );

    const page = resources.slice(0, limit);
    const nextCursor = resources.length > limit ? page[page.length - 1]?.id ?? null : null;

    let savedIds = new Set<string>();
    let helpfulIds = new Set<string>();
    if (viewerId) {
      const pageIds = page.map((resource) => resource.id);
      const [saves, helpfulVotes] = await Promise.all([
        prisma.resourceSave.findMany({
          where: { userId: viewerId, resourceId: { in: pageIds } },
          select: { resourceId: true },
        }),
        prisma.resourceHelpfulVote.findMany({
          where: { userId: viewerId, resourceId: { in: pageIds } },
          select: { resourceId: true },
        }),
      ]);
      savedIds = new Set(saves.map((save: { resourceId: string }) => save.resourceId));
      helpfulIds = new Set(
        helpfulVotes.map((vote: { resourceId: string }) => vote.resourceId)
      );
    }

    res.status(200).json({
      ok: true,
      resources: page.map((resource) =>
        mapResource(
          {
            ...resource,
            saves: savedIds.has(resource.id) ? [{ userId: viewerId! }] : [],
            helpfulVotes: helpfulIds.has(resource.id) ? [{ userId: viewerId! }] : [],
          },
          viewerId
        )
      ),
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

    const resource = await withOutbox(
      prisma,
      async (tx) =>
        (await tx.resource.create({
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
        })) as ResourceRecord,
      (createdResource) => ({
        type: "learning.resource.created",
        subject: `resource:${createdResource.id}`,
        producer: "core",
        actorUserId: authorId,
        payload: {
          resourceId: createdResource.id,
          slug: createdResource.slug,
          authorId,
          subject: createdResource.subject,
          topic: createdResource.topic,
          level: createdResource.level,
          type: createdResource.type,
        },
      })
    );

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

    await withOutbox(
      prisma,
      async (tx) => {
        const existing = await tx.resourceSave.findUnique({
          where: { resourceId_userId: { resourceId: resource.id, userId } },
        });
        if (existing) return { created: false };
        await tx.resourceSave.create({ data: { resourceId: resource.id, userId } });
        await tx.resource.update({
          where: { id: resource.id },
          data: { saveCount: { increment: 1 } },
        });
        return { created: true };
      },
      ({ created }) =>
        created
          ? {
              type: "learning.resource.saved",
              subject: `resource:${resource.id}`,
              producer: "core",
              actorUserId: userId,
              payload: { resourceId: resource.id, userId },
            }
          : null // already saved -- a no-op, nothing to publish
    );

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

    await withOutbox(
      prisma,
      async (tx) => {
        const existing = await tx.resourceSave.findUnique({
          where: { resourceId_userId: { resourceId: resource.id, userId } },
        });
        if (!existing) return { deleted: false };
        await tx.resourceSave.delete({ where: { id: existing.id } });
        await tx.resource.update({
          where: { id: resource.id },
          data: { saveCount: { decrement: 1 } },
        });
        return { deleted: true };
      },
      ({ deleted }) =>
        deleted
          ? {
              type: "learning.resource.unsaved",
              subject: `resource:${resource.id}`,
              producer: "core",
              actorUserId: userId,
              payload: { resourceId: resource.id, userId },
            }
          : null // wasn't saved to begin with -- a no-op
    );

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

    await withOutbox(
      prisma,
      async (tx) => {
        const existing = await tx.resourceHelpfulVote.findUnique({
          where: { resourceId_userId: { resourceId: resource.id, userId } },
        });
        if (existing) return { created: false };
        await tx.resourceHelpfulVote.create({
          data: { resourceId: resource.id, userId },
        });
        await tx.resource.update({
          where: { id: resource.id },
          data: { helpfulCount: { increment: 1 } },
        });
        return { created: true };
      },
      ({ created }) =>
        created
          ? {
              type: "learning.resource.marked_helpful",
              subject: `resource:${resource.id}`,
              producer: "core",
              actorUserId: userId,
              payload: { resourceId: resource.id, userId },
            }
          : null // already marked helpful -- a no-op
    );

    const updated = await findResourceByIdOrSlug(resource.id, userId);
    res.status(200).json({
      ok: true,
      resource: updated ? mapResource(updated, userId) : null,
    });
  } catch (error) {
    next(error);
  }
}
