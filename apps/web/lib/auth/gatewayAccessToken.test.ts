import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import axios, { type AxiosAdapter } from "axios";
import { HOST } from "@/utils/ApiRoutes";

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const fakeToken = (expSeconds: number) =>
  `${base64url({ alg: "HS256" })}.${base64url({ sub: "7", exp: expSeconds })}.sig`;

let tokenRequests = 0;
const nextToken = fakeToken(Math.floor(Date.now() / 1000) + 300);

// Captures the headers axios would send, without any network access.
const captureAdapter: AxiosAdapter = async (config) => ({
  data: { authorization: config.headers.get("Authorization") ?? null },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
});

before(async () => {
  (globalThis as { window?: unknown }).window = globalThis;
  globalThis.fetch = (async () => {
    tokenRequests += 1;
    return new Response(JSON.stringify({ token: nextToken }), { status: 200 });
  }) as typeof fetch;
  const { installGatewayAuthInterceptor } = await import("./gatewayAccessToken");
  installGatewayAuthInterceptor();
  axios.defaults.adapter = captureAdapter;
});

describe("gateway auth interceptor", () => {
  test("adds the bearer token to gateway requests and fetches it only once for concurrent calls", async () => {
    const [a, b] = await Promise.all([
      axios.get(`${HOST}/api/user/dashboard`),
      axios.post(`${HOST}/api/auth/get-user`, { email: "a@b.c" }),
    ]);
    assert.equal(a.data.authorization, `Bearer ${nextToken}`);
    assert.equal(b.data.authorization, `Bearer ${nextToken}`);
    assert.equal(tokenRequests, 1);
  });

  test("reuses the cached token while it is fresh", async () => {
    await axios.get(`${HOST}/api/user/connections`);
    assert.equal(tokenRequests, 1);
  });

  test("leaves non-gateway requests alone", async () => {
    const res = await axios.get("/api/auth/session");
    assert.equal(res.data.authorization, null);
  });

  test("keeps an Authorization header the caller set explicitly", async () => {
    const res = await axios.get(`${HOST}/api/x`, { headers: { Authorization: "Bearer mine" } });
    assert.equal(res.data.authorization, "Bearer mine");
  });
});
