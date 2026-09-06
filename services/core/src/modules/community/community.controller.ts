import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import {
  formatCount,
  getAuthenticatedUserId,
  isUuid,
  slugify,
} from "@repo/contracts";
import { cacheAside, hashQuery } from "@repo/cache";
import { withOutbox } from "@repo/events";

/** B12: cache-aside TTL for the group-discover list, per data-architecture-plan.md's Redis
 * key table (`yome:cache:groups:discover:<queryHash>`, 300s) — a fixed constant, not an env
 * var. Only `CACHE_TTL_DASHBOARD_SECONDS` is in the plan's own "Environment Variables Added"
 * table; group-discover and resource-list are specified with a literal TTL, not a knob. */
const GROUP_DISCOVER_CACHE_TTL_SECONDS = 300;

function getGroupWhere(id: string) {
  return isUuid(id) ? { id } : { slug: id };
}

/**
 * Ensures the authenticated request is acting on its own account (the
 * `x-user-id` the gateway attached vs. the `:loggedInUserId` the route was
 * called with). Writes 401 (no session) or 403 (mismatched id) and returns
 * false; returns true on success. Extracted from ~9 handlers that repeated
 * this exact pair of checks verbatim in the former services/user controller.
 */
function assertSelf(req: Request, res: Response, loggedInUserId: number): boolean {
  const authenticatedUserId = getAuthenticatedUserId(req);
  if (authenticatedUserId === null) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return false;
  }
  if (authenticatedUserId !== loggedInUserId) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return false;
  }
  return true;
}

export function getUserName(user: {
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  username?: string | null;
}): string {
  return (
    [user.firstname, user.lastname].filter(Boolean).join(" ").trim() ||
    user.name ||
    user.username ||
    "Yome user"
  );
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function mapUserCard(
  user: {
    id: number;
    firstname?: string | null;
    lastname?: string | null;
    name?: string | null;
    username?: string | null;
    role?: string | null;
    profilePicture?: string | null;
    userProfile?: { bio?: string | null; address?: string | null } | null;
    group?: Array<{ id: string; name: string; subject?: string | null }>;
    groupAdmin?: Array<{ id: string; name: string; subject?: string | null }>;
  },
  sharedGroups: Array<{ id: string; name: string; subject?: string | null }> = [],
  isFollowing = false
) {
  const name = getUserName(user);
  const role = user.role ? user.role.toLowerCase() : "learner";
  const address = user.userProfile?.address;
  const sharedSubjects = Array.from(
    new Set(sharedGroups.map((group) => group.subject).filter(Boolean))
  ).slice(0, 2);

  return {
    id: user.id,
    name,
    username: user.username,
    role: `${role} on Yome${address ? ` · ${address}` : ""}`,
    shared:
      sharedGroups.length > 0
        ? `${sharedSubjects.join(", ") || "Shared learning"} · ${formatCount(sharedGroups.length, "mutual group")}`
        : user.userProfile?.bio || "Build your learning network on Yome",
    initials: getInitials(name),
    tone: sharedSubjects.includes("Engineering")
      ? "amber"
      : sharedSubjects.includes("Science")
        ? "teal"
        : sharedSubjects.includes("Mathematics")
          ? "violet"
          : "blue",
    profilePicture: user.profilePicture || "",
    isFollowing,
  };
}

function mapResourceCard(resource: {
  id: string;
  slug: string;
  title: string;
  type: string;
  level: string;
  tone: string;
  description: string;
  saveCount: number;
  author?: {
    firstname?: string | null;
    lastname?: string | null;
    name?: string | null;
    username?: string | null;
  } | null;
}) {
  return {
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    type: resource.type,
    level: resource.level,
    tone: resource.tone,
    description: resource.description,
    authorName: resource.author ? getUserName(resource.author) : "Yome contributor",
    saves: formatCount(resource.saveCount, "save"),
  };
}

export function mapGroupCard(
  group: {
    id: string;
    slug: string;
    name: string;
    about: string;
    subject: string;
    category: string;
    tone: string;
    symbol: string;
    thumbnail: string;
    featured: boolean;
    activeThisWeek: number;
    projectCount: number;
    mentorCount: number;
    tags?: Array<{ label: string; tone: string }>;
    _count?: { members?: number; admins?: number; resources?: number };
  },
  viewerId: number | null,
  joinedGroupIds = new Set<string>()
) {
  const memberCount = (group._count?.members ?? 0) + (group._count?.admins ?? 0);
  return {
    id: group.id,
    slug: group.slug,
    title: group.name,
    name: group.name,
    members: formatCount(memberCount, "member"),
    memberCount,
    detail: group.about,
    about: group.about,
    subject: group.subject,
    category: group.category,
    symbol: group.symbol,
    tone: group.tone,
    thumbnail: group.thumbnail,
    tags:
      group.tags && group.tags.length > 0
        ? group.tags.map((tag) => ({ label: tag.label, tone: tag.tone }))
        : [{ label: group.subject, tone: group.tone }],
    featured: group.featured,
    activeThisWeek: group.activeThisWeek,
    projectCount: group.projectCount,
    mentorCount: group.mentorCount,
    resourceCount: group._count?.resources ?? 0,
    isJoined: viewerId ? joinedGroupIds.has(group.id) : false,
  };
}

export type GroupCardRecord = Parameters<typeof mapGroupCard>[0];
export type UserCardRecord = Parameters<typeof mapUserCard>[0];
type ResourceCardRecord = Parameters<typeof mapResourceCard>[0];
type GroupInvitationRecord = {
  id: string;
  status: string;
  createdAt: Date;
  group: GroupCardRecord;
};
type GroupDetailRecord = GroupCardRecord & {
  privacy: string;
  location: string;
  created_at: Date;
  admins: UserCardRecord[];
  members: UserCardRecord[];
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    ctaLabel: string | null;
    ctaHref: string | null;
    pinned: boolean;
    createdAt: Date;
    author: UserCardRecord | null;
  }>;
  events: Array<{
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    location: string;
    tone: string;
  }>;
  resources: ResourceCardRecord[];
};

