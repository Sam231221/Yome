import test from "node:test";
import assert from "node:assert/strict";
import { timeAgo } from "./time";

const now = new Date("2026-10-15T12:00:00.000Z").getTime();

test("timeAgo formats recent and older timestamps", () => {
  assert.equal(timeAgo("2026-10-15T11:59:50.000Z", now), "just now");
  assert.equal(timeAgo("2026-10-15T11:30:00.000Z", now), "30m ago");
  assert.equal(timeAgo("2026-10-15T09:00:00.000Z", now), "3h ago");
  assert.equal(timeAgo("2026-10-13T12:00:00.000Z", now), "2d ago");
  assert.equal(timeAgo("not-a-date", now), "");
});
