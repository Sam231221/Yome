import React, { ReactNode } from "react";
import { ChatStateProvider } from "@/features/chat/state/ChatStateContext";
import { DirectCallProviderLayer } from "@/features/direct-call/providers/DirectCallProviderLayer";

export default function layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <ChatStateProvider>
      <DirectCallProviderLayer>{children}</DirectCallProviderLayer>
    </ChatStateProvider>
  );
}
