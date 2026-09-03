import React from "react";
import { YomeAppShellContainer } from "@/components/layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <YomeAppShellContainer>{children}</YomeAppShellContainer>;
}
