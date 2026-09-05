import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { StreamClient } from "@stream-io/node-sdk";
import { getAuthenticatedUserId } from "@repo/contracts";
import { getOrCreateDirectConversation } from "../messages/conversations.js";
import { isMatchingDirectConversation } from "../messages/direct-messages.js";
import { parseRequiredUserId } from "../messages/messages.controller.js";

type PrismaClient = ReturnType<typeof getPrismaInstance>;

type StreamSeedUser = {
  id: number | string;
  name?: string | null;
  image?: string | null;
};

/** Read lazily, not as a module-level constant: this file is imported (via calls.routes.ts)
 * before index.ts's own `dotenv.config()` call runs, so a top-level `process.env.X` read
 * here would capture `undefined` on every cold start. */
const getStreamServerClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret = process.env.STREAM_SECRET_KEY;
  if (!apiKey) throw new Error("Stream API key secret is missing");
  if (!apiSecret) throw new Error("Stream API secret is missing");
  return new StreamClient(apiKey, apiSecret);
};

async function isConnectedDirectPeer(
  prisma: PrismaClient,
  callerId: number,
  peerId: number
): Promise<boolean> {
  const connectedPeerCount = await prisma.user.count({
    where: {
      id: callerId,
      following: { some: { id: peerId } },
    },
  });

  return connectedPeerCount > 0;
}

/** Shared by `validateDirectConversation` and `createCallParticipants` (which used to make
 * an HTTP round trip to the former, back when it lived in `apps/web/actions/stream.actions.ts`
 * — now that both live in `messaging`, it is an in-process call). */
async function checkDirectConversationAccess(
  prisma: PrismaClient,
  params: { callerId: number; peerId: number; conversationId: string }
): Promise<{ ok: true } | { ok: false; status: 403 | 404; error: string }> {
  const { callerId, peerId, conversationId } = params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || !isMatchingDirectConversation(conversation, callerId, peerId)) {
    return { ok: false, status: 404, error: "Direct conversation not found" };
  }

  const isConnectedPeer = await isConnectedDirectPeer(prisma, callerId, peerId);
  if (!isConnectedPeer) {
    return { ok: false, status: 403, error: "Direct call peer is not connected" };
  }

  return { ok: true };
}

export async function validateDirectConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const callerId = parseRequiredUserId(req.body?.callerId);
    const peerId = parseRequiredUserId(req.body?.peerId);
    const conversationId = String(req.body?.conversationId ?? "").trim();

    if (callerId === null || peerId === null || !conversationId) {
      res.status(400).json({ ok: false, error: "Invalid direct conversation" });
      return;
    }
    if (callerId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const access = await checkDirectConversationAccess(prisma, {
      callerId,
      peerId,
      conversationId,
    });
    if (!access.ok) {
      res.status(access.status).json({ ok: false, error: access.error });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function prepareDirectCallConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const callerId = parseRequiredUserId(req.body?.callerId);
    const peerId = parseRequiredUserId(req.body?.peerId);
    if (callerId === null || peerId === null) {
      res.status(400).json({ ok: false, error: "Invalid direct call participants" });
      return;
    }
    if (callerId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const isConnectedPeer = await isConnectedDirectPeer(prisma, callerId, peerId);
    if (!isConnectedPeer) {
      res.status(403).json({ ok: false, error: "Direct call peer is not connected" });
      return;
    }

    const conversation = await getOrCreateDirectConversation(prisma, callerId, peerId);
    res.status(200).json({ ok: true, conversation });
  } catch (error) {
    next(error);
  }
}

/** Replaces `tokenProvider()` in the deleted `apps/web/actions/stream.actions.ts` (B09).
 * Same `generateUserToken` call, same params, same `@stream-io/node-sdk` version — only the
 * process minting the token changed, so in-flight client tokens stay valid. */
export async function createCallToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const streamClient = getStreamServerClient();

    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    const token = streamClient.generateUserToken({
      user_id: String(authenticatedUserId),
      validity_in_seconds: 3600,
      exp: expirationTime,
      iat: issuedAt,
    });

    res.status(200).json({ ok: true, token });
  } catch (error) {
    next(error);
  }
}

/** Replaces `ensureDirectCallUsers()` in the deleted `apps/web/actions/stream.actions.ts`
 * (B09). `apps/web` no longer resolves the session user itself — `callerId` is checked
 * against the gateway-authenticated `x-user-id` instead of a NextAuth session lookup, the
 * same pattern every other messaging endpoint already uses. */
export async function createCallParticipants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const callerId = parseRequiredUserId(req.body?.callerId);
    const peerId = parseRequiredUserId(req.body?.peerId);
    const conversationId = String(req.body?.conversationId ?? "").trim();
    const users = (req.body?.users ?? []) as StreamSeedUser[];

    if (callerId === null || peerId === null || !conversationId) {
      res.status(400).json({ ok: false, error: "Invalid direct call participants" });
      return;
    }
    if (callerId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const access = await checkDirectConversationAccess(prisma, {
      callerId,
      peerId,
      conversationId,
    });
    if (!access.ok) {
      res.status(access.status).json({ ok: false, error: access.error });
      return;
    }

    const uniqueUsers = Array.from(
      new Map(
        users
          .filter((user) => String(user.id).trim().length > 0)
          .map((user) => [String(user.id), user])
      ).values()
    );

    const expectedUserIds = new Set([String(callerId), String(peerId)]);
    const includesOnlyCallMembers = uniqueUsers.every((user) =>
      expectedUserIds.has(String(user.id))
    );
    const includesAllCallMembers = Array.from(expectedUserIds).every((userId) =>
      uniqueUsers.some((user) => String(user.id) === userId)
    );
    if (!includesOnlyCallMembers || !includesAllCallMembers) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const streamClient = getStreamServerClient();
    await streamClient.upsertUsers(
      uniqueUsers.map((user) => ({
        id: String(user.id),
        name: user.name?.trim() || `User ${user.id}`,
        image: user.image?.trim() || undefined,
        role: "user",
      }))
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}
