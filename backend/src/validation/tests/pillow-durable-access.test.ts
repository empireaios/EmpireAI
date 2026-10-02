import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import Fastify from "fastify";
import { InMemorySessionStore } from "../../auth/session-store.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import { registerTier0DurableReadRoutes, registerTier0DurabilityErrorHandler, classifyTier0PillowPath } from "../../runtime/tier0-isolated-primary.js";
import { registerTier0LoginRoute, createSharedSessionStoreGuard } from "../../runtime/tier0-isolated-primary.js";
import { env } from "../../config/env.js";
import { acceptDurableChatRequest, completeChatRequest, configureChatRequestStore,
  dropChatRequestMemoryCacheForTests, getChatRequest } from "../../runtime/pillow-chat-request-store.js";
import { recordDeliveryForensic } from "../../runtime/pillow-delivery-forensics.js";

describe("durable request HTTP owner/workspace isolation", () => {
  const app = Fastify();
  const sessions = new InMemorySessionStore();
  let ownerToken: string;
  let otherOwnerToken: string;
  let otherWorkspaceToken: string;
  let operatorToken: string;
  let requestId: string;
  before(async () => {
    configureChatRequestStore(null); dropChatRequestMemoryCacheForTests();
    const user = { id: "king-a", email: "a@example.com", name: "A", role: "founder" as const, workspaceId: "workspace-a" };
    ownerToken = (await sessions.create(user)).token;
    otherOwnerToken = (await sessions.create({ ...user, id: "king-b" })).token;
    otherWorkspaceToken = (await sessions.create({ ...user, workspaceId: "workspace-b" })).token;
    operatorToken = (await sessions.create({ ...user, role: "operator" })).token;
    const request = await acceptDurableChatRequest({ sessionId: "chat-a", message: "Private owner question",
      ownerId: user.id, workspaceId: user.workspaceId });
    requestId = request.requestId;
    await completeChatRequest(requestId, { message: "Private owner answer", kind: "llm" });
    recordDeliveryForensic({ traceId: "trace-private", requestId, sessionId: "chat-a", ts: new Date().toISOString(),
      acceptedAt: Date.now(), requestPreview: "Private owner question", requestHash: "test", sessionClass: "fresh",
      brainStarted: true, brainCompleted: true, brainOutputNonempty: true, brainOutputLength: 20, brainOutputHash: "test",
      brainDurationMs: 1, shellDurationMs: 1, deliveryClass: "BRAIN_ANSWER", failureClass: "NONE", upstreamStatus: 200,
      recoveryAttempts: 1, terminalReason: null, deploymentId: "synthetic-test" });
    registerTier0DurabilityErrorHandler(app);
    registerTier0DurableReadRoutes(app, createAuthMiddleware(sessions));
    await app.ready();
  });
  after(async () => { await app.close(); configureChatRequestStore(null); dropChatRequestMemoryCacheForTests(); });

  it("rejects unauthenticated result, list, and forensic reads", async () => {
    for (const url of [`/api/pillow/chat-request/${requestId}`, "/api/pillow/chat-requests", "/api/pillow/delivery-forensics"]) {
      const response = await app.inject({ method: "GET", url });
      assert.equal(response.statusCode, 401);
      assert.ok(!response.body.includes("Private owner"));
    }
  });
  it("foreign users/workspaces receive 404 and cannot mutate delivered state", async () => {
    for (const token of [otherOwnerToken, otherWorkspaceToken]) {
      const response = await app.inject({ method: "GET", url: `/api/pillow/chat-request/${requestId}`,
        headers: { authorization: `Bearer ${token}` } });
      assert.equal(response.statusCode, 404);
      assert.ok(!response.body.includes("Private owner"));
    }
    assert.equal((await getChatRequest(requestId))?.deliveryState, "NOT_STARTED");
  });
  it("filters both list and forensic responses without leaking global dashboards", async () => {
    for (const token of [otherOwnerToken, otherWorkspaceToken]) {
      for (const url of ["/api/pillow/chat-requests", "/api/pillow/delivery-forensics"]) {
        const response = await app.inject({ method: "GET", url, headers: { authorization: `Bearer ${token}` } });
        assert.equal(response.statusCode, 200);
        assert.deepEqual(response.json().rows, []);
        assert.ok(!response.body.includes("Private owner"));
        assert.equal(response.json().dashboard, undefined);
      }
    }
  });
  it("denies authenticated non-founder/operator access", async () => {
    const response = await app.inject({ method: "GET", url: `/api/pillow/chat-request/${requestId}`,
      headers: { authorization: `Bearer ${operatorToken}` } });
    assert.equal(response.statusCode, 403);
  });
  it("owner retrieves a genuine answer and sees only own diagnostics", async () => {
    const response = await app.inject({ method: "GET", url: `/api/pillow/chat-request/${requestId}`,
      headers: { authorization: `Bearer ${ownerToken}` } });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().request.finalResult.message, "Private owner answer");
    assert.equal((await getChatRequest(requestId))?.deliveryState, "RETRIEVED");
    for (const url of ["/api/pillow/chat-requests", "/api/pillow/delivery-forensics"]) {
      const result = await app.inject({ method: "GET", url, headers: { authorization: `Bearer ${ownerToken}` } });
      assert.equal(result.json().rows.length, 1);
    }
  });
});

