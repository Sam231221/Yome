"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import { Badge } from "@/components/ui";
import { ComposerCard, FeedPostCard, RightRail } from "@/features/feed";
import { getDashboardHome, getDashboardErrorMessage } from "@/lib/dashboard/dashboardApi";
import type { DashboardHome } from "@/lib/dashboard/types";

export function DashboardScreen() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const { data: session, status } = useSession();
  const [dashboard, setDashboard] = useState<DashboardHome | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (status === "loading") return;
      setIsDashboardLoading(true);
      setDashboardError("");
      try {
        const loadedUserInfo = await ensureUserInfo({
          sessionUser: session?.user,
          currentUserInfo: userInfo,
          dispatch,
        });
        const loggedInUserId = loadedUserInfo?.id ?? userInfo?.id;
        if (!loggedInUserId) {
          if (!cancelled) setDashboardError("Unable to identify the current user.");
          return;
        }
        const dashboardHome = await getDashboardHome(loggedInUserId);
        if (!cancelled) setDashboard(dashboardHome);
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : getDashboardErrorMessage(e, "Failed to load dashboard.");
          setDashboardError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setIsDashboardLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, status, userInfo, dispatch]);

  const fullName = dashboard?.profile.name || (userInfo?.firstname
    ? `${userInfo.firstname} ${userInfo.lastname ?? ""}`.trim()
    : userInfo?.name || session?.user?.name || "Maya");
  const firstName = dashboard?.profile.firstName || fullName.split(" ")[0] || "Maya";
  const learningStreakDays = dashboard?.profile.learningStreakDays ?? 0;

  return (
    <main className="feed">
      <div className="feed-intro">
        <div>
          <p>{new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}</p>
          <h1>Good afternoon, {firstName}</h1>
          <span>What will you learn today?</span>
        </div>
        <Badge tone="blue">{learningStreakDays} day learning streak</Badge>
      </div>
      <div>
        <ComposerCard userName={fullName} />
        <div className="feed-filter">
          {["For you", "Following", "Groups"].map((item, index) => (
            <button key={item} className={index === 0 ? "active" : ""}>
              {item}
            </button>
          ))}
          <span />
          <button className="sort-button inline-flex items-center justify-center rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-muted">Top posts⌄</button>
        </div>
        {isDashboardLoading ? (
          <DashboardState title="Loading dashboard..." />
        ) : dashboardError ? (
          <DashboardState title="Unable to load dashboard" body={dashboardError} />
        ) : dashboard?.feedPosts.length ? (
          dashboard.feedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
        ) : (
          <DashboardState title="No posts yet" body="Posts from your learning network will appear here." />
        )}
        <div className="end-feed">
          <span>Y</span>
          <strong>You&apos;re all caught up</strong>
          <p>Explore a new topic or join a study room.</p>
        </div>
      </div>
      <RightRail
        liveStudyRooms={dashboard?.liveStudyRooms ?? []}
        upcomingSessions={dashboard?.upcomingSessions ?? []}
        suggestedPeople={dashboard?.suggestedPeople ?? []}
        trendingTopics={dashboard?.trendingTopics ?? []}
      />
    </main>
  );
}

function DashboardState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="yome-card yome-post post card rounded-yome border border-yome-border bg-yome-surface p-6 text-center shadow-yome">
      <strong>{title}</strong>
      {body ? <p className="mt-2 text-yome-muted">{body}</p> : null}
    </div>
  );
}
