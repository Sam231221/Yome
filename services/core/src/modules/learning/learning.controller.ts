import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { getAuthenticatedUserId } from "@repo/shared";

// Moved from services/user/src/controllers/user.controller.ts in B07. getUserName,
// getInitials, formatDashboardEventMeta, and the Dashboard*Record types are duplicated
// here rather than imported from elsewhere — at the time, getDashboardHome (in
// services/user, since deleted) needed its own copies and couldn't import across a
// service boundary. B08 moved getDashboardHome into core/modules/dashboard, but this
// file's copies were left as-is (retroactively importing them from a sibling module
// wasn't this refactor's scope at either point) — a small, deliberately accepted
// duplicate, not a stale leftover.

function getUserName(user: {
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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDashboardEventMeta(startsAt: Date): string {
  const now = new Date();
  const sameDay = startsAt.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const label = sameDay
    ? "Today"
    : startsAt.toDateString() === tomorrow.toDateString()
      ? "Tomorrow"
      : new Intl.DateTimeFormat("en", { weekday: "short" }).format(startsAt);
  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(startsAt);
  return `${label} · ${time}`;
}

type DashboardEventRecord = {
  id: string;
  title: string;
  type: string;
  startsAt: Date;
  location: string;
  tone: string;
  group: { name: string; subject: string | null } | null;
};

type DashboardPostRecord = {
  id: number;
  slug: string | null;
  title: string;
  description: string;
  kind: string;
  tone: string;
  tags: string[];
  helpfulCount: number;
  answerCount: number;
  commentCount: number;
  shareCount: number;
  inspiredCount: number;
  topAnswerAuthor: string | null;
  topAnswerBody: string | null;
  projectTeam: string | null;
  projectProgress: string | null;
  projectStack: string | null;
  createdAt: Date;
  author: {
    firstname?: string | null;
    lastname?: string | null;
    name?: string | null;
    username?: string | null;
    role?: string | null;
    profilePicture?: string | null;
  };
};

type ProjectPostRecord = DashboardPostRecord & {
  group: { name: string; subject: string | null } | null;
};

function mapLearningEvent(event: DashboardEventRecord) {
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startsAt: event.startsAt.toISOString(),
    date: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(event.startsAt),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(event.startsAt).toUpperCase(),
    time: formatDashboardEventMeta(event.startsAt),
    host: event.location || event.group?.name || "Yome study group",
    subject: event.group?.subject || "General",
    attending: 0,
    tone: event.tone,
  };
}

function mapLearningProject(post: ProjectPostRecord) {
  const authorName = getUserName(post.author);
  const title = post.title || post.description;
  const slug = post.slug || String(post.id);
  const tags = post.tags.length > 0 ? post.tags : [post.group?.subject || "Project"];

  return {
    id: slug,
    title,
    subject: post.group?.subject || tags[0] || "General",
    tags,
    tone: post.tone,
    team: post.projectTeam || "Yome project team",
    progress: post.projectProgress || "In progress",
    stack: post.projectStack || "",
    initials: getInitials(title),
    description: post.description,
    author: authorName,
    updatedAt: post.createdAt.toISOString(),
    helpfulCount: post.helpfulCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
  };
}

export async function getLearningEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (getAuthenticatedUserId(req) === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const prisma = getPrismaInstance();
    const events = (await prisma.groupEvent.findMany({
      where: { startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: [{ startsAt: "asc" }],
      take: 24,
      include: { group: { select: { name: true, subject: true } } },
    })) as DashboardEventRecord[];

    res.status(200).json({
      ok: true,
      events: events.map(mapLearningEvent),
    });
  } catch (error) {
    next(error);
  }
}

export async function getLearningProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (getAuthenticatedUserId(req) === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const prisma = getPrismaInstance();
    const projects = (await prisma.post.findMany({
      where: { kind: "Project" },
      orderBy: [{ createdAt: "desc" }],
      take: 24,
      include: {
        author: {
          select: {
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            role: true,
            profilePicture: true,
          },
        },
        group: { select: { name: true, subject: true } },
      },
    })) as ProjectPostRecord[];

    res.status(200).json({
      ok: true,
      projects: projects.map(mapLearningProject),
    });
  } catch (error) {
    next(error);
  }
}

export async function getLearningProjectById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (getAuthenticatedUserId(req) === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const id = String(req.params.id ?? "");
    const prisma = getPrismaInstance();
    const project = (await prisma.post.findFirst({
      where: {
        kind: "Project",
        OR: [{ slug: id }, /^\d+$/.test(id) ? { id: Number(id) } : { slug: id }],
      },
      include: {
        author: {
          select: {
            firstname: true,
            lastname: true,
            name: true,
            username: true,
            role: true,
            profilePicture: true,
          },
        },
        group: { select: { name: true, subject: true } },
      },
    })) as ProjectPostRecord | null;

    if (!project) {
      res.status(404).json({ ok: false, error: "Project not found" });
      return;
    }

    res.status(200).json({
      ok: true,
      project: mapLearningProject(project),
    });
  } catch (error) {
    next(error);
  }
}