describe("Tier-0 encoded Pillow route containment", () => {
  it("rejects aliases that Fastify would decode into ordinary worker chat", async () => {
    const worker = Fastify();
    let actionCapableCalls = 0;
    worker.post("/api/pillow/chat", async () => { actionCapableCalls++; return { dangerous: "ordinary chat reached" }; });
    worker.post("/api/pillow/chat/stream", async () => { actionCapableCalls++; return { dangerous: "stream reached" }; });
    const primary = Fastify();
    primary.setNotFoundHandler(async (request, reply) => {
      const kind = classifyTier0PillowPath(request.url);
      if (kind === "reject") return reply.code(400).send({ code: "PILLOW_NONCANONICAL_PATH" });
      if (kind === "stream") return reply.code(503).send({ code: "PILLOW_STREAM_DURABILITY_REQUIRED" });
      if (kind === "chat") return reply.code(202).send({ kind: "durable_pending" });
      const response = await worker.inject({ method: "POST", url: request.url });
      return reply.code(response.statusCode).send(response.body);
    });
    try {
      assert.equal((await worker.inject({ method: "POST", url: "/api/pillow/%63hat" })).statusCode, 200);
      actionCapableCalls = 0;
      for (const url of ["/api/pillow/%63hat", "/%61pi/pillow/chat", "/api/pillow/chat/%73tream",
        "/api/pillow/%2563hat", "/api/pillow/chat/", "/api/pillow/chat%2Fstream"]) {
        assert.equal((await primary.inject({ method: "POST", url })).statusCode, 400, url);
      }
      assert.equal((await primary.inject({ method: "POST", url: "/api/pillow/chat?audit=1" })).statusCode, 202);
      // The HTTP client normalizes dot segments before Fastify sees this URL.
      assert.equal((await primary.inject({ method: "POST", url: "/api/pillow/../pillow/chat" })).statusCode, 202);
      assert.equal((await primary.inject({ method: "POST", url: "/api/pillow/chat/stream" })).statusCode, 503);
      assert.equal(actionCapableCalls, 0);
    } finally { await primary.close(); await worker.close(); }
  });
});

describe("Tier-0 production bootstrap credential boundary", () => {
  it("actual login route fails closed before issuing sessions for either unsafe account", async () => {
    const original = { nodeEnv: env.NODE_ENV, founder: env.FOUNDER_PASSWORD, admin: env.ADMIN_PASSWORD,
      railway: process.env.RAILWAY_DEPLOYMENT_ID };
    const app = Fastify();
    const sessions = new InMemorySessionStore();
    let issued = 0;
    sessions.create = async () => { issued++; throw new Error("session must not be created"); };
    registerTier0DurabilityErrorHandler(app);
    registerTier0LoginRoute(app, sessions, createSharedSessionStoreGuard(async () => true));
    try {
      for (const productionViaRailway of [false, true]) {
        env.NODE_ENV = productionViaRailway ? "development" : "production";
        if (productionViaRailway) process.env.RAILWAY_DEPLOYMENT_ID = "synthetic-deployment";
        else delete process.env.RAILWAY_DEPLOYMENT_ID;
        for (const unsafe of ["founder", "admin"]) {
          env.FOUNDER_PASSWORD = unsafe === "founder" ? "EmpireAI2026!" : "synthetic-configured-founder";
          env.ADMIN_PASSWORD = unsafe === "admin" ? "EmpireAI2026!" : "synthetic-configured-admin";
          const response = await app.inject({ method: "POST", url: "/auth/login",
            payload: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD } });
          assert.equal(response.statusCode, 503);
          assert.equal(response.json().code, "BOOTSTRAP_CREDENTIALS_UNSAFE");
          assert.equal(response.headers["set-cookie"], undefined);
          assert.equal(response.body.includes("EmpireAI2026!"), false);
        }
      }
      assert.equal(issued, 0);
    } finally {
      env.NODE_ENV = original.nodeEnv; env.FOUNDER_PASSWORD = original.founder; env.ADMIN_PASSWORD = original.admin;
      if (original.railway === undefined) delete process.env.RAILWAY_DEPLOYMENT_ID;
      else process.env.RAILWAY_DEPLOYMENT_ID = original.railway;
      await app.close();
    }
  });
});
