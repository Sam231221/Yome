import axios, { type InternalAxiosRequestConfig } from "axios";
import { HOST } from "@/utils/ApiRoutes";

/**
 * Browser-side auth for gateway requests.
 *
 * The NextAuth session cookie belongs to the web app's origin, so a browser never sends it
 * to a gateway on another site (e.g. *.vercel.app -> *.up.railway.app). Instead, every
 * request to the gateway carries a short-lived bearer token minted by /api/auth/socket-token
 * (HS256, signed with NEXTAUTH_SECRET, 5-minute expiry), which the gateway verifies.
 * On localhost the cookie still works too, so this is harmless there. NextAuth's signOut
 * does a full-page redirect, which also drops the cached token.
 */

const TOKEN_ROUTE = "/api/auth/socket-token";
// Refresh a little before the 5-minute expiry so in-flight requests never carry a stale token.
const REFRESH_MARGIN_MS = 60_000;

type CachedToken = { value: string; expiresAt: number };

let cached: CachedToken | null = null;
let inFlight: Promise<string | null> | null = null;

function readExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch(TOKEN_ROUTE, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    if (!data.token) return null;
    cached = { value: data.token, expiresAt: readExpiry(data.token) };
    return data.token;
  } catch {
    return null;
  }
}

export async function getGatewayAccessToken(): Promise<string | null> {
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.value;
  // De-duplicate concurrent refreshes: pages fire several gateway requests at once.
  inFlight ??= fetchToken().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

function isGatewayRequest(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? "";
  const base = config.baseURL ?? "";
  return url.startsWith(HOST) || (!/^https?:\/\//.test(url) && base.startsWith(HOST));
}

let installed = false;

/** Adds the bearer token to every gateway request made with axios's default instance. */
export function installGatewayAuthInterceptor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  axios.interceptors.request.use(async (config) => {
    if (!isGatewayRequest(config) || config.headers.has("Authorization")) return config;
    const token = await getGatewayAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });
}