export async function getFollowedUsersByUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: {
        following: { include: { userProfile: true } },
      },
    });
    const followedUsers = user?.following ?? [];
    res.status(200).send({ followedUsers });
  } catch (error) {
    next(error);
  }
}

export async function getUnfollowedMentors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const mentorsNotFollowed = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        NOT: { followers: { some: { id: loggedInUserId } } },
        id: { not: loggedInUserId },
      },
    });
    res.status(200).json({ mentorsNotFollowed });
  } catch (error) {
    next(error);
  }
}

export async function getUnassociatedGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
  if (Number.isNaN(loggedInUserId)) {
    res.status(400).json({ msg: "Invalid user id", unassociatedGroups: [] });
    return;
  }
  if (!assertSelf(req, res, loggedInUserId)) return;
  try {
    const prisma = getPrismaInstance();
    const unassociatedGroups = await prisma.group.findMany({
      where: {
        NOT: {
          OR: [
            { members: { some: { id: loggedInUserId } } },
            { admins: { some: { id: loggedInUserId } } },
          ],
        },
      },
    });

    // An empty database returns an empty list here, same as any other genuinely
    // group-less state. Seeding a fresh database is a deliberate operator action
    // (POST /api/db/create-multiple-groups, dev-guarded, see @repo/seed) rather than
    // something this endpoint synthesises on the caller's behalf.
    res.status(200).json({ unassociatedGroups });
  } catch (error) {
    next(error);
  }
}

export async function getAllGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
}

export async function getAllGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
}

