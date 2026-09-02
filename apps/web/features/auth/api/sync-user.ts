import axios from "axios";
import type { JWT } from "next-auth/jwt";
import { UPSERT_OAUTH_USER_ROUTE } from "@/utils/ApiRoutes";

type SyncUserBody = {
  email?: string;
  name?: string;
  image?: string;
};

export async function syncOAuthUser({
  token,
  body,
  isDev,
}: {
  token: JWT | null;
  body: SyncUserBody;
  isDev: boolean;
}) {
  const email = token?.email ?? (isDev ? body.email : undefined);
  const name = token?.name ?? (isDev ? body.name : undefined);
  const image = token?.picture ?? (isDev ? body.image : undefined);

  if (!email) {
    return {
      data: { ok: false, error: "Unauthorized" },
      status: 401,
    };
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

  return {
    data: response.data,
    status: response.status,
  };
}
