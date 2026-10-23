"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import StreamVideoProvider from "@/providers/StreamClientProvider";
import { useStreamClientStatus } from "@/providers/stream-client-status";
import { IncomingDirectCallOverlay } from "./IncomingDirectCallOverlay";

function IncomingCallLayer({ enabled }: { enabled: boolean }) {
  const { isReady } = useStreamClientStatus();

  if (!enabled || !isReady) return null;

  return <IncomingDirectCallOverlay />;
}

/**
 * Hosts the Stream call client and the incoming-call overlay. Mounted by every signed-in
 * layout (chat and the main app shell) so a call rings wherever the callee happens to be.
 */
export function DirectCallProviderLayer({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const pathname = usePathname();
  const isCallRoute = /\/chat\/[^/]+\/call\/[^/]+$/.test(pathname ?? "");

  return (
    <StreamVideoProvider blocking={isCallRoute} requireAuth={requireAuth}>
      <IncomingCallLayer enabled={!isCallRoute} />
      {children}
    </StreamVideoProvider>
  );
}
