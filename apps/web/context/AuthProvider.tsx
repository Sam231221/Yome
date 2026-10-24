"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import axios from "axios";
import { installGatewayAuthInterceptor } from "@/lib/auth/gatewayAccessToken";

// Installed at module load, not in an effect: child components' effects run before this
// provider's, and their first gateway requests must already carry the bearer token.
installGatewayAuthInterceptor();

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
