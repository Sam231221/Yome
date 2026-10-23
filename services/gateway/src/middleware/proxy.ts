import type { Response } from "express";
import http from "node:http";
import https from "node:https";
import { createLogger } from "@repo/service-kit";
import type { GatewayRequest } from "../types.js";
import type { RouteRule, Upstream } from "../routes/route-manifest.js";

const logger = createLogger("gateway");

/** Default per-request upstream timeout. A route can override via `RouteRule.timeoutMs`
 * (see route-manifest.ts — `/api/media` sets 30s for multipart uploads). */
const DEFAULT_TIMEOUT_MS = 5_000;

/** Idempotent methods get one retry on a connection failure or timeout — never on a real
 * HTTP response, even a 5xx one, since that's an application-level answer, not upstream
 * unavailability. POST/PUT/PATCH/DELETE never retry: there is no idempotency-key mechanism
 * yet (planned for B12), and retrying a non-idempotent write blind risks double-applying it. */
const MAX_ATTEMPTS_IDEMPOTENT = 2;
const RETRY_BASE_DELAY_MS = 100;

/** Per-upstream circuit breaker: opens after 5 consecutive failures, half-opens for one
 * probe request after 30s, closes again on that probe's success. */
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_DURATION_MS = 30_000;

type CircuitState = "closed" | "open" | "half-open";
type Circuit = { state: CircuitState; consecutiveFailures: number; openedAt: number };
const circuits = new Map<Upstream, Circuit>();

function getCircuit(upstream: Upstream): Circuit {
  let circuit = circuits.get(upstream);
  if (!circuit) {
    circuit = { state: "closed", consecutiveFailures: 0, openedAt: 0 };
    circuits.set(upstream, circuit);
  }
  return circuit;
}

function canAttempt(circuit: Circuit): boolean {
  if (circuit.state !== "open") return true;
  if (Date.now() - circuit.openedAt < CIRCUIT_OPEN_DURATION_MS) return false;
  circuit.state = "half-open";
  return true;
}

function recordSuccess(circuit: Circuit): void {
  circuit.state = "closed";
  circuit.consecutiveFailures = 0;
}

