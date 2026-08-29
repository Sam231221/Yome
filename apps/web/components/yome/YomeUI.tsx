"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, Check, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import {
  groups,
  studyRooms,
  topics,
  yomeNavItems,
  type FeedPost,
  type YomeIconName,
  type YomeTone,
} from "@/lib/yome/data";

const iconPaths: Record<string, string> = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.4 5.6L8 16l2.4-5.6L16 8Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
  headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.1-.9 2-2 2h-1v-7h5v3a2 2 0 0 1-2 2ZM6 19a2 2 0 0 1-2-2v-3h5v7H8a2 2 0 0 1-2-2Z"/>',
  library: '<path d="m4 19 5-1 6 2 5-1V5l-5 1-6-2-5 1Z"/><path d="M9 4v14M15 6v14"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.3 2.2c-1 .7-1.8 1.2-1.8 2.8M12 18h.01"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  comment: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
};

function YomeIcon({
  name,
  size = 20,
  filled = false,
  className,
}: {
  name: YomeIconName | keyof typeof iconPaths;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] ?? iconPaths.home }}
    />
  );
}

export function Brand({ href = "/dashboard", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link className="yome-brand brand" href={href} style={light ? { color: "#fff" } : undefined}>
      <span className="yome-brand-mark brand-mark">Y</span>
      <span>yome</span>
    </Link>
  );
}

export function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: YomeTone }) {
  return <span className={`yome-badge badge yome-tone-${tone} badge-${tone}`}>{children}</span>;
}

export function Avatar({
  initials,
  tone = "blue",
  size = "md",
  image,
}: {
  initials?: string;
  tone?: YomeTone;
  size?: "xs" | "sm" | "md" | "lg";
  image?: string;
}) {
  const safeTone = tone === "neutral" ? "blue" : tone;
  const sizeClass = size === "md" ? "" : ` yome-avatar-${size}`;
  return (
    <span className={`yome-avatar avatar avatar-${safeTone} yome-avatar-${safeTone}${sizeClass} avatar-${size}`}>
      {image ? <Image src={image} alt={initials || "Avatar"} fill sizes="86px" className="object-cover" /> : initials}
    </span>
  );
}

export function ToneSymbol({ children, tone = "blue" }: { children: React.ReactNode; tone?: YomeTone }) {
  return <span className={`yome-symbol yome-tone-${tone}`}>{children}</span>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="yome-page-heading">
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {action}
    </header>
  );
}

