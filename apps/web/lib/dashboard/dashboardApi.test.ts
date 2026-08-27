import test from "node:test";
import assert from "node:assert/strict";
import {
  getSuggestedUserName,
  normalizeSuggestedGroup,
  normalizeSuggestedUser,
} from "./dashboardApi";

test("getSuggestedUserName prefers full name, then name, then username", () => {
  assert.equal(
    getSuggestedUserName({
      id: 1,
      firstname: "Sameer",
      lastname: "Shah",
    }),
    "Sameer Shah"
  );

  assert.equal(
    getSuggestedUserName({
      id: 2,
      name: "Fallback Name",
    }),
    "Fallback Name"
  );

  assert.equal(
    getSuggestedUserName({
      id: 3,
      username: "mrsam",
    }),
    "mrsam"
  );
});

test("normalizeSuggestedUser returns stable dashboard suggestion data", () => {
  assert.deepEqual(
    normalizeSuggestedUser({
      id: 7,
      firstname: "Ava",
      lastname: "Stone",
      role: "MENTOR",
      profilePicture: "",
    }),
    {
      id: 7,
      name: "Ava Stone",
      subtitle: "mentor on Yome",
      profilePicture: "/avatars/userprofile.png",
    }
  );
});

test("normalizeSuggestedGroup supplies safe display fallbacks", () => {
  assert.deepEqual(
    normalizeSuggestedGroup({
      id: "group-123",
      name: "",
      about: "",
      thumbnail: "",
    }),
    {
      id: "group-123",
      name: "Untitled group",
      about: "Community group on Yome",
      thumbnail: "/avatars/groupprofile.png",
    }
  );
});
