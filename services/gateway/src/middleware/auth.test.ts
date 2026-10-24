import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { createAuthMiddleware } from "./auth.js";
import type { GatewayRequest } from "../types.js";

const secret = "test-nextauth-secret";
const auth = createAuthMiddleware({
  authEnabled: true,
  sharedGatewayToken: "shared-token",
  nextAuthSecret: secret,
});

async function run(headers: Record<string, string>) {
  const req = { path: "/api/user/dashboard", headers } as unknown as Request;
  let status = 200;
  let nextCalled = false;
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json() {
      return this;
    },
  } as unknown as Response;
  await auth(req, res, (() => {
    nextCalled = true;
  }) as NextFunction);
  return { status, nextCalled, user: (req as GatewayRequest).gatewayUser };
}

describe("gateway auth middleware", () => {
  test("accepts the web app's short-lived bearer token and sets the user", async () => {
    const token = jwt.sign({ sub: "42", email: "a@b.c" }, secret, { expiresIn: "5m" });
    const result = await run({ authorization: `Bearer ${token}` });
    expect(result.nextCalled).toBe(true);
    expect(result.user).toEqual({ id: "42", email: "a@b.c" });
  });

  test("rejects an expired bearer token", async () => {
    const token = jwt.sign({ sub: "42", exp: Math.floor(Date.now() / 1000) - 10 }, secret);
    const result = await run({ authorization: `Bearer ${token}` });
    expect(result.nextCalled).toBe(false);
    expect(result.status).toBe(401);
  });

  test("rejects a bearer token signed with another secret", async () => {
    const token = jwt.sign({ sub: "42" }, "wrong-secret", { expiresIn: "5m" });
    const result = await run({ authorization: `Bearer ${token}` });
    expect(result.nextCalled).toBe(false);
    expect(result.status).toBe(401);
  });

  test("rejects a token without a user id", async () => {
    const token = jwt.sign({ email: "a@b.c" }, secret, { expiresIn: "5m" });
    const result = await run({ authorization: `Bearer ${token}` });
    expect(result.nextCalled).toBe(false);
  });

  test("still accepts the shared service token without setting a user", async () => {
    const result = await run({ authorization: "Bearer shared-token" });
    expect(result.nextCalled).toBe(true);
    expect(result.user).toBeUndefined();
  });

  test("returns 401 when no token is sent", async () => {
    const result = await run({});
    expect(result.nextCalled).toBe(false);
    expect(result.status).toBe(401);
  });
});
