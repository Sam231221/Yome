import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { compactNumber, formatCount, getAuthenticatedUserId } from "@repo/shared";

// getGroupWhere, mapResourceCard, and the community-only types/functions
// (groups, connections, invitations) moved to
// services/core/src/modules/community/community.controller.ts in B06.
// getUserName/getInitials/mapUserCard/mapGroupCard stay duplicated here — this
// file's own getDashboardHome (still here pending B08) needs them too.

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

function mapUserCard(
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

function mapGroupCard(
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

type GroupCardRecord = Parameters<typeof mapGroupCard>[0];
type UserCardRecord = Parameters<typeof mapUserCard>[0];
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
type DashboardStudyRoomRecord = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  tone: string;
  symbol: string;
  activeParticipantCount: number;
  participants: Array<{
    user: {
      firstname?: string | null;
      lastname?: string | null;
      name?: string | null;
      username?: string | null;
      profilePicture?: string | null;
    };
  }>;
  group: {
    name: string;
    subject: string | null;
  } | null;
};
type DashboardTopicRecord = {
  id: string;
  slug: string;
  title: string;
  tone: string;
  postCount: number;
  discussionLabel: string;
};
type DashboardEventRecord = {
  id: string;
  title: string;
  type: string;
  startsAt: Date;
  location: string;
  tone: string;
  group: { name: string; subject: string | null } | null;
};

type ProjectPostRecord = DashboardPostRecord & {
  group: { name: string; subject: string | null } | null;
};

const dashboardSidebarGroupSlugs = [
  "python-learners",
  "physics-club",
  "robotics-team",
];

function getRelativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
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

function mapDashboardPost(post: DashboardPostRecord) {
  const author = getUserName(post.author);
  const kind = post.kind || "Post";
  return {
    id: post.slug || String(post.id),
    type: kind,
    author,
    initials: getInitials(author),
    tone: post.tone,
    time: getRelativeTimeLabel(post.createdAt),
    title: post.title || post.description,
    body: post.description,
    tags: post.tags,
    stat:
      kind === "Project"
        ? `${post.inspiredCount} inspired`
        : `${post.helpfulCount} helpful`,
    detail:
      kind === "Project"
        ? `${post.commentCount} comments`
        : `${post.answerCount} answers`,
    topAnswer:
      post.topAnswerAuthor || post.topAnswerBody
        ? {
            author: post.topAnswerAuthor || "Yome mentor",
            body: post.topAnswerBody || "",
          }
        : null,
    project:
      post.projectTeam || post.projectProgress || post.projectStack
        ? {
            team: post.projectTeam || "",
            progress: post.projectProgress || "",
            stack: post.projectStack || "",
          }
        : null,
    shareCount: post.shareCount,
  };
}

function mapDashboardRoom(room: DashboardStudyRoomRecord) {
  const hostName = room.participants[0]
    ? getUserName(room.participants[0].user)
    : "Yome host";

  return {
    id: room.slug || room.id,
    title: room.title,
    meta: room.meta || `${room.activeParticipantCount} studying now`,
    symbol: room.symbol,
    tone: room.tone,
    subject: room.group?.subject || "General",
    topic: room.group?.name || room.title,
    groupName: room.group?.name || "",
    hostName,
    activeParticipantCount: room.activeParticipantCount,
    participants: room.participants.slice(0, 3).map((participant) => {
      const name = getUserName(participant.user);
      return {
        name,
        initials: getInitials(name),
        profilePicture: participant.user.profilePicture || "",
      };
    }),
  };
}

function mapDashboardTopic(topic: DashboardTopicRecord) {
  return {
    id: topic.slug || topic.id,
    title: topic.title,
    tone: topic.tone,
    posts: `${compactNumber(topic.postCount)} ${topic.discussionLabel}`,
  };
}

function mapDashboardSidebarGroup(
  group: GroupCardRecord,
  viewerId: number,
  joinedIds: Set<string>
) {
  const card = mapGroupCard(group, viewerId, joinedIds);
  return group.slug === "physics-club" ? { ...card, symbol: "φ" } : card;
}

function mapDashboardSuggestedPerson(person: UserCardRecord) {
  const card = mapUserCard(person);
  if (person.username === "priyasharma") {
    return {
      ...card,
      role: "AI · Robotics",
      shared: "3 mutual groups",
      tone: "violet",
    };
  }
  if (person.username === "leomartins") {
    return {
      ...card,
      role: "Physics · Astronomy",
      shared: "3 mutual groups",
      tone: "teal",
    };
  }
  return card;
}

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

export async function getDashboardHome(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== loggedInUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const [
      user,
      feedPosts,
      liveStudyRooms,
      upcomingSessions,
      suggestedPeople,
      trendingTopics,
      sidebarGroups,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: loggedInUserId },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          name: true,
          username: true,
          role: true,
          profilePicture: true,
          learningStreakDays: true,
          notificationCount: true,
        },
      }),
      prisma.post.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 10,
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
        },
      }) as Promise<DashboardPostRecord[]>,
      prisma.studyRoom.findMany({
        where: { status: "live" },
        orderBy: [{ activeParticipantCount: "desc" }, { title: "asc" }],
        take: 2,
        include: {
          group: { select: { name: true, subject: true } },
          participants: {
            take: 3,
            orderBy: { joinedAt: "asc" },
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  name: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      }) as Promise<DashboardStudyRoomRecord[]>,
      prisma.groupEvent.findMany({
        where: {
          title: { in: ["Calculus Revision Session", "Intro to Machine Learning"] },
        },
        orderBy: [{ startsAt: "asc" }],
        take: 2,
        include: { group: { select: { name: true, subject: true } } },
      }) as Promise<DashboardEventRecord[]>,
      prisma.user.findMany({
        where: {
          username: { in: ["priyasharma", "leomartins"] },
          id: { not: loggedInUserId },
          NOT: { followers: { some: { id: loggedInUserId } } },
        },
        orderBy: { firstname: "desc" },
        take: 2,
        include: {
          userProfile: { select: { bio: true, address: true } },
          group: { select: { id: true, name: true, subject: true } },
          groupAdmin: { select: { id: true, name: true, subject: true } },
        },
      }) as Promise<UserCardRecord[]>,
      prisma.topic.findMany({
        orderBy: [{ trendScore: "desc" }, { title: "asc" }],
        take: 4,
      }) as Promise<DashboardTopicRecord[]>,
      prisma.group.findMany({
        where: {
          slug: { in: dashboardSidebarGroupSlugs },
        },
        take: 3,
        include: {
          tags: { orderBy: { label: "asc" } },
          _count: { select: { members: true, admins: true, resources: true } },
        },
      }) as Promise<GroupCardRecord[]>,
    ]);

    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    const userName = getUserName(user);
    const sortedSidebarGroups = [...sidebarGroups].sort(
      (a, b) =>
        dashboardSidebarGroupSlugs.indexOf(a.slug) -
        dashboardSidebarGroupSlugs.indexOf(b.slug)
    );
    const joinedIds = new Set<string>(sortedSidebarGroups.map((group: GroupCardRecord) => group.id));

    res.status(200).json({
      ok: true,
      dashboard: {
        profile: {
          id: user.id,
          name: userName,
          firstName: user.firstname,
          username: user.username,
          role: user.role === "TEACHER" || user.role === "MENTOR" ? "Educator" : "Student",
          initials: getInitials(userName),
          profilePicture: user.profilePicture || "",
          learningStreakDays: user.learningStreakDays,
          notificationCount: user.notificationCount,
        },
        feedPosts: feedPosts.map(mapDashboardPost),
        liveStudyRooms: liveStudyRooms.map(mapDashboardRoom),
        upcomingSessions: upcomingSessions.map((session: DashboardEventRecord) => ({
          id: session.id,
          title: session.title,
          day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(session.startsAt),
          month: new Intl.DateTimeFormat("en", { month: "short" }).format(session.startsAt).toUpperCase(),
          meta: formatDashboardEventMeta(session.startsAt),
          group: session.location || session.group?.name || "Yome study group",
          subject: session.group?.subject || "General",
          tone: session.tone,
          startsAt: session.startsAt.toISOString(),
        })),
        suggestedPeople: suggestedPeople.map(mapDashboardSuggestedPerson),
        trendingTopics: trendingTopics.map(mapDashboardTopic),
        sidebarGroups: sortedSidebarGroups.map((group: GroupCardRecord) =>
          mapDashboardSidebarGroup(group, loggedInUserId, joinedIds)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}

