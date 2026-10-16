import React, { ReactNode } from "react";
import { DirectCallProviderLayer } from "@/features/chat/direct-call/DirectCallProviderLayer";

export default function layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <DirectCallProviderLayer>{children}</DirectCallProviderLayer>;
}
