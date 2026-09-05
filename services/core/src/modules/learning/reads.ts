import getPrismaInstance from "@repo/database";
import { compactNumber } from "@repo/shared";

/**
 * Read helpers for the two dashboard widgets whose tables `SCHEMA_OWNERSHIP.md` now
 * assigns to `learning` (`StudyRoom`, `Topic`), extracted out of `getDashboardHome`'s
 * inline queries in B07 so `learning` owns the read logic for the tables it owns.
 *
 * Not wired to any route yet and not called by `services/user`'s `getDashboardHome` —
 * that still runs its own equivalent inline query, since it can't import across a service
 * boundary. B08 moves `getDashboardHome` into this same process and switches it to call
 * these instead, at which point the inline copy in `services/user` goes away for good.
 */

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

export async function getLiveStudyRooms(take = 2) {
  const prisma = getPrismaInstance();
  const rooms = (await prisma.studyRoom.findMany({
    where: { status: "live" },
    orderBy: [{ activeParticipantCount: "desc" }, { title: "asc" }],
    take,
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
  })) as DashboardStudyRoomRecord[];

  return rooms.map(mapDashboardRoom);
}

export async function getTrendingTopics(take = 4) {
  const prisma = getPrismaInstance();
  const topics = (await prisma.topic.findMany({
    orderBy: [{ trendScore: "desc" }, { title: "asc" }],
    take,
  })) as DashboardTopicRecord[];

  return topics.map(mapDashboardTopic);
}
