"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Badge, YomeIcon } from "@/components/ui";
import type { YomeIconName, YomeTone } from "@/features/learning/data";
import type {
  DashboardFeedPost,
  DashboardPerson,
  DashboardSession,
  DashboardStudyRoom,
  DashboardTopic,
} from "@/lib/dashboard/types";

export function ComposerCard({ userName = "there" }: { userName?: string }) {
  const [type, setType] = useState("Post");
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const publish = () => {
    if (!value.trim()) return;
    setSent(true);
    setValue("");
    window.setTimeout(() => setSent(false), 2200);
  };

  return (
    <section className="yome-card yome-composer composer card rounded-yome border border-yome-border bg-yome-surface shadow-yome" aria-label="Create a post">
      <div className="yome-composer-row composer-row flex items-center gap-3">
        <Avatar initials={initials || "Y"} tone="violet" />
        <button className="yome-composer-prompt composer-prompt flex min-w-0 flex-1 items-center rounded-yome border border-yome-border bg-yome-surface-2 text-left text-yome-muted" onClick={() => document.getElementById("composer-input")?.focus()}>
          Share what you&apos;re learning, {userName.split(" ")[0]}...
        </button>
      </div>
      <textarea
        id="composer-input"
        className={value ? "composer-input visible w-full rounded-yome border border-yome-border bg-yome-surface" : "composer-input w-full rounded-yome border border-yome-border bg-yome-surface"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Write a ${type.toLowerCase()}...`}
        aria-label="Post content"
      />
      <div className="composer-actions flex flex-wrap items-center gap-2">
        {[
          ["Post", "message"],
          ["Question", "help"],
          ["Project", "code"],
          ["Resource", "file"],
        ].map(([label, Icon]) => (
          <button
            key={String(label)}
            className={type === label ? "composer-type selected inline-flex items-center gap-2 rounded-yome font-bold" : "composer-type inline-flex items-center gap-2 rounded-yome font-bold"}
            onClick={() => setType(String(label))}
          >
            <YomeIcon name={Icon as YomeIconName} size={18} />
            <span>{String(label)}</span>
          </button>
        ))}
        {value ? (
          <button className="primary-button small inline-flex items-center justify-center gap-2 rounded-yome bg-yome-blue font-bold text-white" onClick={publish}>
            Publish
          </button>
        ) : null}
      </div>
      {sent ? <div className="toast"><YomeIcon name="check" size={18} /> Your post was published</div> : null}
    </section>
  );
}

export function FeedPostCard({ post }: { post: DashboardFeedPost }) {
  const accent = post.tone === "amber" ? "var(--yome-amber)" : post.tone === "teal" ? "var(--yome-teal)" : post.tone === "violet" ? "var(--yome-violet)" : "var(--yome-blue)";
  return (
    <article className="yome-card yome-post post card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
      <div className="yome-post-accent post-accent" style={{ background: accent }} />
      <header className="yome-post-header post-header">
        <Avatar initials={post.initials} tone={post.tone === "neutral" ? "blue" : post.tone} />
        <div className="yome-author author">
          <div>
            <strong>{post.author}</strong>
            {post.type === "Question" ? <span className="verified">✓</span> : null}
          </div>
          <small>{post.type === "Question" ? "Mathematics student" : "Engineering student"} · {post.time}</small>
        </div>
        <Badge tone={post.tone}>{post.type}</Badge>
        <button className="more-button inline-grid shrink-0 place-items-center rounded-full text-yome-muted" aria-label="Post options">
          <YomeIcon name="more" size={18} />
        </button>
      </header>
      <div className="yome-post-content post-content">
        <div className="yome-tags topic-row">
          {post.tags.map((tag) => (
            <Badge key={tag} tone="neutral">{tag}</Badge>
          ))}
        </div>
        <h2>{post.title}</h2>
        <p>{post.body}</p>
      </div>
      {post.type === "Question" ? (
        <div className="answer-preview">
          <span className="answer-avatar"><YomeIcon name="check" size={14} /></span>
          <div>
            <strong>Top answer from {post.topAnswer?.author || "Yome mentor"}</strong>
            <p>{post.topAnswer?.body || "A helpful answer is available for this question."}</p>
          </div>
          <button>Read answer</button>
        </div>
      ) : null}
      {post.type === "Project" && (
        <div className="project-visual" role="img" aria-label="Stylized diagram of the smart greenhouse project">
          <div className="grid-lines" />
          <div className="greenhouse">
            <span className="roof" />
            <span className="plant one">♧</span>
            <span className="plant two">♧</span>
            <span className="plant three">♧</span>
            <span className="sensor">●<i>soil sensor</i></span>
          </div>
          <div className="code-panel">
            <span>moisture</span><strong>42%</strong>
            <span>temperature</span><strong>24°C</strong>
            <span>pump</span><strong className="online">ACTIVE</strong>
          </div>
          <span className="visual-label">ARDUINO / ENVIRONMENTAL MONITOR</span>
        </div>
      )}
      {post.type === "Project" ? (
        <div className="project-meta">
          <div><span>Team</span><strong>{post.project?.team || "Team project"}</strong></div>
          <div><span>Progress</span><strong>{post.project?.progress || "In progress"}</strong></div>
          <div><span>Stack</span><strong>{post.project?.stack || "Learning stack"}</strong></div>
        </div>
      ) : null}
      <div className="yome-post-stats post-stats">
        <span><strong>{post.stat.split(" ")[0]}</strong> {post.stat.split(" ").slice(1).join(" ")}</span>
        <span>{post.detail} · {post.shareCount} shares</span>
      </div>
      <footer className="yome-post-actions post-actions flex items-center gap-2">
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"><YomeIcon name={post.type === "Project" ? "flask" : "help"} size={18} /> <span>{post.type === "Project" ? "Inspiring" : "Helpful"}</span></button>
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"><YomeIcon name="comment" size={18} /> <span>{post.type === "Project" ? "Comment" : "Answer"}</span></button>
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"><YomeIcon name="share" size={18} /> <span>Share</span></button>
        <button className="post-action inline-flex items-center justify-center gap-2 rounded-yome font-bold text-yome-muted"><YomeIcon name="bookmark" size={18} /> <span>Save</span></button>
      </footer>
    </article>
  );
}

export function RightRail({
  liveStudyRooms,
  upcomingSessions,
  suggestedPeople,
  trendingTopics,
}: {
  liveStudyRooms: DashboardStudyRoom[];
  upcomingSessions: DashboardSession[];
  suggestedPeople: DashboardPerson[];
  trendingTopics: DashboardTopic[];
}) {
  const [connected, setConnected] = useState<string[]>([]);

  return (
    <aside className="yome-right-rail right-rail">
      <section className="right-section">
        <div className="right-heading">
          <div><span className="yome-live-dot live-dot" />Live study rooms</div>
          <Link href="/study-rooms">View all</Link>
        </div>
        <div>
          {liveStudyRooms.map((room) => (
            <article key={room.id} className="room-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
              <div className={`room-icon ${room.tone}`}>{room.symbol}</div>
              <div className="room-copy">
                <strong>{room.title}</strong>
                <small>{room.meta}</small>
                <div className="stacked-avatars flex items-center">
                  {room.participants.slice(0, 3).map((participant, index) => (
                    <Avatar
                      key={`${room.id}-${participant.initials}-${index}`}
                      initials={participant.initials}
                      image={participant.profilePicture || undefined}
                      tone={(["blue", "teal", "violet"] as YomeTone[])[index] ?? "blue"}
                      size="xs"
                    />
                  ))}
                  <span>+{Math.max(0, room.activeParticipantCount - room.participants.length)}</span>
                </div>
              </div>
              <Link className="join-button inline-flex items-center justify-center rounded-yome font-bold text-yome-blue" href="/study-rooms">Join</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="right-section">
        <div className="right-heading">
          <div>Upcoming sessions</div>
          <Link href="/events">See calendar</Link>
        </div>
        {upcomingSessions.map((event) => (
          <article key={event.title} className="event-card rounded-yome border border-yome-border bg-yome-surface shadow-yome">
            <div className={event.tone === "amber" ? "date-tile amber" : "date-tile"}>
              <strong>{event.day}</strong>
              <span>{event.month}</span>
            </div>
            <div>
              <strong>{event.title}</strong>
              <small>{event.meta}</small>
              <p>{event.group}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="right-section">
        <div className="right-heading">
          <div>People to learn with</div>
          <Link href="/connections">View all</Link>
        </div>
        {suggestedPeople.map((person) => {
          const isConnected = connected.includes(person.name);
          return (
            <article className="person-row" key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <small>{person.role}</small>
                <p>{person.shared}</p>
              </div>
              <button
                className={isConnected ? "connect-button connected inline-flex items-center justify-center gap-1 rounded-yome font-bold" : "connect-button inline-flex items-center justify-center gap-1 rounded-yome font-bold"}
                onClick={() =>
                  setConnected((current) =>
                    isConnected ? current.filter((value) => value !== person.name) : [...current, person.name]
                  )
                }
              >
                {isConnected ? <YomeIcon name="check" size={15} /> : <YomeIcon name="plus" size={15} />}
                <span>{isConnected ? "Sent" : "Connect"}</span>
              </button>
            </article>
          );
        })}
      </section>
      <section className="right-section topics">
        <div className="right-heading">
          <div>Trending topics</div>
          <Link href="/explore">Explore</Link>
        </div>
        <div>
          {trendingTopics.map((topic) => <Badge key={topic.title} tone={topic.tone}># {topic.title}</Badge>)}
        </div>
      </section>
    </aside>
  );
}
