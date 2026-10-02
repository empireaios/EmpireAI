import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Fastify from "fastify";
import { SessionStore, SessionStoreUnavailableError } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import type { RedisClient } from "../../config/redis-client.js";
import type { SessionUser } from "../../auth/permissions.js";

const user: SessionUser = {
  id: "isolated-test-owner", email: "owner@example.test", name: "Test owner",
  role: "founder", workspaceId: "isolated-test-workspace",
};

function client(overrides: Record<string, unknown> = {}) {
  return {
    setex: async () => "OK", get: async () => null, del: async () => 1,
    ...overrides,
  } as unknown as Pick<RedisClient, "get" | "setex" | "del">;
}

describe("shared session command failures fail closed", () => {
  it("does not issue a session when a post-PING SETEX fails", async () => {
    const store = new SessionStore(client({ setex: async () => { throw new Error("NOPERM"); } }));
    await assert.rejects(store.create(user), SessionStoreUnavailableError);
  });
  it("requires the exact Redis write acknowledgement", async () => {
    const store = new SessionStore(client({ setex: async () => null }));
    await assert.rejects(store.create(user), SessionStoreUnavailableError);
  });
  it("wraps failed GET without pretending the token is invalid", async () => {
    const store = new SessionStore(client({ get: async () => { throw new Error("connection lost"); } }));
    await assert.rejects(store.get("test-token"), SessionStoreUnavailableError);
  });
  it("wraps corrupted durable records instead of accepting them", async () => {
    const store = new SessionStore(client({ get: async () => "{bad-json" }));
    await assert.rejects(store.get("test-token"), SessionStoreUnavailableError);
  });
  it("rejects structurally invalid valid-JSON records", async () => {
    for (const invalid of [{}, { ...user, token: "test-token" }, { ...user, role: "grand-king" }]) {
      const store = new SessionStore(client({ get: async () => JSON.stringify(invalid) }));
      await assert.rejects(store.get("test-token"), SessionStoreUnavailableError);
    }
  });
  it("requires token identity and a non-expired session", async () => {
    const session = { ...user, token: "test-token", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
    const store = new SessionStore(client({ get: async () => JSON.stringify(session) }));
    assert.equal((await store.get("test-token"))?.workspaceId, user.workspaceId);
    await assert.rejects(store.get("another-token"), SessionStoreUnavailableError);
    session.expiresAt = "2020-01-01T00:00:00.000Z";
    assert.equal(await store.get("test-token"), null);
  });
  it("does not report successful logout when DEL fails", async () => {
    const store = new SessionStore(client({ del: async () => { throw new Error("NOPERM"); } }));
    await assert.rejects(store.destroy("test-token"), SessionStoreUnavailableError);
  });
  it("accepts already-absent logout but not an unacknowledged delete", async () => {
    await new SessionStore(client({ del: async () => 0 })).destroy("test-token");
    await assert.rejects(new SessionStore(client({ del: async () => undefined })).destroy("test-token"), SessionStoreUnavailableError);
  });
  it("returns typed 503 and never executes a protected handler on failed GET", async () => {
    const app = Fastify();
    let executions = 0;
    const store = new SessionStore(client({ get: async () => { throw new Error("private provider detail"); } }));
    app.get("/protected", { preHandler: createAuthMiddleware(store) }, async () => { executions++; return { ok: true }; });
    try {
      const response = await app.inject({ method: "GET", url: "/protected", headers: { authorization: "Bearer test-token" } });
      assert.equal(response.statusCode, 503);
      assert.equal(response.json().code, "SHARED_SESSION_STORE_UNAVAILABLE");
      assert.equal(response.json().retryable, true);
      assert.equal(response.body.includes("private provider detail"), false);
      assert.equal(executions, 0);
    } finally { await app.close(); }
  });
});
