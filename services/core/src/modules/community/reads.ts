import getPrismaInstance from "@repo/database";
import type { GroupCardRecord } from "./community.controller.js";

/**
 * Read helpers for the dashboard widgets that touch community-owned tables
 * (`Group`, `GroupEvent`), extracted out of `getDashboardHome`'s inline queries in B08
 * so `community` owns the read logic for the tables it owns — same rationale as
 * `learning`'s `reads.ts` (B07).
 *
 * `getSidebarGroups` returns raw (unmapped) rows, sorted to match the requested slug
 * order: mapping them into display cards needs the caller's `loggedInUserId` as
 * `mapGroupCard`'s viewer context, and `dashboard.controller.ts` applies its own
 * `physics-club` symbol override on top — both are dashboard-specific concerns, not
 * community ones, so they stay in `dashboard.controller.ts` alongside the (imported)
 * `mapGroupCard`. `getUpcomingEvents`, by contrast, has no per-caller context or
 * dashboard-specific override, so it returns fully mapped cards directly.
 */

type DashboardEventRecord = {
  id: string;
  title: string;
  type: string;
  startsAt: Date;
  location: string;
  tone: string;
  group: { name: string; subject: string | null } | null;
};

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

export async function getSidebarGroups(
  slugs: string[],
  take = 3
): Promise<GroupCardRecord[]> {
  const prisma = getPrismaInstance();
  const groups = (await prisma.group.findMany({
    where: { slug: { in: slugs } },
    take,
    include: {
      tags: { orderBy: { label: "asc" } },
      _count: { select: { members: true, admins: true, resources: true } },
    },
  })) as GroupCardRecord[];

  return [...groups].sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
}

export async function getUpcomingEvents(titles: string[], take = 2) {
  const prisma = getPrismaInstance();
  const events = (await prisma.groupEvent.findMany({
    where: { title: { in: titles } },
    orderBy: [{ startsAt: "asc" }],
    take,
    include: { group: { select: { name: true, subject: true } } },
  })) as DashboardEventRecord[];

  return events.map((session) => ({
    id: session.id,
    title: session.title,
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(session.startsAt),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(session.startsAt).toUpperCase(),
    meta: formatDashboardEventMeta(session.startsAt),
    group: session.location || session.group?.name || "Yome study group",
    subject: session.group?.subject || "General",
    tone: session.tone,
    startsAt: session.startsAt.toISOString(),
  }));
}
