import { NextResponse } from "next/server";

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4100";
const sharedToken = process.env.GATEWAY_SHARED_TOKEN;

export async function POST() {
  if (
    process.env.ENABLE_DEV_SEED_ROUTES !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  const headers = sharedToken
    ? { Authorization: `Bearer ${sharedToken}` }
    : undefined;
  const res = await fetch(`${backendBase}/api/db/deleteAll`, {
    method: "POST",
    headers,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
