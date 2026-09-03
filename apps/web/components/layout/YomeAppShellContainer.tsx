"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { getDashboardHome } from "@/features/dashboard-feed/api/dashboardApi";
import type { DashboardHome } from "@/lib/app-shell/data-types";
import { yomeNavItems } from "@/lib/app-shell/navigation";
import { YomeAppShell } from "./AppShell";

export function YomeAppShellContainer({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [{ userInfo }] = useAuthState();
  const [dashboard, setDashboard] = useState<DashboardHome | null>(null);

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

  return (
    <YomeAppShell
      user={userInfo}
      dashboard={dashboard}
      navItems={yomeNavItems}
    >
      {children}
    </YomeAppShell>
  );
}
