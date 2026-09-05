import test from "node:test";
import assert from "node:assert/strict";
import {
  addOnlineUserSocket,
  getOnlineUserIds,
  getOnlineUserSockets,
  isUserOnline,
  onlineUsers,
  removeOnlineUserSocket,
  removeSocketFromOnlineUsers,
} from "./online-users.js";

test("online user state keeps multiple sockets per user", () => {
  onlineUsers.clear();

  addOnlineUserSocket("7", "socket-a");
  addOnlineUserSocket("7", "socket-b");
  addOnlineUserSocket("12", "socket-c");

  assert.deepEqual(getOnlineUserSockets("7").sort(), ["socket-a", "socket-b"]);
  assert.deepEqual(getOnlineUserIds().sort((left, right) => left - right), [
    7,
    12,
  ]);
  assert.equal(isUserOnline(7), true);

  removeOnlineUserSocket("7", "socket-a");
  assert.deepEqual(getOnlineUserSockets("7"), ["socket-b"]);
  assert.equal(isUserOnline(7), true);

  removeSocketFromOnlineUsers("socket-b");
  assert.deepEqual(getOnlineUserSockets("7"), []);
  assert.equal(isUserOnline(7), false);
  assert.deepEqual(getOnlineUserIds(), [12]);

  onlineUsers.clear();
});
