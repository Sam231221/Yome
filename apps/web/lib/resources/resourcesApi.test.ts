import test from "node:test";
import assert from "node:assert/strict";
import {
  formatResourceCount,
  getResourceHref,
  normalizeResource,
} from "./resourcesApi";

test("normalizeResource supplies safe fallbacks", () => {
  const resource = normalizeResource({
    id: "resource-1",
    title: "",
    saveCount: "14" as unknown as number,
    isSaved: true,
    author: { username: "mentor" },
  });

  assert.equal(resource.title, "");
  assert.equal(resource.subject, "General");
  assert.equal(resource.saveCount, 14);
  assert.equal(resource.isSaved, true);
  assert.equal(resource.isHelpful, false);
  assert.equal(resource.author.name, "mentor");
  assert.equal(resource.author.profilePicture, "/avatars/userprofile.png");
});

test("normalizeResource keeps known tones and defaults unknown tones", () => {
  assert.equal(normalizeResource({ tone: "teal" }).tone, "teal");
  assert.equal(normalizeResource({ tone: "pink" as never }).tone, "blue");
});

test("formatResourceCount compacts larger counts", () => {
  assert.equal(formatResourceCount(980), "980");
  assert.equal(formatResourceCount(1800), "1.8k");
  assert.equal(formatResourceCount(1_200_000), "1.2m");
});

test("getResourceHref prefers direct resource URLs", () => {
  const base = normalizeResource({
    id: "abc",
    slug: "abc-slug",
    externalUrl: "https://example.com/resource",
  });

  assert.equal(getResourceHref(base), "https://example.com/resource");
  assert.equal(getResourceHref({ ...base, externalUrl: null }), "/resources/abc-slug");
});
