import test from "node:test";
import assert from "node:assert/strict";
import { getClientErrorMessage } from "./clientErrors";

test("getClientErrorMessage prefers backend error payload messages", () => {
  const error = {
    isAxiosError: true,
    response: {
      data: {
        error: "Username is already taken.",
      },
    },
    message: "Request failed with status code 409",
  };

  assert.equal(
    getClientErrorMessage(error),
    "Username is already taken."
  );
});

test("getClientErrorMessage falls back to axios message when response payload is absent", () => {
  const error = {
    isAxiosError: true,
    message: "Network Error",
  };

  assert.equal(getClientErrorMessage(error), "Network Error");
});

test("getClientErrorMessage falls back to provided default message", () => {
  assert.equal(
    getClientErrorMessage(null, "Unable to load data."),
    "Unable to load data."
  );
});
