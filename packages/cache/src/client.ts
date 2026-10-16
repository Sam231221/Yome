import { Redis } from "ioredis";

let sharedClient: Redis | undefined;

function buildClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required to use @repo/cache");
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  // Every call site wraps its own commands in try/catch for degraded-mode behavior
  // (presence reads return empty, rate limiting fails open) — this handler only exists so
  // an unhandled "error" event between calls doesn't crash the process. Redis is never the
  // system of record here; losing it degrades the feature, it must never take the service down.
  client.on("error", () => {});
  return client;
}

/**
 * Lazily creates (once per process) and returns the shared Redis client used for ordinary
 * commands (presence, rate limiting). Must only be called from inside a function body, never
 * at module load time — `REDIS_URL` is loaded by each service's own `dotenv.config()` call in
 * `index.ts`, which runs after that service's other modules have already been imported (ESM
 * import hoisting), so a top-level call here would capture `undefined` on every cold start.
 * The same hazard B10 fixed for `GATEWAY_SHARED_TOKEN`/`STREAM_SECRET_KEY`.
 */
export function getRedisClient(): Redis {
  if (!sharedClient) {
    sharedClient = buildClient();
  }
  return sharedClient;
}

/** A fresh, independent connection — for Socket.IO's Redis adapter, which needs its own
 * pub/sub clients that never share a command queue with ordinary commands (a client blocked
 * on SUBSCRIBE can't run other commands). Callers typically get the second client via
 * `.duplicate()` on the first rather than calling this twice. */
export function createRedisConnection(): Redis {
  return buildClient();
}
