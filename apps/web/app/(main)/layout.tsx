import React from "react";
import { YomeAppShell } from "@/components/layout";
import { DirectCallProviderLayer } from "@/features/chat/direct-call/DirectCallProviderLayer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DirectCallProviderLayer requireAuth={false}>
      <YomeAppShell>{children}</YomeAppShell>
    </DirectCallProviderLayer>
  );
}
