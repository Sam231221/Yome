import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { getAuthenticatedUserId } from "@repo/contracts";
import {
  getInitials,
  getUserName,
  mapGroupCard,
  mapUserCard,
  type GroupCardRecord,
  type UserCardRecord,
} from "../community/community.controller.js";
import { getSidebarGroups, getUpcomingEvents } from "../community/reads.js";
import { getLiveStudyRooms, getTrendingTopics } from "../learning/reads.js";
import { getRecentPosts } from "../feed/reads.js";

// Moved from services/user/src/controllers/user.controller.ts in B08 — the last domain
// to leave that file, which is deleted in this same batch. Per the batch's explicit
// instruction, this composes community/learning/feed's own read surfaces
// (getSidebarGroups/getUpcomingEvents, getLiveStudyRooms/getTrendingTopics,
// getRecentPosts) instead of querying their tables directly — now possible in-process
// since dashboard finally lives alongside them in `core`. mapGroupCard/mapUserCard (and
// getUserName/getInitials, which they use internally) are imported from `community`
// rather than kept as a 4th duplicate copy — the duplication B06/B07 left behind
// specifically because dashboard was in a different service resolves here.

const dashboardSidebarGroupSlugs = [
  "python-learners",
  "physics-club",
  "robotics-team",
];

const dashboardUpcomingEventTitles = [
  "Calculus Revision Session",
  "Intro to Machine Learning",
];

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
      getRecentPosts(10),
      getLiveStudyRooms(2),
      getUpcomingEvents(dashboardUpcomingEventTitles, 2),
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
      getTrendingTopics(4),
      getSidebarGroups(dashboardSidebarGroupSlugs, 3),
    ]);

    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    const userName = getUserName(user);
    const joinedIds = new Set<string>(
      sidebarGroups.map((group: GroupCardRecord) => group.id)
    );

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
        feedPosts,
        liveStudyRooms,
        upcomingSessions,
        suggestedPeople: suggestedPeople.map(mapDashboardSuggestedPerson),
        trendingTopics,
        sidebarGroups: sidebarGroups.map((group: GroupCardRecord) =>
          mapDashboardSidebarGroup(group, loggedInUserId, joinedIds)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}