export function YomeAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [{ userInfo }] = useStateProvider();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const name =
    userInfo?.firstname || userInfo?.lastname
      ? `${userInfo?.firstname ?? ""} ${userInfo?.lastname ?? ""}`.trim()
      : userInfo?.name || session?.user?.name || "Maya Patel";
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "Y",
    [name]
  );
  const handleProfileClick = () => {
    router.push("/account");
  };

  return (
    <div
      className={`${dark ? "yome-app dark" : "yome-app"}${
        pathname.startsWith("/chat") ? " yome-chat-shell" : ""
      }`}
    >
      <header className="yome-topbar topbar">
        <Brand />
        <label className="yome-searchbox searchbox">
          <YomeIcon name="search" size={19} />
          <input placeholder="Search people, groups, topics..." />
          <kbd>⌘ K</kbd>
        </label>
        <div className="yome-top-actions top-actions">
          <button className="yome-icon-button icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            {dark ? <YomeIcon name="sun" size={20} /> : <YomeIcon name="moon" size={20} />}
          </button>
          <Link className="yome-icon-button icon-button notification-button" href="/notifications" aria-label="Notifications">
            <YomeIcon name="bell" size={20} />
            <span className="notification-dot">3</span>
          </Link>
          <Link className="yome-profile-button profile-button" href="/account">
            <Avatar initials={initials} image={userInfo?.profilePicture || session?.user?.image || undefined} tone="violet" size="sm" />
            <span>
              <strong>{name}</strong>
              <small>{userInfo?.role === "TEACHER" ? "Educator" : "Student"}</small>
            </span>
            <span className="chevron">⌄</span>
          </Link>
        </div>
      </header>

      <aside className="yome-sidebar sidebar">
        <nav aria-label="Primary navigation">
          {yomeNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} className={active ? "yome-nav-item nav-item active" : "yome-nav-item nav-item"} href={item.href}>
                <YomeIcon name={item.icon} size={20} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </Link>
            );
          })}
        </nav>
        <div className="yome-sidebar-divider sidebar-divider" />
        <div className="yome-sidebar-heading sidebar-heading">
          <span>Your groups</span>
          <YomeIcon name="plus" size={17} />
        </div>
        <div className="yome-list group-list">
          {groups.slice(0, 3).map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="yome-group-item group-item">
              <ToneSymbol tone={group.tone}>{group.symbol}</ToneSymbol>
              <span>{group.name}</span>
            </Link>
          ))}
        </div>
        <button className="view-all" onClick={() => router.push("/groups")}>
          View all groups <YomeIcon name="arrow" size={16} />
        </button>
        <button className="demo-flow" onClick={() => router.push("/onboarding")}>
          Preview onboarding
        </button>
        <button className="user-card-mini" onClick={handleProfileClick}>
          <Avatar initials={initials} image={userInfo?.profilePicture || session?.user?.image || undefined} tone="violet" size="sm" />
          <div>
            <strong>{name}</strong>
            <small>@mayacodes</small>
          </div>
          <YomeIcon name="more" size={18} />
        </button>
      </aside>

      <main className="yome-shell-main">{children}</main>

      <nav className="yome-mobile-nav" aria-label="Mobile navigation">
        {[
          { href: "/dashboard", label: "Home", icon: yomeNavItems[0].icon },
          { href: "/explore", label: "Explore", icon: yomeNavItems[1].icon },
          { href: "/dashboard", label: "Create", icon: "plus" as const },
          { href: "/chat", label: "Messages", icon: yomeNavItems[4].icon },
          { href: "/account", label: "Profile", icon: yomeNavItems[3].icon },
        ].map((item) => {
          const active = pathname === item.href;
          const className = `${active ? "active " : ""}${item.label === "Create" ? "create-mobile" : ""}`.trim();
          return (
            <Link key={`${item.href}-${item.label}`} className={className} href={item.href}>
              <YomeIcon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

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
    <section className="yome-card yome-composer composer card" aria-label="Create a post">
      <div className="yome-composer-row composer-row">
        <Avatar initials={initials || "Y"} tone="violet" />
        <button className="yome-composer-prompt composer-prompt" onClick={() => document.getElementById("composer-input")?.focus()}>
          Share what you&apos;re learning, {userName.split(" ")[0]}...
        </button>
      </div>
      <textarea
        id="composer-input"
        className={value ? "composer-input visible" : "composer-input"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Write a ${type.toLowerCase()}...`}
        aria-label="Post content"
      />
      <div className="composer-actions">
        {[
          ["Post", "message"],
          ["Question", "help"],
          ["Project", "code"],
          ["Resource", "file"],
        ].map(([label, Icon]) => (
          <button
            key={String(label)}
            className={type === label ? "composer-type selected" : "composer-type"}
            onClick={() => setType(String(label))}
          >
            <YomeIcon name={Icon as keyof typeof iconPaths} size={18} />
            <span>{String(label)}</span>
          </button>
        ))}
        {value ? (
          <button className="primary-button small" onClick={publish}>
            Publish
          </button>
        ) : null}
      </div>
      {sent ? <div className="toast"><YomeIcon name="check" size={18} /> Your post was published</div> : null}
    </section>
  );
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const accent = post.tone === "amber" ? "var(--yome-amber)" : post.tone === "teal" ? "var(--yome-teal)" : post.tone === "violet" ? "var(--yome-violet)" : "var(--yome-blue)";
  return (
    <article className="yome-card yome-post post card">
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
        <button className="more-button" aria-label="Post options">
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
            <strong>Top answer from Dr. James Liu</strong>
            <p>Think of it as reversing the product rule: you&apos;re redistributing which function gets differentiated...</p>
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
          <div><span>Team</span><strong>4 students</strong></div>
          <div><span>Progress</span><strong>Prototype complete</strong></div>
          <div><span>Stack</span><strong>Arduino · C++</strong></div>
        </div>
      ) : null}
      <div className="yome-post-stats post-stats">
        <span><strong>{post.stat.split(" ")[0]}</strong> {post.stat.split(" ").slice(1).join(" ")}</span>
        <span>{post.detail} · {post.type === "Project" ? "6 shares" : "3 shares"}</span>
      </div>
      <footer className="yome-post-actions post-actions">
        <button className="post-action"><YomeIcon name={post.type === "Project" ? "flask" : "help"} size={18} /> <span>{post.type === "Project" ? "Inspiring" : "Helpful"}</span></button>
        <button className="post-action"><YomeIcon name="comment" size={18} /> <span>{post.type === "Project" ? "Comment" : "Answer"}</span></button>
        <button className="post-action"><YomeIcon name="share" size={18} /> <span>Share</span></button>
        <button className="post-action"><YomeIcon name="bookmark" size={18} /> <span>Save</span></button>
      </footer>
    </article>
  );
}

export function RightRail() {
  const [connected, setConnected] = useState<string[]>([]);
  const people = [
    { name: "Priya Sharma", detail: "AI · Robotics", initials: "PS", tone: "violet" as YomeTone },
    { name: "Leo Martins", detail: "Physics · Astronomy", initials: "LM", tone: "teal" as YomeTone },
  ];

  return (
    <aside className="yome-right-rail right-rail">
      <section className="right-section">
        <div className="right-heading">
          <div><span className="yome-live-dot live-dot" />Live study rooms</div>
          <Link href="/study-rooms">View all</Link>
        </div>
        <div>
          {studyRooms.slice(0, 2).map((room) => (
            <article key={room.id} className="room-card">
              <div className={`room-icon ${room.tone}`}>{room.symbol}</div>
              <div className="room-copy">
                <strong>{room.title}</strong>
                <small>{room.meta}</small>
                <div className="stacked-avatars">
                  <Avatar initials="AL" tone="blue" size="xs" />
                  <Avatar initials="SC" tone="teal" size="xs" />
                  <Avatar initials="MP" tone="violet" size="xs" />
                  <span>+11</span>
                </div>
              </div>
              <Link className="join-button" href="/study-rooms">Join</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="right-section">
        <div className="right-heading">
          <div>Upcoming sessions</div>
          <Link href="/events">See calendar</Link>
        </div>
        {[
          { day: "28", month: "AUG", title: "Calculus Revision Session", meta: "Today · 4:00 PM", group: "Mathematics Study Group", tone: "violet" },
          { day: "30", month: "AUG", title: "Intro to Machine Learning", meta: "Sat · 2:30 PM", group: "AI & ML Community", tone: "amber" },
        ].map((event) => (
          <article key={event.title} className="event-card">
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
        {people.map((person) => {
          const isConnected = connected.includes(person.name);
          return (
            <article className="person-row" key={person.name}>
              <Avatar initials={person.initials} tone={person.tone} />
              <div>
                <strong>{person.name}</strong>
                <small>{person.detail}</small>
                <p>3 mutual groups</p>
              </div>
              <button
                className={isConnected ? "connect-button connected" : "connect-button"}
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
          {topics.map((topic) => <Badge key={topic.title} tone={topic.tone}># {topic.title}</Badge>)}
        </div>
      </section>
    </aside>
  );
}
