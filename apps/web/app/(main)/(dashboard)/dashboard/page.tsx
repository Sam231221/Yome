"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import { ComposerCard, FeedPostCard, PageHeading, RightRail, Badge, ToneSymbol } from "@/components/yome/YomeUI";
import { events, feedPosts, resources } from "@/lib/yome/data";

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

  return (
    <div className="yome-page">
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}
        title={`Good afternoon, ${fullName.split(" ")[0] || "Friend"}`}
        subtitle="What will you learn today?"
        action={<Badge tone="blue">12 day learning streak</Badge>}
      />
      <div className="yome-feed-layout">
        <div className="yome-feed-main">
          <ComposerCard userName={fullName} />
          <div className="flex items-end gap-6 border-b border-[var(--yome-border)]">
            {["For you", "Following", "Groups"].map((item, index) => (
              <button key={item} className={`h-11 border-b-2 bg-transparent text-[12px] font-bold ${index === 0 ? "border-[var(--yome-blue)] text-[var(--yome-blue)]" : "border-transparent text-[var(--yome-muted)]"}`}>
                {item}
              </button>
            ))}
          </div>
          {feedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)}
          <section className="yome-card yome-section grid justify-items-center text-center">
            <span className="yome-brand-mark mb-3">Y</span>
            <strong>You are all caught up</strong>
            <p className="yome-muted mt-1">Explore a new topic or join a study room.</p>
          </section>
        </div>
        <RightRail />
      </div>
      <div className="yome-grid mt-6">
        {resources.slice(0, 2).map((resource) => (
          <article key={resource.id} className="yome-card yome-section">
            <ToneSymbol tone={resource.tone}>{resource.type}</ToneSymbol>
            <h2 className="yome-card-title mt-4">{resource.title}</h2>
            <p className="yome-card-copy">{resource.summary}</p>
          </article>
        ))}
        <article className="yome-card yome-section">
          <ToneSymbol tone="violet">{events[0].day}</ToneSymbol>
          <h2 className="yome-card-title mt-4">{events[0].title}</h2>
          <p className="yome-card-copy">{events[0].meta} · {events[0].group}</p>
        </article>
      </div>
    </div>
  );
};

export default Home;
