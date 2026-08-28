"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Send,
  Share2,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { groups, studyRooms, topics, yomeNavItems, type FeedPost, type YomeTone } from "@/lib/yome/data";

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
      : userInfo?.name || session?.user?.name || "Yome learner";
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

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className={dark ? "yome-app dark" : "yome-app"}>
      <header className="yome-topbar topbar">
        <Brand />
        <label className="yome-searchbox searchbox">
          <Search size={19} />
          <input placeholder="Search people, groups, topics..." />
          <kbd>⌘ K</kbd>
        </label>
        <div className="yome-top-actions top-actions">
          <button className="yome-icon-button icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link className="yome-icon-button icon-button notification-button" href="/notifications" aria-label="Notifications">
            <Bell size={20} />
            <span className="notification-dot">3</span>
          </Link>
          <Link className="yome-profile-button profile-button" href="/account">
            <Avatar initials={initials} image={userInfo?.profilePicture || session?.user?.image || undefined} tone="violet" size="sm" />
            <span>
              <strong>{name}</strong>
              <small>{userInfo?.role === "TEACHER" ? "Educator" : "Student"}</small>
            </span>
            <ChevronDown size={16} className="chevron" />
          </Link>
        </div>
      </header>

      <aside className="yome-sidebar sidebar">
        <nav aria-label="Primary navigation">
          {yomeNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} className={active ? "yome-nav-item nav-item active" : "yome-nav-item nav-item"} href={item.href}>
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </Link>
            );
          })}
        </nav>
        <div className="yome-sidebar-divider sidebar-divider" />
        <div className="yome-sidebar-heading sidebar-heading">
          <span>Your groups</span>
          <Plus size={17} />
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
          View all groups <Send size={16} />
        </button>
        <button className="yome-group-item group-item mt-auto" onClick={handleSignOut}>
          <Send size={18} />
          <span>Sign out</span>
        </button>
      </aside>

      <main className="yome-shell-main">{children}</main>

      <nav className="yome-mobile-nav" aria-label="Mobile navigation">
        {[
          { href: "/dashboard", label: "Home", icon: yomeNavItems[0].icon },
          { href: "/explore", label: "Explore", icon: yomeNavItems[1].icon },
          { href: "/dashboard", label: "Create", icon: Plus },
          { href: "/chat", label: "Messages", icon: yomeNavItems[4].icon },
          { href: "/account", label: "Profile", icon: yomeNavItems[3].icon },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={`${item.href}-${item.label}`} className={active ? "active" : ""} href={item.href}>
              <Icon size={21} />
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
          ["Post", MessageCircle],
          ["Question", HelpCircle],
          ["Project", Check],
          ["Resource", Bookmark],
        ].map(([label, Icon]) => (
          <button
            key={String(label)}
            className={type === label ? "composer-type selected" : "composer-type"}
            onClick={() => setType(String(label))}
          >
            <Icon size={17} />
            <span>{String(label)}</span>
          </button>
        ))}
        {value ? (
          <button className="primary-button small" onClick={publish}>
            Publish
          </button>
        ) : null}
      </div>
      {sent ? <div className="toast"><Check size={17} /> Your post was published</div> : null}
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
          </div>
          <small>{post.type === "Question" ? "Mathematics student" : "Engineering student"} · {post.time}</small>
        </div>
        <Badge tone={post.tone}>{post.type}</Badge>
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
        <span>{post.detail} · 3 shares</span>
      </div>
      <footer className="yome-post-actions post-actions">
        <button className="post-action"><HelpCircle size={17} /> <span>{post.type === "Project" ? "Inspiring" : "Helpful"}</span></button>
        <button className="post-action"><MessageCircle size={17} /> <span>{post.type === "Project" ? "Comment" : "Answer"}</span></button>
        <button className="post-action"><Share2 size={17} /> <span>Share</span></button>
        <button className="post-action"><Bookmark size={17} /> <span>Save</span></button>
      </footer>
    </article>
  );
}

export function RightRail() {
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
