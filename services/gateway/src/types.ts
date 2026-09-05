import type { Request } from "express";

/** Augments Express's `Request` with the fields gateway middleware attaches as a request
 * flows through: `requestId` (assigned first), `rawBody` (captured by the JSON body parser's
 * `verify` hook, used to forward a body without re-reading the stream), and `gatewayUser`
 * (set by the auth middleware once a session is decoded). */
export interface GatewayRequest extends Request {
  requestId: string;
  rawBody?: Buffer;
  gatewayUser?: { id: string; email?: string };
}
