import React, { ReactNode } from "react";

import StreamVideoProvider from "@/providers/StreamClientProvider";

export default function layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <StreamVideoProvider>{children}</StreamVideoProvider>;
}
