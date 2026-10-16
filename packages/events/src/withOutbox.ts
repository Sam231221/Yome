import getPrismaInstance from "@repo/database";

type PrismaClient = ReturnType<typeof getPrismaInstance>;
/** The interactive-transaction client Prisma passes into `$transaction(async (tx) => ...)`.
 * Structurally close enough to `PrismaClient` for calling model methods (`tx.group.create`,
 * `tx.outboxEvent.create`, ...) — the same loose-typing convention already used elsewhere in
 * this codebase (see `resources.controller.ts`'s own `TransactionClient` alias). */
export type TransactionClient = PrismaClient;

export type OutboxEventInput<TPayload = unknown> = {
  type: string;
  subject: string;
  producer: string;
  payload: TPayload;
  version?: number;
  correlationId?: string;
  causationId?: string;
  actorUserId?: number;
};

/**
 * The single hard rule of the outbox pattern (event-architecture-plan.md): a domain event is
 * written in the *same* database transaction as the state change it describes. This helper is
 * the only sanctioned way to do that — never call `tx.outboxEvent.create` by hand outside of
 * it, and never publish to Redis directly inside a request handler.
 *
 * `fn` performs the domain writes and returns a result; `buildEvents` derives zero, one, or
 * several outbox rows from that result (a `null`/empty array means "nothing happened worth
 * publishing" — e.g. `saveResource` when the resource was already saved, a no-op). If `fn` or
 * `buildEvents` throws, Prisma rolls back the whole transaction: no domain write and no
 * outbox row survive. This is the property the batch's own required test proves.
 */
export async function withOutbox<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
  buildEvents: (result: T) => OutboxEventInput | OutboxEventInput[] | null | undefined
): Promise<T> {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const result = await fn(tx);
    const built = buildEvents(result);
    const events = built ? (Array.isArray(built) ? built : [built]) : [];

    for (const event of events) {
      await tx.outboxEvent.create({
        data: {
          type: event.type,
          subject: event.subject,
          producer: event.producer,
          // OutboxEvent.payload is a Prisma Json column; @repo/database doesn't expose the
          // generated Prisma.InputJsonValue type publicly (only getPrismaInstance is
          // exported), and every payload here is already a plain JSON-serializable object
          // validated against a zod schema in @repo/contracts before this point.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: event.payload as any,
          version: event.version ?? 1,
          correlationId: event.correlationId,
          causationId: event.causationId,
          actorUserId: event.actorUserId,
        },
      });
    }

    return result;
  });
}
