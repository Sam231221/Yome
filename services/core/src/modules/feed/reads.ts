import getPrismaInstance from "@repo/database";

/**
 * `feed` is the write owner for `Post`, `Comment`, and `Like` (B08's Definition of Done:
 * "no direct `prisma.post.*` writes outside `feed`"). No write endpoint exists for any of
 * these yet anywhere in the app — the only current writes are dev-only seed/reset handlers
 * in `@repo/seed`, the same carve-out already established for `Group`/`Resource` seeding.
 * This module currently owns only the one read `getDashboardHome` needs; it's the natural
 * home for write endpoints if/when a compose-a-post feature is built.
 */

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

function getRelativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
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

export async function getRecentPosts(take = 10) {
  const prisma = getPrismaInstance();
  const posts = (await prisma.post.findMany({
    orderBy: [{ createdAt: "desc" }],
    take,
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
  })) as DashboardPostRecord[];

  return posts.map(mapDashboardPost);
}
