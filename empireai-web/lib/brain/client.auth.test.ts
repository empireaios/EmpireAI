import assert from "node:assert/strict";
import { test } from "node:test";
import { login } from "./client";
import type { BrainError } from "./types";

test("login preserves failure messages and status for the form's Error catch", async (t) => {
  for (const [status, message, retryable] of [
    [401, "Invalid email or password", false],
    [503, "Authentication backend temporarily unavailable", true],
    [504, "Authentication upstream timed out", true],
  ] as const) {
    t.mock.method(globalThis, "fetch", async () => Response.json({ error: message }, { status }));
    await assert.rejects(login("fixture@example.test", "fixture-only"), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message, message);
      assert.equal((error as Error & BrainError).status, status);
      assert.equal((error as Error & BrainError).retryable, retryable);
      return true;
    });
    t.mock.restoreAll();
  }
});

test("login transport failure remains a service error, with no implicit retry", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(login("fixture@example.test", "fixture-only"), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /Authentication service unavailable/);
    assert.equal((error as Error & BrainError).status, 503);
    return true;
  });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("successful login retains its original response and same-origin session request", async (t) => {
  const result = { user: { id: "fixture-owner" } };
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json(result));
  assert.deepEqual(await login(" fixture@example.test ", "fixture-only"), result);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, "/api/auth/login");
  assert.equal(options?.credentials, "include");
  assert.equal(options?.method, "POST");
  assert.deepEqual(JSON.parse(String(options?.body)), { email: "fixture@example.test", password: "fixture-only" });
});
