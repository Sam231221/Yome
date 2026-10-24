import test from "node:test";
import assert from "node:assert/strict";
import { safeCallbackPath } from "./safeRedirect";

const origin = "https://yome-nine.vercel.app";

test("safeCallbackPath keeps same-origin absolute URLs as a path", () => {
  assert.equal(
    safeCallbackPath(`${origin}/groups/12?tab=events#top`, origin, "/dashboard"),
    "/groups/12?tab=events#top"
  );
});

test("safeCallbackPath keeps relative paths", () => {
  assert.equal(safeCallbackPath("/connections", origin, "/dashboard"), "/connections");
});

test("safeCallbackPath falls back when there is no callbackUrl", () => {
  assert.equal(safeCallbackPath(null, origin, "/dashboard"), "/dashboard");
  assert.equal(safeCallbackPath("", origin, "/dashboard"), "/dashboard");
});

test("safeCallbackPath rejects other origins, protocol-relative and script URLs", () => {
  for (const evil of [
    "https://evil.example.com/phish",
    "//evil.example.com",
    "javascript:alert(1)",
    "http://yome-nine.vercel.app/dashboard",
  ]) {
    assert.equal(safeCallbackPath(evil, origin, "/dashboard"), "/dashboard", evil);
  }
});
