import { NextRequest, NextResponse } from "next/server";
import { syncOAuthUser } from "@/features/auth/api/sync-user";
import { readSessionToken } from "@/lib/auth/sessionToken";

export async function POST(req: NextRequest) {
  try {
    const token = await readSessionToken(req);
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      image?: string;
    };
    const isDev = process.env.NODE_ENV !== "production";
    const response = await syncOAuthUser({ token, body, isDev });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
