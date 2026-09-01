import { NextRequest, NextResponse } from "next/server";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4100";
const localhostNames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type DevDbAction =
  | "create-multiple-users"
  | "create-multiple-groups"
  | "create-multiple-resources"
  | "deleteAll";

function hostnameFromHeader(value: string): string | null {
  try {
    return new URL(`http://${value}`).hostname;
  } catch {
    return null;
  }
}

function isLocalRequest(req: NextRequest): boolean {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() ??
    req.headers.get("host") ??
    req.nextUrl.host;
  const hostname = hostnameFromHeader(host);

  return (
    localhostNames.has(req.nextUrl.hostname) &&
    hostname !== null &&
    localhostNames.has(hostname)
  );
}

function readBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

function hasValidDevSeedToken(req: NextRequest): boolean {
  const expected = process.env.DEV_SEED_ROUTE_TOKEN;
  if (!expected) return false;

  const provided = req.headers.get("x-dev-seed-token") ?? readBearerToken(req);
  return provided === expected;
}

function rejectIfDevDbRouteUnavailable(
  req: NextRequest,
  options: { requiresDevSeedToken?: boolean } = {}
): NextResponse | null {
  if (
    process.env.ENABLE_DEV_SEED_ROUTES !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (!isLocalRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  if (!process.env.GATEWAY_SHARED_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (options.requiresDevSeedToken && !hasValidDevSeedToken(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function proxyDevDbMutation(
  req: NextRequest,
  action: DevDbAction,
  options: { requiresDevSeedToken?: boolean } = {}
) {
  const rejection = rejectIfDevDbRouteUnavailable(req, options);
  if (rejection) return rejection;

  const response = await fetch(`${backendBase}/api/db/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GATEWAY_SHARED_TOKEN}`,
    },
  });
  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  });
}
