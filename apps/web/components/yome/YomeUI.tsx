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
    <Link className="yome-brand" href={href} style={light ? { color: "#fff" } : undefined}>
      <span className="yome-brand-mark">Y</span>
      <span>yome</span>
    </Link>
  );
}

export function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: YomeTone }) {
  return <span className={`yome-badge yome-tone-${tone}`}>{children}</span>;
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
    <span className={`yome-avatar yome-avatar-${safeTone}${sizeClass}`}>
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
      <header className="yome-topbar">
        <Brand />
        <label className="yome-searchbox">
          <Search size={19} />
          <input placeholder="Search people, groups, topics..." />
          <kbd>⌘ K</kbd>
        </label>
        <div className="yome-top-actions">
          <button className="yome-icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link className="yome-icon-button" href="/notifications" aria-label="Notifications">
            <Bell size={20} />
          </Link>
          <Link className="yome-profile-button" href="/account">
            <Avatar initials={initials} image={userInfo?.profilePicture || session?.user?.image || undefined} tone="violet" size="sm" />
            <span>
              <strong>{name}</strong>
              <small>{userInfo?.role === "TEACHER" ? "Educator" : "Student"}</small>
            </span>
            <ChevronDown size={16} />
          </Link>
        </div>
      </header>

      <aside className="yome-sidebar">
        <nav aria-label="Primary navigation">
          {yomeNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} className={active ? "yome-nav-item active" : "yome-nav-item"} href={item.href}>
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </Link>
            );
          })}
        </nav>
        <div className="yome-sidebar-divider" />
        <div className="yome-sidebar-heading">
          <span>Your groups</span>
          <Plus size={17} />
        </div>
        <div className="yome-list">
          {groups.slice(0, 3).map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="yome-group-item">
              <ToneSymbol tone={group.tone}>{group.symbol}</ToneSymbol>
              <span>{group.name}</span>
            </Link>
          ))}
        </div>
        <button className="yome-group-item mt-auto" onClick={handleSignOut}>
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
  return (
    <section className="yome-card yome-composer" aria-label="Create a post">
      <div className="yome-composer-row">
        <Avatar initials={userName.slice(0, 2).toUpperCase()} tone="violet" />
        <button className="yome-composer-prompt">Share what you are learning, {userName.split(" ")[0]}...</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--yome-border)] pt-3">
        {[
          ["Post", MessageCircle],
          ["Question", HelpCircle],
          ["Project", Check],
          ["Resource", Bookmark],
        ].map(([label, Icon]) => (
          <button key={String(label)} className="yome-button-secondary min-h-8 text-[11px]">
            <Icon size={17} />
            <span>{String(label)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const accent = post.tone === "amber" ? "var(--yome-amber)" : post.tone === "teal" ? "var(--yome-teal)" : post.tone === "violet" ? "var(--yome-violet)" : "var(--yome-blue)";
  return (
    <article className="yome-card yome-post">
      <div className="yome-post-accent" style={{ background: accent }} />
      <header className="yome-post-header">
        <Avatar initials={post.initials} tone={post.tone === "neutral" ? "blue" : post.tone} />
        <div className="yome-author">
          <strong>{post.author}</strong>
          <small>{post.type} · {post.time}</small>
        </div>
        <Badge tone={post.tone}>{post.type}</Badge>
      </header>
      <div className="yome-post-content">
        <div className="yome-tags">
          {post.tags.map((tag) => (
            <Badge key={tag} tone="neutral">{tag}</Badge>
          ))}
        </div>
        <h2>{post.title}</h2>
        <p>{post.body}</p>
      </div>
      {post.type === "Project" && (
        <div className="yome-visual mx-[18px] mb-4">
          <div className="yome-visual-grid" />
          <div className="relative z-[1] grid h-full min-h-[180px] content-end p-4">
            <span className="font-mono text-[9px] font-bold tracking-[0.14em] text-blue-100">ARDUINO / ENVIRONMENTAL MONITOR</span>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
              <span className="rounded-lg bg-white/10 p-2">moisture <strong className="block text-base">42%</strong></span>
              <span className="rounded-lg bg-white/10 p-2">temperature <strong className="block text-base">24C</strong></span>
              <span className="rounded-lg bg-white/10 p-2">pump <strong className="block text-base text-green-300">active</strong></span>
            </div>
          </div>
        </div>
      )}
      <div className="yome-post-stats">
        <span>{post.stat}</span>
        <span>{post.detail} · 3 shares</span>
      </div>
      <footer className="yome-post-actions">
        <button><HelpCircle size={17} /> <span>Helpful</span></button>
        <button><MessageCircle size={17} /> <span>Answer</span></button>
        <button><Share2 size={17} /> <span>Share</span></button>
        <button><Bookmark size={17} /> <span>Save</span></button>
      </footer>
    </article>
  );
}

export function RightRail() {
  return (
    <aside className="yome-right-rail">
      <section className="yome-section yome-card">
        <div className="yome-section-title">
          <h3 className="flex items-center gap-2"><span className="yome-live-dot" />Live study rooms</h3>
          <Link href="/study-rooms">View all</Link>
        </div>
        <div className="yome-list">
          {studyRooms.slice(0, 2).map((room) => (
            <article key={room.id} className="flex items-center gap-3">
              <ToneSymbol tone={room.tone}>{room.symbol}</ToneSymbol>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[11px]">{room.title}</strong>
                <small className="text-[9px] text-green-600">{room.meta}</small>
              </div>
              <Link className="yome-button-secondary min-h-8 px-3 text-[10px]" href="/study-rooms">Join</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="yome-section yome-card">
        <div className="yome-section-title">
          <h3>Trending topics</h3>
          <Link href="/explore">Explore</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => <Badge key={topic.title} tone={topic.tone}># {topic.title}</Badge>)}
        </div>
      </section>
    </aside>
  );
}
