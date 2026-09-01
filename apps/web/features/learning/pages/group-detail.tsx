"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Headphones, MessageCircle, MoreHorizontal, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, Badge } from "@/components/ui";
import {
  getGroupDetail,
  getLearningErrorMessage,
  joinLearningGroup,
  type LearningGroupDetail,
} from "@/lib/learning/learningApi";
import { MembersGrid, QuestionCard } from "./shared";

export function GroupDetailContent({ id }: { id: string }) {
  const [tab, setTab] = useState("Discussion");
  const [group, setGroup] = useState<LearningGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const loggedInUserId = Number((session?.user as { id?: unknown } | undefined)?.id);
  const canJoin = status === "authenticated" && Number.isFinite(loggedInUserId);
  const tabs = ["Discussion", "Questions", "Resources", "Members", "Events", "About"];

  useEffect(() => {
    let cancelled = false;

    async function loadGroup() {
      setIsLoading(true);
      setError("");
      try {
        const nextGroup = await getGroupDetail(id);
        if (!cancelled) setGroup(nextGroup);
      } catch (loadError) {
        if (!cancelled) setError(getLearningErrorMessage(loadError, "Unable to load group."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleJoin = async () => {
    if (!group || !canJoin || group.isJoined || isJoining) return;
    setIsJoining(true);
    try {
      await joinLearningGroup(loggedInUserId, group.slug || group.id);
      setGroup({ ...group, isJoined: true });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <GroupDetailState title="Loading group..." />;
  }

  if (error || !group) {
    return <GroupDetailState title="Unable to load group" body={error || "Group not found."} />;
  }

  const pinnedAnnouncement = group.announcements.find((item) => item.pinned) ?? group.announcements[0];

  return (
    <main className="group-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/groups">← All groups</Link>
      <section className="group-detail-hero card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
        <div className="group-detail-cover">
          <div className="cover-grid" />
          <span className="robot-head group-robot-head"><i /><i /></span>
          <span className="robot-body group-robot-body">Y</span>
          <span className="group-cover-code">BUILD · TEST · LEARN · REPEAT</span>
        </div>
        <div className="group-detail-summary">
          <div className="group-detail-logo">{group.symbol}</div>
          <div>
            <div className="group-name-line">
              <h1>{group.name}</h1>
              <span className="verified">✓</span>
            </div>
            <p>{group.subject} · {group.category}</p>
            <small>{group.members} · {group.activeThisWeek} active this week</small>
          </div>
          <div className="group-detail-actions flex flex-wrap items-center gap-2">
            <button className={group.isJoined ? "secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" : "primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white"} disabled={isJoining} onClick={handleJoin}>
              {group.isJoined ? <>Joined</> : isJoining ? "Joining..." : "Join group"}
            </button>
            <Link className="secondary-button inline-flex items-center justify-center gap-2 rounded-yome border border-yome-border bg-yome-surface font-bold text-yome-blue" href="/chat">
              <MessageCircle size={16} /> Group chat
            </Link>
            <button className="icon-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted"><MoreHorizontal size={18} /></button>
          </div>
        </div>
        <p className="group-description">
          {group.about}
        </p>
        <div className="group-chips flex flex-wrap items-center gap-2">
          {group.tags.map((tag, index) => (
            <Badge key={tag.label} tone={index ? "neutral" : tag.tone}>{tag.label}</Badge>
          ))}
        </div>
        <nav className="group-detail-tabs">
          {tabs.map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>
      </section>
      <div className="group-detail-layout">
        <section className="group-detail-main">
          {tab === "Discussion" ? (
            <>
              {pinnedAnnouncement ? (
                <article className="group-announcement card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
                  <div className="announcement-mark">A</div>
                  <div>
                    <Badge tone={group.tone}>Pinned announcement</Badge>
                    <h2>{pinnedAnnouncement.title}</h2>
                    <p>{pinnedAnnouncement.body}</p>
                    <footer>
                      <Avatar initials={pinnedAnnouncement.author?.initials || "Y"} tone={pinnedAnnouncement.author?.tone || group.tone} size="xs" />
                      <span>{pinnedAnnouncement.author?.name || "Group team"}</span>
                      {pinnedAnnouncement.ctaHref ? (
                        <Link href={pinnedAnnouncement.ctaHref}>{pinnedAnnouncement.ctaLabel || "View"} <ArrowRight size={14} /></Link>
                      ) : null}
                    </footer>
                  </div>
                </article>
              ) : null}
              <QuestionCard />
            </>
          ) : null}
          {tab === "Questions" ? (
            <>
              <div className="group-tab-heading">
                <div>
                  <h2>Questions</h2>
                  <p>Get help from 7,842 robotics learners.</p>
                </div>
                <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Ask a question</button>
              </div>
              <QuestionCard />
            </>
          ) : null}
          {tab === "Resources" ? (
            group.resources.length ? (
              <div className="resource-grid">
                {group.resources.map((resource) => (
                  <article className="resource-item card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={resource.id}>
                    <span className={`resource-type ${resource.type.toLowerCase()}`}>{resource.type}</span>
                    <Badge tone={resource.tone}>{resource.level}</Badge>
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                    <footer><span>{resource.authorName} · {resource.saves}</span><button><Bookmark size={16} /></button></footer>
                  </article>
                ))}
              </div>
            ) : <GroupTabState title="No resources yet" body="Resources shared with this group will appear here." />
          ) : null}
          {tab === "Members" ? <MembersGrid members={group.members} /> : null}
          {tab === "Events" ? (
            group.events.length ? (
              <div className="event-list">
                {group.events.map((event) => {
                  const date = new Date(event.startsAt);
                  return (
                    <article className="card rounded-yome border border-yome-border bg-yome-surface shadow-yome" key={event.id}>
                      <div className={`date-tile ${event.tone === "amber" ? "amber" : ""}`}><strong>{date.getDate().toString().padStart(2, "0")}</strong><span>{date.toLocaleString(undefined, { month: "short" }).toUpperCase()}</span></div>
                      <div><Badge tone={event.tone}>{event.type}</Badge><h3>{event.title}</h3><p>{date.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })} · {event.location}</p></div>
                      <button className="primary-button inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white">Join event</button>
                    </article>
                  );
                })}
              </div>
            ) : <GroupTabState title="No events yet" body="Upcoming group events will appear here." />
          ) : null}
          {tab === "About" ? (
            <div className="group-about card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <h2>About this community</h2>
              <p>{group.about}</p>
              <h3>Group rules</h3>
              <ol>
                <li>Keep feedback constructive and specific.</li>
                <li>Credit teammates and source material.</li>
                <li>Use the correct question and resource tags.</li>
                <li>Report unsafe projects or inappropriate content.</li>
              </ol>
            </div>
          ) : null}
        </section>
        <aside className="group-detail-aside">
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>About</h3>
            <div><span>Privacy</span><strong>{group.privacy}</strong></div>
            <div><span>Created</span><strong>{new Date(group.createdAt).toLocaleString(undefined, { month: "long", year: "numeric" })}</strong></div>
            <div><span>Location</span><strong>{group.location}</strong></div>
            <button>Read group rules</button>
          </section>
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className="section-title flex items-center justify-between gap-4"><h3>Group moderators</h3><button>View all</button></div>
            {group.moderators.map((moderator) => (
              <div className="moderator" key={moderator.id}><Avatar initials={moderator.initials} tone={moderator.tone} /><span><strong>{moderator.name}</strong><small>{moderator.role}</small></span></div>
            ))}
          </section>
          <section className="card group-side-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <h3>Active study room</h3>
            <div className="active-group-room"><span className="live-dot" /><div><strong>Build challenge help</strong><small>18 studying now</small></div></div>
            <button className="join-room-wide"><Headphones size={16} /> Join room</button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function GroupDetailState({ title, body }: { title: string; body?: string }) {
  return (
    <main className="group-detail-page min-w-0 text-yome-text">
      <Link className="back-link inline-flex items-center gap-2 font-bold text-yome-blue" href="/groups">All groups</Link>
      <GroupTabState title={title} body={body} />
    </main>
  );
}

function GroupTabState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="groups-tab-state card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="empty-icon"><UsersRound size={30} /></div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
