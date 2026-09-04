import test from "node:test";
import assert from "node:assert/strict";
import {
  compactNumber,
  formatCount,
  getAuthenticatedUserId,
  isUuid,
  slugify,
} from "./helpers.js";

test("getAuthenticatedUserId reads x-user-id, or null", () => {
  assert.equal(getAuthenticatedUserId({ headers: { "x-user-id": "42" } }), 42);
  assert.equal(
    getAuthenticatedUserId({ headers: { "x-user-id": ["7", "9"] } }),
    7,
  );
  assert.equal(getAuthenticatedUserId({ headers: {} }), null);
  assert.equal(
    getAuthenticatedUserId({ headers: { "x-user-id": "abc" } }),
    null,
  );
});

test("slugify matches the previous per-service implementation", () => {
  assert.equal(slugify("  Hello, World!  "), "hello-world");
  assert.equal(slugify("A/B_C"), "a-b-c");
  assert.equal(slugify("--trim--"), "trim");
  assert.equal(slugify("x".repeat(200)).length, 120);
});

test("isUuid accepts v1-5 UUIDs, rejects slugs", () => {
  assert.equal(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301"), true);
  assert.equal(isUuid("not-a-uuid"), false);
  assert.equal(isUuid("calculus-circle"), false);
});

test("compactNumber / formatCount match the previous implementation", () => {
  assert.equal(compactNumber(999), "999");
  assert.equal(compactNumber(1200), "1.2k");
  assert.equal(compactNumber(12345), "12k");
  assert.equal(formatCount(1, "member"), "1 member");
  assert.equal(formatCount(3, "member"), "3 members");
  assert.equal(formatCount(2400, "save"), "2.4k saves");
});
