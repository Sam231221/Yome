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
    // The request body is trusted as an identity source ONLY when this explicit
    // flag is set. It is off by default and must never be enabled in a deployed
    // environment: without it this route would let any caller sync an arbitrary
    // account. Gating on NODE_ENV alone was unsafe because NODE_ENV is easy to
    // leave unset in a container.
    const devUserSyncEnabled = process.env.ENABLE_DEV_USER_SYNC === "true";
    const email = token?.email ?? (devUserSyncEnabled ? body.email : undefined);
    const name = token?.name ?? (devUserSyncEnabled ? body.name : undefined);
    const image =
      token?.picture ?? (devUserSyncEnabled ? body.image : undefined);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
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
      },
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
