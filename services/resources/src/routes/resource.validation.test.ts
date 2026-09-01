import test from "node:test";
import assert from "node:assert/strict";
import {
  createResourceSchema,
  listResourcesSchema,
  resourceIdParamsSchema,
} from "./resource.validation.js";

test("listResourcesSchema accepts supported filters and pagination", () => {
  const result = listResourcesSchema.query.parse({
    search: "calculus",
    subject: "Mathematics",
    type: "PDF",
    level: "Undergraduate",
    limit: "12",
    cursor: "abc",
    sort: "saved",
  });

  assert.equal(result.limit, 12);
  assert.equal(result.sort, "saved");
});

test("listResourcesSchema rejects bad pagination", () => {
  assert.throws(() =>
    listResourcesSchema.query.parse({
      limit: "200",
    })
  );
});

test("createResourceSchema requires a usable URL", () => {
  assert.throws(() =>
    createResourceSchema.body.parse({
      title: "A resource",
      subject: "Science",
      topic: "Physics",
      level: "A Level",
      type: "PDF",
      tone: "teal",
      description: "A useful physics resource.",
    })
  );
});

test("createResourceSchema accepts URL-backed resource payloads", () => {
  const result = createResourceSchema.body.parse({
    title: "Python data structures reference",
    subject: "Technology",
    topic: "Programming",
    level: "Beginner",
    type: "GUIDE",
    tone: "blue",
    description: "A useful programming guide.",
    externalUrl: "https://example.com/python",
  });

  assert.equal(result.externalUrl, "https://example.com/python");
});

test("resourceIdParamsSchema accepts slugs and UUIDs", () => {
  assert.equal(
    resourceIdParamsSchema.params.parse({
      id: "visual-guide-to-integration-techniques",
    }).id,
    "visual-guide-to-integration-techniques"
  );
  assert.equal(
    resourceIdParamsSchema.params.parse({
      id: "2c16a4d0-ae7f-4f85-8a29-79774e06dbf9",
    }).id,
    "2c16a4d0-ae7f-4f85-8a29-79774e06dbf9"
  );
});
