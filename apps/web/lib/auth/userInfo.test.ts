import test from "node:test";
import assert from "node:assert/strict";
import { mapApiUserToAppUser } from "./userInfo";

test("mapApiUserToAppUser preserves numeric ids and profile fields", () => {
  assert.deepEqual(
    mapApiUserToAppUser({
      id: 42,
      email: "sameer@example.com",
      username: "mrsam",
      firstname: "Sameer",
      lastname: "Shah",
      identifier: "user",
      profilePicture: "https://cdn.example.com/avatar.jpg",
      userProfile: {
        bio: "Hello",
        address: "London",
      },
    }),
    {
      id: 42,
      role: undefined,
      email: "sameer@example.com",
      name: undefined,
      username: "mrsam",
      firstname: "Sameer",
      lastname: "Shah",
      userProfile: {
        bio: "Hello",
        address: "London",
      },
      identifier: "user",
      profilePicture: "https://cdn.example.com/avatar.jpg",
      status: undefined,
      bio: "Hello",
      address: "London",
    }
  );
});