export async function discoverGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const viewerId = getAuthenticatedUserId(req);
    const query = String(req.query.query ?? "").trim();
    const subject = String(req.query.subject ?? "").trim();
    const sort = String(req.query.sort ?? "featured");

    const joinedGroupIds = new Set<string>();
    if (viewerId !== null) {
      const joined = (await prisma.group.findMany({
        where: {
          OR: [
            { members: { some: { id: viewerId } } },
            { admins: { some: { id: viewerId } } },
          ],
        },
        select: { id: true },
      })) as Array<{ id: string }>;
      joined.forEach((group) => joinedGroupIds.add(group.id));
    }

    // B12: cached without viewerId in the key or the payload — isJoined is resolved fresh
    // from joinedGroupIds (above) on every request, cached or not, per
    // api-and-dataflow-plan.md's explicit warning that mapGroupCard mixes shared and
    // per-viewer fields: never bake a per-viewer flag into a shared cache entry.
    const cacheKey = `yome:cache:groups:discover:${hashQuery({ query, subject, sort })}`;
    const groups = await cacheAside(
      cacheKey,
      GROUP_DISCOVER_CACHE_TTL_SECONDS,
      async () =>
        (await prisma.group.findMany({
          where: {
            ...(subject && subject !== "All" ? { subject } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { about: { contains: query, mode: "insensitive" } },
                    { subject: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                    { tags: { some: { label: { contains: query, mode: "insensitive" } } } },
                  ],
                }
              : {}),
          },
          orderBy:
            sort === "members"
              ? [{ members: { _count: "desc" } }, { admins: { _count: "desc" } }]
              : sort === "active"
                ? [{ activeThisWeek: "desc" }, { name: "asc" }]
                : sort === "recent"
                  ? [{ created_at: "desc" }]
                  : sort === "name"
                    ? [{ name: "asc" }]
                    : [{ featured: "desc" }, { activeThisWeek: "desc" }, { name: "asc" }],
          include: {
            tags: { orderBy: { label: "asc" } },
            _count: { select: { members: true, admins: true, resources: true } },
          },
        })) as GroupCardRecord[]
    );

    res.status(200).json({
      ok: true,
      groups: groups.map((group) => mapGroupCard(group, viewerId, joinedGroupIds)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getJoinedGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const groups = (await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
      orderBy: [{ updated_at: "desc" }, { name: "asc" }],
      include: {
        tags: { orderBy: { label: "asc" } },
        _count: { select: { members: true, admins: true, resources: true } },
      },
    })) as GroupCardRecord[];
    const joinedIds = new Set<string>(groups.map((group) => group.id));

    res.status(200).json({
      ok: true,
      groups: groups.map((group) => mapGroupCard(group, loggedInUserId, joinedIds)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getGroupInvitations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const invitations = (await prisma.groupInvitation.findMany({
      where: { userId: loggedInUserId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        group: {
          include: {
            tags: { orderBy: { label: "asc" } },
            _count: { select: { members: true, admins: true, resources: true } },
          },
        },
      },
    })) as GroupInvitationRecord[];

    res.status(200).json({
      ok: true,
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        status: invitation.status,
        createdAt: invitation.createdAt.toISOString(),
        group: mapGroupCard(
          invitation.group,
          loggedInUserId,
          new Set()
        ),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getGroupDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const viewerId = getAuthenticatedUserId(req);
    const group = (await prisma.group.findUnique({
      where: getGroupWhere(String(req.params.id)),
      include: {
        tags: { orderBy: { label: "asc" } },
        admins: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            role: true,
            profilePicture: true,
            userProfile: { select: { bio: true, address: true } },
          },
          take: 8,
        },
        members: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            role: true,
            profilePicture: true,
            userProfile: { select: { bio: true, address: true } },
          },
          take: 12,
        },
        announcements: {
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          take: 3,
          include: {
            author: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                name: true,
                username: true,
                role: true,
                profilePicture: true,
              },
            },
          },
        },
        events: {
          where: { startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { startsAt: "asc" },
          take: 4,
        },
        resources: {
          orderBy: [{ helpfulCount: "desc" }, { saveCount: "desc" }],
          take: 6,
          include: {
            author: {
              select: {
                firstname: true,
                lastname: true,
                name: true,
                username: true,
              },
            },
          },
        },
        _count: { select: { members: true, admins: true, resources: true } },
      },
    })) as GroupDetailRecord | null;

    if (!group) {
      res.status(404).json({ ok: false, error: "Group not found" });
      return;
    }

    const joinedIds = new Set<string>();
    if (
      viewerId &&
      [...group.admins, ...group.members].some((user) => user.id === viewerId)
    ) {
      joinedIds.add(group.id);
    }
    const summary = mapGroupCard(group, viewerId, joinedIds);

    res.status(200).json({
      ok: true,
      group: {
        ...summary,
        memberLabel: summary.members,
        privacy: group.privacy,
        location: group.location,
        createdAt: group.created_at.toISOString(),
        moderators: group.admins.map((admin) => mapUserCard(admin)),
        members: group.members.map((member) => mapUserCard(member)),
        announcements: group.announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          ctaLabel: announcement.ctaLabel,
          ctaHref: announcement.ctaHref,
          pinned: announcement.pinned,
          createdAt: announcement.createdAt.toISOString(),
          author: announcement.author ? mapUserCard(announcement.author) : null,
        })),
        events: group.events.map((event) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          startsAt: event.startsAt.toISOString(),
          location: event.location,
          tone: event.tone,
        })),
        resources: group.resources.map(mapResourceCard),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = Number(req.body.loggedInUserId);
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const baseSlug = slugify(String(req.body.name));
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.group.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const group = await withOutbox(
      prisma,
      async (tx) =>
        tx.group.create({
          data: {
            slug,
            name: String(req.body.name),
            about: String(req.body.about ?? ""),
            subject: String(req.body.subject ?? "General"),
            category: String(req.body.category ?? "Community"),
            tone: String(req.body.tone ?? "blue"),
            symbol: String(req.body.symbol ?? "Y"),
            privacy: String(req.body.privacy ?? "Public group"),
            location: String(req.body.location ?? "Global"),
            thumbnail: String(req.body.thumbnail ?? ""),
            admins: { connect: { id: loggedInUserId } },
            tags: {
              create: (req.body.tags ?? []).map((label: string, index: number) => ({
                label,
                tone: index === 0 ? String(req.body.tone ?? "blue") : "neutral",
              })),
            },
          },
          include: {
            tags: { orderBy: { label: "asc" } },
            _count: { select: { members: true, admins: true, resources: true } },
          },
        }),
      (createdGroup) => [
        {
          type: "community.group.created",
          subject: `group:${createdGroup.id}`,
          producer: "core",
          actorUserId: loggedInUserId,
          payload: {
            groupId: createdGroup.id,
            slug: createdGroup.slug,
            name: createdGroup.name,
            subject: createdGroup.subject,
            category: createdGroup.category,
            creatorUserId: loggedInUserId,
          },
        },
        // The creator becomes the group's first admin in the same write -- a real
        // "member joined" fact, not a separate action.
        {
          type: "community.group.member_joined",
          subject: `group:${createdGroup.id}`,
          producer: "core",
          actorUserId: loggedInUserId,
          payload: { groupId: createdGroup.id, userId: loggedInUserId, role: "admin" },
        },
      ]
    );

    res.status(201).json({
      ok: true,
      group: mapGroupCard(group, loggedInUserId, new Set([group.id])),
    });
  } catch (error) {
    next(error);
  }
}

