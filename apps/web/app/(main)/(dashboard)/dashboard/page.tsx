"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import { Badge } from "@/components/ui";
import { ComposerCard, FeedPostCard, RightRail } from "@/features/feed";
import { feedPosts } from "@/features/learning/data";

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
    : userInfo?.name || session?.user?.name || "Maya";

  return (
    <>
      <main className="feed">
        <div className="feed-intro">
          <div>
            <p>{new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}</p>
            <h1>Good afternoon, {fullName.split(" ")[0] || "Maya"}</h1>
            <span>What will you learn today?</span>
          </div>
          <Badge tone="blue">12 day learning streak</Badge>
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
          {feedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)}
          <div className="end-feed">
            <span>Y</span>
            <strong>You&apos;re all caught up</strong>
            <p>Explore a new topic or join a study room.</p>
          </div>
        </div>
        <RightRail />
      </main>
    </>
  );
};

export default Home;