function recordFailure(circuit: Circuit): void {
  circuit.consecutiveFailures += 1;
  if (circuit.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.state = "open";
    circuit.openedAt = Date.now();
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const gatewayOwnedHeaders = new Set([
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
]);

function copyHeaders(
  inHeaders: Record<string, string | string[] | undefined>,
  setHeader: (k: string, v: string) => void
): void {
  for (const key of Object.keys(inHeaders)) {
    const lower = key.toLowerCase();
    if (hopByHop.has(lower) || gatewayOwnedHeaders.has(lower)) continue;
    const value = inHeaders[key];
    if (value !== undefined && value !== "")
      setHeader(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
}

const readBody = (req: GatewayRequest): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

type UpstreamOutcome =
  | {
      kind: "response";
      statusCode: number;
      headers: Record<string, string | string[] | undefined>;
      body: Buffer;
    }
  | { kind: "timeout" }
  | { kind: "network_error"; message: string };

function performUpstreamRequest(
  target: URL,
  method: string,
  headers: Record<string, string>,
  body: Buffer | undefined,
  timeoutMs: number
): Promise<UpstreamOutcome> {
  return new Promise((resolve) => {
    let timedOut = false;
    const lib = target.protocol === "https:" ? https : http;
    const forwardReq = lib.request(target, { method, headers }, (upstream) => {
      const chunks: Buffer[] = [];
      upstream.on("data", (chunk: Buffer) => chunks.push(chunk));
      upstream.on("end", () => {
        resolve({
          kind: "response",
          statusCode: upstream.statusCode ?? 500,
          headers: upstream.headers as Record<string, string | string[] | undefined>,
          body: Buffer.concat(chunks),
        });
      });
      upstream.on("error", (error: Error) => {
        resolve({ kind: "network_error", message: error.message });
      });
    });

    forwardReq.setTimeout(timeoutMs, () => {
      timedOut = true;
      forwardReq.destroy();
    });

    forwardReq.on("error", (error: Error & { cause?: unknown }) => {
      if (timedOut) {
        resolve({ kind: "timeout" });
        return;
      }
      const details = error.cause
        ? `${error.message} (${(error.cause as Error).message ?? String(error.cause)})`
        : error.message;
      resolve({ kind: "network_error", message: details });
    });

    if (body !== undefined && body.length > 0) {
      forwardReq.end(body);
    } else {
      forwardReq.end();
    }
  });
}

/**
 * Proxies one request to its resolved upstream, with a per-route timeout, one retry for
 * idempotent methods on a connection failure or timeout, and a per-upstream circuit
 * breaker. The upstream response is buffered fully (every response here is small JSON —
 * large payloads in this system only flow on the *request* side, e.g. media uploads) rather
 * than piped, because a piped response can't be retried once streaming has started.
 */
export async function proxyRequest(
  req: GatewayRequest,
  res: Response,
  rule: RouteRule,
  upstreamBase: string,
  sharedGatewayToken: string
): Promise<void> {
  const incomingPath = req.originalUrl.replace(rule.rewriteFrom ?? "", "");
  const target = new URL(`${upstreamBase}${rule.rewriteTo ?? ""}${incomingPath}`);
  const timeoutMs = rule.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const circuit = getCircuit(rule.upstream);
  if (!canAttempt(circuit)) {
    res.status(503).json({
      ok: false,
      error: "circuit_open",
      details: `Upstream "${rule.upstream}" is temporarily unavailable`,
      requestId: req.requestId,
    });
    return;
  }

  const forwardHeaders: Record<string, string> = {
    ...(req.headers as Record<string, string>),
    "x-request-id": req.requestId,
    "x-internal-token": sharedGatewayToken,
    host: target.host,
    connection: "close",
  };
  if (req.gatewayUser) {
    forwardHeaders["x-user-id"] = req.gatewayUser.id;
    if (req.gatewayUser.email) forwardHeaders["x-user-email"] = req.gatewayUser.email;
  }

  const isIdempotent = req.method === "GET" || req.method === "HEAD";
  const maxAttempts = isIdempotent ? MAX_ATTEMPTS_IDEMPOTENT : 1;

  let body: Buffer | undefined;
  if (!isIdempotent) {
    body = req.rawBody ?? (await readBody(req).catch(() => Buffer.alloc(0)));
  }

  let outcome: UpstreamOutcome = { kind: "network_error", message: "no attempt made" };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    outcome = await performUpstreamRequest(
      target,
      req.method,
      forwardHeaders,
      body,
      timeoutMs
    );
    const succeeded = outcome.kind === "response" && outcome.statusCode < 500;
    if (succeeded) {
      recordSuccess(circuit);
      break;
    }
    if (attempt < maxAttempts) {
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * RETRY_BASE_DELAY_MS;
      logger.info("Retrying upstream request", {
        requestId: req.requestId,
        attempt: attempt + 1,
        upstream: rule.upstream,
        path: req.originalUrl,
      });
      await sleep(delay);
    }
  }

  if (outcome.kind === "response") {
    if (outcome.statusCode >= 500) recordFailure(circuit);
    copyHeaders(outcome.headers, (k, v) => res.setHeader(k, v));
    res.status(outcome.statusCode);
    res.end(outcome.body);
    logger.info("Forwarded upstream request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: outcome.statusCode,
      upstream: upstreamBase,
    });
    return;
  }

  recordFailure(circuit);

  if (outcome.kind === "timeout") {
    logger.error("Upstream request timed out", new Error("upstream_timeout"), {
      requestId: req.requestId,
      path: req.originalUrl,
      target: target.href,
      timeoutMs,
    });
    res.status(504).json({
      ok: false,
      error: "upstream_timeout",
      details: `Upstream did not respond within ${timeoutMs}ms`,
      requestId: req.requestId,
    });
    return;
  }

  logger.error("Upstream request failed", new Error(outcome.message), {
    requestId: req.requestId,
    path: req.originalUrl,
    target: target.href,
    error: outcome.message,
  });
  if (!res.headersSent) {
    res.status(502).json({
      ok: false,
      error: "upstream_error",
      details: outcome.message,
      requestId: req.requestId,
    });
  }
}
