"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStateProvider } from "@/context/StateContext";
import { yomeNavItems } from "@/features/learning/data";
import { Avatar, Brand, ToneSymbol, YomeIcon } from "@/components/ui";
import { getDashboardHome } from "@/features/dashboard-feed/api/dashboardApi";
import type { DashboardHome } from "@/features/dashboard-feed/types";

export function YomeAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [{ userInfo }] = useStateProvider();
  const [dark, setDark] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardHome | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    const loggedInUserId = userInfo?.id ?? Number((session?.user as { id?: unknown } | undefined)?.id);
    if (!Number.isFinite(loggedInUserId)) return;

    getDashboardHome(loggedInUserId)
      .then((home) => {
        if (!cancelled) setDashboard(home);
      })
      .catch(() => {
        if (!cancelled) setDashboard(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session, userInfo?.id]);

  const name = dashboard?.profile.name || (userInfo?.firstname || userInfo?.lastname
      ? `${userInfo?.firstname ?? ""} ${userInfo?.lastname ?? ""}`.trim()
      : userInfo?.name || session?.user?.name || "Maya Patel");
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
          <button className="yome-icon-button icon-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
            {dark ? <YomeIcon name="sun" size={20} /> : <YomeIcon name="moon" size={20} />}
          </button>
          <Link className="yome-icon-button icon-button notification-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted" href="/notifications" aria-label="Notifications">
            <YomeIcon name="bell" size={20} />
              {dashboard?.profile.notificationCount ? (
                <span className="notification-dot">{dashboard.profile.notificationCount}</span>
              ) : null}
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
          {(dashboard?.sidebarGroups ?? []).slice(0, 3).map((group) => (
            <Link key={group.id} href={`/groups/${group.slug || group.id}`} className="yome-group-item group-item">
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
        <button className="user-card-mini rounded-yome border border-yome-border bg-yome-surface shadow-yome" onClick={handleProfileClick}>
          <Avatar initials={initials} image={userInfo?.profilePicture || session?.user?.image || undefined} tone="violet" size="sm" />
          <div>
            <strong>{name}</strong>
            <small>@{dashboard?.profile.username || userInfo?.username || "yomeuser"}</small>
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
