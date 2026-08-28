import React from "react";
import { YomeAppShell } from "@/components/yome/YomeUI";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <YomeAppShell>{children}</YomeAppShell>;
}
