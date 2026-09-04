import type { YomeIconName } from "@/types/yome-ui";

export type YomeNavItem = {
  label: string;
  href: string;
  icon: YomeIconName;
  badge?: string;
};

export const yomeNavItems: YomeNavItem[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Explore", href: "/explore", icon: "compass" },
  { label: "Groups", href: "/groups", icon: "users" },
  { label: "Connections", href: "/connections", icon: "profile" },
  { label: "Messages", href: "/chat", icon: "message", badge: "4" },
  { label: "Study Rooms", href: "/study-rooms", icon: "headphones" },
  { label: "Resources", href: "/resources", icon: "library" },
  { label: "Projects", href: "/projects", icon: "flask" },
  { label: "Events", href: "/events", icon: "calendar" },
  { label: "Settings", href: "/settings", icon: "settings" },
];
