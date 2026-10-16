"use client";

import Link from "next/link";
import { Avatar, YomeIcon } from "@/components/ui";
import type { DashboardSidebarGroup } from "@/lib/dashboard/types";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  initials: string;
  image?: string;
  shortcuts: DashboardSidebarGroup[];
  notificationCount?: number;
};

const menuLinks: Array<{ label: string; href: string; icon: Parameters<typeof YomeIcon>[0]["name"] }> = [
  { label: "Saved", href: "/explore", icon: "bookmark" },
  { label: "Memories", href: "/dashboard", icon: "clock" },
  { label: "Groups", href: "/groups", icon: "users" },
  { label: "Study Rooms", href: "/study-rooms", icon: "headphones" },
  { label: "Marketplace", href: "/explore", icon: "store" },
  { label: "Events", href: "/events", icon: "calendar" },
];

export function MobileMenu({ open, onClose, name, initials, image, shortcuts, notificationCount }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="yome-mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="yome-mobile-menu-header">
        <Link href="/account" className="yome-mobile-menu-profile" onClick={onClose}>
          <Avatar initials={initials} image={image} tone="violet" size="sm" />
          <strong>{name}</strong>
        </Link>
        <div className="yome-mobile-menu-header-actions">
          <Link href="/settings" className="yome-icon-button" aria-label="Settings" onClick={onClose}>
            <YomeIcon name="settings" size={19} />
          </Link>
          <button className="yome-icon-button" aria-label="Close menu" onClick={onClose}>
            <YomeIcon name="x" size={20} />
          </button>
        </div>
      </div>

      <p className="yome-mobile-menu-heading">Your shortcuts</p>
      <div className="yome-mobile-menu-shortcuts">
        {shortcuts.slice(0, 4).map((group) => (
          <Link key={group.id} href={`/groups/${group.slug || group.id}`} className="yome-mobile-menu-shortcut" onClick={onClose}>
            <span>{group.symbol}</span>
            <small>{group.name}</small>
          </Link>
        ))}
      </div>

      <div className="yome-mobile-menu-list">
        {menuLinks.map((item) => (
          <Link key={item.label} href={item.href} className="yome-mobile-menu-item" onClick={onClose}>
            <YomeIcon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link href="/notifications" className="yome-mobile-menu-item" onClick={onClose}>
          <YomeIcon name="bell" size={20} />
          <span>Notifications</span>
          {notificationCount ? <em>{notificationCount}</em> : null}
        </Link>
      </div>

      <div className="yome-mobile-menu-divider" />

      <Link href="/account" className="yome-mobile-menu-row" onClick={onClose}>
        <YomeIcon name="help" size={19} />
        <span>Help and support</span>
      </Link>
      <Link href="/settings" className="yome-mobile-menu-row" onClick={onClose}>
        <YomeIcon name="settings" size={19} />
        <span>Settings and privacy</span>
      </Link>
    </div>
  );
}
