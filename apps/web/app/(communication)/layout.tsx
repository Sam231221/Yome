import React, { ReactNode } from "react";
import { DirectCallProviderLayer } from "@/features/direct-call/providers/DirectCallProviderLayer";

export default function layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <DirectCallProviderLayer>{children}</DirectCallProviderLayer>;
}
