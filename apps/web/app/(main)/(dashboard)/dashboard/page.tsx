"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import DashboardShell from "./components/facebook/DashboardShell";
import ComposerCard from "./components/facebook/ComposerCard";
import { UserLite } from "./components/facebook/types";
import PeopleYouMayKnow from "./components/facebook/PeopleYouMayKnow";
import GroupSuggestions from "./components/facebook/GroupSuggestions";

function TraySkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--fb-card)] p-3 shadow-[var(--fb-shadow)]">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`tray-skeleton-${index}`}
            className="h-44 min-w-[120px] animate-pulse rounded-2xl bg-[var(--fb-bg)]"
          />
        ))}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`feed-skeleton-${index}`}
          className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--fb-bg)]" />
          <div className="mt-3 h-56 animate-pulse rounded-2xl bg-[var(--fb-bg)]" />
        </div>
      ))}
    </div>
  );
}

const StoriesTray = dynamic(
  () => import("./components/facebook/StoriesTray"),
  {
    loading: () => <TraySkeleton />,
  }
);
const ReelsTray = dynamic(() => import("./components/facebook/ReelsTray"), {
  loading: () => <TraySkeleton />,
});
const Feed = dynamic(() => import("./components/facebook/Feed"), {
  loading: () => <FeedSkeleton />,
});

const Home = () => {
  const [{ userInfo }, dispatch] = useStateProvider();
  const { data: session } = useSession();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!session?.user || userInfo) return;
        await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          dispatch,
        });
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Failed to load user information.";
          toast.error(message);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, userInfo, dispatch]);

  const fullName = userInfo?.firstname
    ? `${userInfo.firstname} ${userInfo.lastname ?? ""}`.trim()
    : userInfo?.name || session?.user?.name || "Friend";

  const user: UserLite = {
    name: fullName,
    avatarUrl:
      userInfo?.profilePicture ||
      session?.user?.image ||
      "/avatars/userprofile.png",
    email: userInfo?.email || session?.user?.email || undefined,
    username: userInfo?.username || undefined,
  };

  return (
    <DashboardShell user={user}>
      <div className="space-y-4">
        <ComposerCard user={user} />
        <StoriesTray user={user} />
        <ReelsTray />
        <PeopleYouMayKnow />
        <GroupSuggestions />
        <Feed />
      </div>
    </DashboardShell>
  );
};

export default Home;
