"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import axios from "axios";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
