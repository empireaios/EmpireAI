import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { buildApp } from "../../app.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import { LLMRouter } from "../../brain/llm/llm-router.js";
import { env } from "../../config/env.js";
import {
  getPillowHost,
  initializePillowHost,
  resetPillowHostSingleton,
  shutdownPillowHost,
} from "../../orchestration/pillow-host/index.js";
import { createBrainLLMAdapter } from "../../orchestration/pillow-host/brain-llm-adapter.js";
import { configureValidationEnvironment } from "../harness.js";

describe("PILLOW-016 Pillow Host Integration", () => {
  before(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetPillowHostSingleton();
  });

  after(async () => {
    await shutdownPillowHost();
    resetPillowHostSingleton();
    resetDatabaseInstance();
  });

  it("BrainLLMAdapter routes through LLMRouter without duplicate clients", () => {
    const router = new LLMRouter();
    const adapter = createBrainLLMAdapter(router);
    assert.deepEqual(adapter.listAvailableProviders(), router.listAvailable());
  });

  it("PillowHost starts, creates session, and routes chat", async () => {
    const brain = await import("../../brain/index.js").then((m) =>
      m.createBrain({ startWorkers: false, startScheduler: false }),
    );

    try {
      const host = await initializePillowHost({
        llmRouter: brain.llmRouter,
        auditLogger: brain.auditLogger,
      });

      const status = host.getStatus();
      assert.equal(status.missionId, "PILLOW-016");
      assert.ok(["Running", "Idle"].includes(status.health));
      assert.ok(status.repositoryRoot);

      const session = host.createSession("ws_pillow_validation");
      assert.ok(session.sessionId);

      const chat = await host.routePrompt({
        workspaceId: "ws_pillow_validation",
        sessionId: session.sessionId,
        message: "What is the current Journey position?",
        actor: env.FOUNDER_EMAIL,
        correlationId: "corr-pillow-host",
      });

      assert.ok(chat.message.length > 0);
      assert.ok(chat.latencyMs >= 0);
      assert.equal(chat.sessionId, session.sessionId);

      const history = host.getSession("ws_pillow_validation", session.sessionId);
      assert.ok(history);
      assert.ok(history!.conversationHistory.length >= 2);

      const logs = host.listRequestLogs({
        workspaceId: "ws_pillow_validation",
        sessionId: session.sessionId,
      });
      assert.ok(logs.length >= 1);
    } finally {
      await brain.shutdown();
    }
  });

  it("API routes respond for health, session, chat, and history", async () => {
    const empire = await buildApp({
      startWorkers: false,
      startScheduler: false,
      pillowEnabled: true,
    });

    try {
      const health = await empire.app.inject({
        method: "GET",
        url: "/api/pillow/health",
      });
      assert.equal(health.statusCode, 200);
      const healthBody = health.json() as { health: string; missionId: string };
      assert.equal(healthBody.missionId, "PILLOW-016");
      assert.ok(healthBody.health);

      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: env.FOUNDER_EMAIL,
          password: env.FOUNDER_PASSWORD,
        },
      });
      assert.equal(login.statusCode, 200);
      const cookie = login.headers["set-cookie"];
      assert.ok(cookie);

      const sessionRes = await empire.app.inject({
        method: "POST",
        url: "/api/pillow/session",
        headers: { cookie: String(cookie) },
        payload: {},
      });
      assert.equal(sessionRes.statusCode, 201);
      const sessionBody = sessionRes.json() as {
        session: { sessionId: string };
      };
      const sessionId = sessionBody.session.sessionId;

      const chatRes = await empire.app.inject({
        method: "POST",
        url: "/api/pillow/chat",
        headers: { cookie: String(cookie) },
        payload: {
          message: "Summarize EmpireAI Version 1 status briefly.",
          sessionId,
        },
      });
      assert.equal(chatRes.statusCode, 200);
      const chatBody = chatRes.json() as {
        result: { message: string; requestId: string };
      };
      assert.ok(chatBody.result.message.length > 0);
      assert.ok(chatBody.result.requestId);

      const historyRes = await empire.app.inject({
        method: "GET",
        url: `/api/pillow/history?sessionId=${sessionId}`,
        headers: { cookie: String(cookie) },
      });
      assert.equal(historyRes.statusCode, 200);
      const historyBody = historyRes.json() as { history: unknown[] };
      assert.ok(historyBody.history.length >= 2);

      const statusRes = await empire.app.inject({
        method: "GET",
        url: "/api/pillow/status",
        headers: { cookie: String(cookie) },
      });
      assert.equal(statusRes.statusCode, 200);

      const deleteRes = await empire.app.inject({
        method: "DELETE",
        url: `/api/pillow/session?sessionId=${sessionId}`,
        headers: { cookie: String(cookie) },
      });
      assert.equal(deleteRes.statusCode, 200);
    } finally {
      await empire.shutdown();
      resetPillowHostSingleton();
    }
  });

  it("PILLOW-018 chat stream emits token and done SSE events", async () => {
    const empire = await buildApp({
      startWorkers: false,
      startScheduler: false,
      pillowEnabled: true,
    });

    try {
      const login = await empire.app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
          email: env.FOUNDER_EMAIL,
          password: env.FOUNDER_PASSWORD,
        },
      });
      assert.equal(login.statusCode, 200);
      const cookie = login.headers["set-cookie"];
      assert.ok(cookie);

      const sessionRes = await empire.app.inject({
        method: "POST",
        url: "/api/pillow/session",
        headers: { cookie: String(cookie) },
        payload: {},
      });
      assert.equal(sessionRes.statusCode, 201);
      const sessionId = (sessionRes.json() as { session: { sessionId: string } }).session
        .sessionId;

      const streamRes = await empire.app.inject({
        method: "POST",
        url: "/api/pillow/chat/stream",
        headers: { cookie: String(cookie) },
        payload: {
          message: "Reply with one short sentence.",
          sessionId,
        },
      });
      assert.equal(streamRes.statusCode, 200);
      assert.match(String(streamRes.headers["content-type"]), /text\/event-stream/);

      const body = streamRes.body;
      assert.match(body, /event: started/);
      assert.match(body, /event: token/);
      assert.match(body, /event: done/);

      const doneMatch = body.match(/event: done\ndata: (.+)\n\n/);
      assert.ok(doneMatch);
      const donePayload = JSON.parse(doneMatch[1]!) as {
        result: { message: string; sessionId: string };
      };
      assert.ok(donePayload.result.message.length > 0);
      assert.equal(donePayload.result.sessionId, sessionId);
    } finally {
      await empire.shutdown();
      resetPillowHostSingleton();
    }
  });

  it("getPillowHost returns singleton", () => {
    resetPillowHostSingleton();
    const a = getPillowHost();
    const b = getPillowHost();
    assert.equal(a, b);
  });
});
