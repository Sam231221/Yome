import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { StreamClient } from "@stream-io/node-sdk";
import { getAuthenticatedUserId } from "@repo/contracts";
import { withOutbox } from "@repo/events";
import { getOrCreateDirectConversation } from "../messages/conversations.js";
import { isMatchingDirectConversation } from "../messages/direct-messages.js";
import { parseRequiredUserId } from "../messages/messages.controller.js";
import {
  CALL_NOT_ALLOWED_ERROR,
  canCallPeer,
  type CallAccessPrisma,
} from "./call-access.js";

type PrismaClient = ReturnType<typeof getPrismaInstance>;

const CALLS_NOT_CONFIGURED_ERROR = "Calls are not configured on this server.";

/** Read lazily, not as a module-level constant: this file is imported (via calls.routes.ts)
 * before index.ts's own `dotenv.config()` call runs, so a top-level `process.env.X` read
 * here would capture `undefined` on every cold start. Returns null when Stream credentials
 * are missing so callers can answer 503 instead of a generic 500. */
const getStreamServerClient = (): StreamClient | null => {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim();
  const apiSecret = process.env.STREAM_SECRET_KEY?.trim();
  if (!apiKey || !apiSecret) return null;
  return new StreamClient(apiKey, apiSecret);
};

const isCallablePeer = (prisma: PrismaClient, callerId: number, peerId: number) =>
  canCallPeer(prisma as unknown as CallAccessPrisma, callerId, peerId);

const getStreamDisplayName = (user: {
  id: number;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  username: string | null;
}) =>
  `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() ||
  user.name?.trim() ||
  user.username?.trim() ||
  `User ${user.id}`;

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

  if (!(await isCallablePeer(prisma, callerId, peerId))) {
    return { ok: false, status: 403, error: CALL_NOT_ALLOWED_ERROR };
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
    if (!(await isCallablePeer(prisma, callerId, peerId))) {
      res.status(403).json({ ok: false, error: CALL_NOT_ALLOWED_ERROR });
      return;
    }

    const { conversation } = await withOutbox(
      prisma,
      (tx) => getOrCreateDirectConversation(tx, callerId, peerId),
      ({ conversation: resolvedConversation, created }) =>
        created
          ? {
              type: "messaging.conversation.created",
              subject: `conversation:${resolvedConversation.id}`,
              producer: "messaging",
              actorUserId: callerId,
              payload: {
                conversationId: resolvedConversation.id,
                participantAId: resolvedConversation.participantAId,
                participantBId: resolvedConversation.participantBId,
              },
            }
          : null
    );
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
    if (!streamClient) {
      res.status(503).json({ ok: false, error: CALLS_NOT_CONFIGURED_ERROR });
      return;
    }

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

    const streamClient = getStreamServerClient();
    if (!streamClient) {
      res.status(503).json({ ok: false, error: CALLS_NOT_CONFIGURED_ERROR });
      return;
    }

    // Stream identities come from our own user records, never from the request body, so a
    // caller can't rename or re-avatar the person they're calling.
    const members: Array<{
      id: number;
      name: string | null;
      firstname: string | null;
      lastname: string | null;
      username: string | null;
      profilePicture: string | null;
    }> = await prisma.user.findMany({
      where: { id: { in: [callerId, peerId] } },
      select: {
        id: true,
        name: true,
        firstname: true,
        lastname: true,
        username: true,
        profilePicture: true,
      },
    });
    if (members.length !== 2) {
      res.status(404).json({ ok: false, error: "Call participant not found" });
      return;
    }

    await streamClient.upsertUsers(
      members.map((member) => ({
        id: String(member.id),
        name: getStreamDisplayName(member),
        image: member.profilePicture?.trim() || undefined,
        role: "user",
      }))
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}
