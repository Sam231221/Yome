"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import StreamVideoProvider from "@/features/direct-call/providers/StreamClientProvider";
import { useStreamClientStatus } from "@/features/direct-call/providers/stream-client-status";
import { IncomingDirectCallOverlay } from "@/features/direct-call/components/IncomingDirectCallOverlay";

function IncomingCallLayer({ enabled }: { enabled: boolean }) {
  const { isReady } = useStreamClientStatus();

  if (!enabled || !isReady) return null;

  return <IncomingDirectCallOverlay />;
}

export function DirectCallProviderLayer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCallRoute = /\/chat\/[^/]+\/call\/[^/]+$/.test(pathname ?? "");

  return (
    <StreamVideoProvider blocking={isCallRoute}>
      <IncomingCallLayer enabled={!isCallRoute} />
      {children}
    </StreamVideoProvider>
  );
}
