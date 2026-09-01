import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { readSessionToken } from "@/lib/auth/sessionToken";
import { UPSERT_OAUTH_USER_ROUTE } from "@/utils/ApiRoutes";

export async function POST(req: NextRequest) {
  try {
    const token = await readSessionToken(req);
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      image?: string;
    };
    const isDev = process.env.NODE_ENV !== "production";
    const email = token?.email ?? (isDev ? body.email : undefined);
    const name = token?.name ?? (isDev ? body.name : undefined);
    const image = token?.picture ?? (isDev ? body.image : undefined);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const response = await axios.post(
      UPSERT_OAUTH_USER_ROUTE,
      {
        email,
        name,
        image,
      },
      {
        headers: process.env.GATEWAY_SHARED_TOKEN
          ? { Authorization: `Bearer ${process.env.GATEWAY_SHARED_TOKEN}` }
          : undefined,
        validateStatus: () => true,
      }
    );

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