export async function joinGroupById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.body = {
    loggedInUserId: req.body.loggedInUserId,
    groupIdToJoin: req.params.id,
  };
  await joinUnjoinedGroups(req, res, next);
}

export async function getConnectionSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const [followingCount, joinedGroupCount] = await Promise.all([
      prisma.user.count({
        where: { followers: { some: { id: loggedInUserId } } },
      }),
      prisma.group.count({
        where: {
          OR: [
            { members: { some: { id: loggedInUserId } } },
            { admins: { some: { id: loggedInUserId } } },
          ],
        },
      }),
    ]);

    res.status(200).json({
      ok: true,
      summary: {
        connections: followingCount,
        pendingRequests: 0,
        following: followingCount,
        sharedCommunities: joinedGroupCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getConnectionSuggestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const currentUserGroups = (await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
      select: { id: true, name: true, subject: true },
    })) as Array<{ id: string; name: string; subject: string }>;
    const currentGroupIds = new Set(currentUserGroups.map((group) => group.id));

    const users = (await prisma.user.findMany({
      where: {
        id: { not: loggedInUserId },
        NOT: { followers: { some: { id: loggedInUserId } } },
      },
      orderBy: [{ role: "desc" }, { firstname: "asc" }],
      take: 24,
      include: {
        userProfile: { select: { bio: true, address: true } },
        group: { select: { id: true, name: true, subject: true } },
        groupAdmin: { select: { id: true, name: true, subject: true } },
      },
    })) as UserCardRecord[];

    res.status(200).json({
      ok: true,
      people: users.map((user) => {
        const userGroups = [...(user.group ?? []), ...(user.groupAdmin ?? [])];
        const sharedGroups = userGroups.filter((group) => currentGroupIds.has(group.id));
        return mapUserCard(user, sharedGroups, false);
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowingConnections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (!assertSelf(req, res, loggedInUserId)) return;

    const prisma = getPrismaInstance();
    const user = (await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: {
        following: {
          include: {
            userProfile: { select: { bio: true, address: true } },
            group: { select: { id: true, name: true, subject: true } },
            groupAdmin: { select: { id: true, name: true, subject: true } },
          },
          orderBy: { firstname: "asc" },
        },
      },
    })) as { following: UserCardRecord[] } | null;

    res.status(200).json({
      ok: true,
      people: (user?.following ?? []).map((person) =>
        mapUserCard(person, [], true)
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function followUnfollowedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, mentorId } = req.body as {
    loggedInUserId?: number;
    mentorId?: string;
  };
  try {
    const requesterId = Number(loggedInUserId);
    if (Number.isNaN(requesterId)) {
      res.status(400).send("Invalid loggedInUserId.");
      return;
    }
    if (!assertSelf(req, res, requesterId)) return;

    const mentorIdAsNumber = parseInt(String(mentorId ?? ""), 10);
    if (Number.isNaN(mentorIdAsNumber)) {
      res.status(400).send("Invalid mentor id.");
      return;
    }
    const prisma = getPrismaInstance();
    const userToFollow = await prisma.user.findUnique({
      where: { id: mentorIdAsNumber },
    });
    if (!userToFollow || userToFollow.id === requesterId) {
      res.status(400).send("Invalid user to follow.");
      return;
    }
    const isFollowing = await prisma.user.count({
      where: {
        id: requesterId,
        following: { some: { id: mentorIdAsNumber } },
      },
    });
    if (isFollowing > 0) {
      res.status(400).send("You are already following this user.");
      return;
    }
    await withOutbox(
      prisma,
      async (tx) =>
        tx.user.update({
          where: { id: requesterId },
          data: { following: { connect: { id: mentorIdAsNumber } } },
        }),
      () => ({
        type: "community.connection.followed",
        subject: `user:${requesterId}`,
        producer: "core",
        actorUserId: requesterId,
        payload: { followerId: requesterId, followeeId: mentorIdAsNumber },
      })
    );
    res.status(200).send({ status: 200, msg: "Successfully followed the user." });
  } catch (error) {
    next(error);
  }
}

export async function joinUnjoinedGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, groupIdToJoin } = req.body as {
    loggedInUserId?: number | string;
    groupIdToJoin?: string;
  };
  const userId =
    typeof loggedInUserId === "number"
      ? loggedInUserId
      : parseInt(String(loggedInUserId), 10);
  if (Number.isNaN(userId)) {
    res.status(400).json({ msg: "Invalid user id." });
    return;
  }
  try {
    if (!assertSelf(req, res, userId)) return;

    const prisma = getPrismaInstance();
    // Only real groups can be joined. A synthetic "groupData-N" id (from the retired
    // zero-seed fallback — see @repo/seed) simply fails the lookup below like any other
    // unrecognised id or slug.
    let groupId: string = groupIdToJoin!;

    const groupToJoin = await prisma.group.findUnique({
      where: getGroupWhere(groupId),
    });
    if (!groupToJoin) {
      res.status(400).json({ msg: "Invalid group to join." });
      return;
    }
    groupId = groupToJoin.id;
    const isMemberOrAdmin = await prisma.group.count({
      where: {
        id: groupId,
        OR: [
          { members: { some: { id: userId } } },
          { admins: { some: { id: userId } } },
        ],
      },
    });
    if (isMemberOrAdmin > 0) {
      res
        .status(400)
        .json({ msg: "You are already a member or admin of this group." });
      return;
    }
    await withOutbox(
      prisma,
      async (tx) =>
        tx.group.update({
          where: { id: groupId },
          data: { members: { connect: { id: userId } } },
        }),
      (updatedGroup) => ({
        type: "community.group.member_joined",
        subject: `group:${updatedGroup.id}`,
        producer: "core",
        actorUserId: userId,
        payload: { groupId: updatedGroup.id, userId, role: "member" },
      })
    );
    res.status(200).json({ status: 200, msg: "Successfully joined the group." });
  } catch (error) {
    next(error);
  }
}
