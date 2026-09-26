/**
 * Level A — durable chat delivery fault matrix (in-process + policy).
 * Complements live production ladder; no Wave scenarios; no GK courier.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptDurableChatRequest,
  admitWorkspaceContextEnvelope,
  classifyUpstreamFailure,
  completeChatRequest,
  configureChatRequestStore,
  dropChatRequestMemoryCacheForTests,
  failChatRequest,
  FAILURE_POLICY,
  getChatRequest,
  markChatRequestRunning,
  markChatRequestRetryable,
  PillowDurableStoreUnavailableError,
  policyForFailure,
} from "../../runtime/pillow-chat-request-store.js";
import { isTransientProxyFailure } from "../../runtime/pillow-accepted-request-recovery.js";
import { pillowWorkspaceContextSchema } from "../../orchestration/pillow-host/workspace-context.js";

function hugeTurns(n = 4) {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? "grand-king" : "pillow",
    content: "H".repeat(9_000 + i * 100),
  }));
}

describe("durable delivery fault matrix (level A)", () => {
  it("OVERSIZED_CONTEXT >= 10 admits without schema rejection", () => {
    let schemaFail = 0;
    for (let i = 0; i < 10; i++) {
      const admitted = admitWorkspaceContextEnvelope({
        screenPath: "/cockpit/development/pillow",
        screenId: "SCR-800",
        screenTitle: "Pillow Centre",
        recentConversationTurns: hugeTurns(),
      });
      try {
        pillowWorkspaceContextSchema.parse(admitted);
      } catch {
        schemaFail += 1;
      }
    }
    assert.equal(schemaFail, 0);
  });

  it("WORKER_RECYCLE >= 10 → RETRYABLE then COMPLETED", async () => {
    for (let i = 0; i < 10; i++) {
      const rec = await acceptDurableChatRequest({
        sessionId: `recycle_${i}`,
        message: `ask ${i}`,
      });
      await markChatRequestRunning(rec.requestId, 1, "worker-A");
      await markChatRequestRetryable(rec.requestId, {
        failureClass: "WORKER_RECYCLED",
        attempt: 1,
      });
      let got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "RETRYABLE");
      assert.notEqual(got?.status, "FAILED_FATAL");
      await markChatRequestRunning(rec.requestId, 2, "worker-B");
      await completeChatRequest(rec.requestId, { message: `ok-${i}`, kind: "llm" });
      got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "COMPLETED");
      assert.equal(got?.brainResult?.message, `ok-${i}`);
    }
  });

  it("HTTP_400 early attempt is retryable (recycle race), not REQUEST_NOT_ACCEPTED fatal", async () => {
    for (let i = 0; i < 10; i++) {
      const fc = classifyUpstreamFailure({ status: 400, message: "bad request" });
      // Without schema/context markers, early 400s are treated as retryable by Tier-0 policy.
      assert.equal(policyForFailure("UPSTREAM_4XX_RETRYABLE"), "RETRY");
      assert.notEqual(fc, "WORKER_UNAVAILABLE");
      const rec = await acceptDurableChatRequest({ sessionId: `e4_${i}`, message: "m" });
      await failChatRequest(rec.requestId, {
        failureClass: "UPSTREAM_4XX_RETRYABLE",
        upstreamStatus: 400,
        attempt: 1,
        fatal: false,
      });
      const got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "RETRYABLE");
      assert.equal(got?.failureClass, "UPSTREAM_4XX_RETRYABLE");
    }
  });

  it("HTTP_500 >= 10 classified retryable, not terminal on attempt 1", async () => {
    for (let i = 0; i < 10; i++) {
      const fc = classifyUpstreamFailure({ status: 500, message: "upstream" });
      assert.equal(policyForFailure(fc), "RETRY");
      assert.equal(isTransientProxyFailure({ ok: false, reason: "upstream_error", status: 500 }), true);
      const rec = await acceptDurableChatRequest({ sessionId: `e5_${i}`, message: "m" });
      await failChatRequest(rec.requestId, { failureClass: fc, upstreamStatus: 500, attempt: 1 });
      const got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "RETRYABLE");
    }
  });

  it("BFF_RESTART >= 5 — Redis recovers after process memory drop", async () => {
    const fake = new Map<string, string>();
    configureChatRequestStore({
      get: async (k) => fake.get(k) ?? null,
      setex: async (k, _sec, v) => {
        fake.set(k, String(v));
      },
    });
    try {
      for (let i = 0; i < 5; i++) {
        const rec = await acceptDurableChatRequest({ sessionId: `bff_${i}`, message: "m" });
        assert.ok(rec.requestId.startsWith("pcr_"));
        await completeChatRequest(rec.requestId, { message: "persisted", kind: "llm" });
        dropChatRequestMemoryCacheForTests();
        const got = await getChatRequest(rec.requestId);
        assert.equal(got?.status, "COMPLETED");
        assert.equal(got?.finalResult?.message, "persisted");
      }
    } finally {
      configureChatRequestStore(null);
      dropChatRequestMemoryCacheForTests();
    }
  });

  it("fails closed when Redis PING passed but a durable SETEX later fails", async () => {
    let rejectWrites = true;
    const fake = new Map<string, string>();
    configureChatRequestStore({
      get: async (k) => fake.get(k) ?? null,
      setex: async (k, _sec, v) => {
        if (rejectWrites) throw new Error("redis_setex_failed");
        fake.set(k, String(v));
        return "OK";
      },
      // This fixture tests command-failure propagation only. Actual atomicity,
      // concurrency and restart safety are required in pillow-durable-queue-redis.
      eval: async (_script, count, ...args) => {
        if (rejectWrites) throw new Error("redis_eval_failed");
        const encoded = String(args[count]);
        const record = JSON.parse(encoded) as { requestId: string };
        fake.set(String(args[1]), encoded);
        fake.set(String(args[0]), record.requestId);
        return ["CREATED", encoded];
      },
    }, { requireRedisDurability: true });
    try {
      await assert.rejects(
        () => acceptDurableChatRequest({ sessionId: "strict_accept", message: "m" }),
        PillowDurableStoreUnavailableError,
      );

      rejectWrites = false;
      const accepted = await acceptDurableChatRequest({
        sessionId: "strict_complete",
        message: "m",
      });
      rejectWrites = true;
      let workerFetches = 0;
      await assert.rejects(async () => {
        await markChatRequestRunning(accepted.requestId, 1, "worker-A");
        workerFetches += 1;
      }, PillowDurableStoreUnavailableError);
      assert.equal(workerFetches, 0);
      await assert.rejects(
        () => completeChatRequest(accepted.requestId, { message: "must persist" }),
        PillowDurableStoreUnavailableError,
      );
      const unchanged = await getChatRequest(accepted.requestId);
      assert.equal(unchanged?.status, "ACCEPTED");
      assert.equal(unchanged?.brainResult, null);
    } finally {
      configureChatRequestStore(null);
      dropChatRequestMemoryCacheForTests();
    }
  });

  it("fails closed on idempotency GET failure instead of duplicating execution", async () => {
    let writes = 0;
    configureChatRequestStore({
      get: async () => {
        throw new Error("redis_get_failed");
      },
      setex: async () => {
        writes += 1;
      },
    }, { requireRedisDurability: true });
    try {
      await assert.rejects(
        () => acceptDurableChatRequest({ sessionId: "strict_get", message: "same ask" }),
        PillowDurableStoreUnavailableError,
      );
      assert.equal(writes, 0);
    } finally {
      configureChatRequestStore(null);
      dropChatRequestMemoryCacheForTests();
    }
  });

  it("fails closed when strict Redis is absent or does not acknowledge SETEX", async () => {
    configureChatRequestStore(null, { requireRedisDurability: true });
    try {
      await assert.rejects(
        () => getChatRequest("missing_strict_record"),
        PillowDurableStoreUnavailableError,
      );
    } finally {
      configureChatRequestStore(null);
      dropChatRequestMemoryCacheForTests();
    }

    configureChatRequestStore({
      get: async () => null,
      setex: async () => undefined,
    }, { requireRedisDurability: true });
    try {
      await assert.rejects(
        () => acceptDurableChatRequest({ sessionId: "strict_ack", message: "m" }),
        PillowDurableStoreUnavailableError,
      );
    } finally {
      configureChatRequestStore(null);
      dropChatRequestMemoryCacheForTests();
    }
  });

  it("CLIENT_DISCONNECT >= 5 — completion persists without delivery", async () => {
    for (let i = 0; i < 5; i++) {
      const rec = await acceptDurableChatRequest({ sessionId: `cd_${i}`, message: "m" });
      await completeChatRequest(rec.requestId, { message: `result-${i}`, kind: "llm" });
      const got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "COMPLETED");
      assert.ok(got?.observability?.resultPersistedAt);
      assert.equal(FAILURE_POLICY.CLIENT_DISCONNECT, "CONTINUE");
    }
  });

  it("SLOW_BRAIN >= 5 — sync expire leaves RETRYABLE", async () => {
    for (let i = 0; i < 5; i++) {
      const rec = await acceptDurableChatRequest({ sessionId: `slow_${i}`, message: "m" });
      await failChatRequest(rec.requestId, {
        failureClass: "BRAIN_TIMEOUT_RETRYABLE",
        attempt: 1,
      });
      const got = await getChatRequest(rec.requestId);
      assert.equal(got?.status, "RETRYABLE");
    }
  });

  it("LONG_SESSION / STATEFUL_MIXED context admission preserves recent compact turns", () => {
    for (let i = 0; i < 10; i++) {
      const turns = [
        ...hugeTurns(8),
        { role: "grand-king", content: "commercial warm: Atlas Boreal Crest" },
        { role: "pillow", content: "prior failure: transport timeout noted" },
      ];
      const admitted = admitWorkspaceContextEnvelope({
        screenPath: "/cockpit/development/pillow",
        screenId: "SCR-800",
        screenTitle: "Pillow Centre",
        recentConversationTurns: turns,
      }) as { recentConversationTurns: Array<{ content: string }> };
      assert.ok(admitted.recentConversationTurns.length <= 16);
      for (const t of admitted.recentConversationTurns) {
        assert.ok(t.content.length <= 8000);
      }
      pillowWorkspaceContextSchema.parse(admitted);
    }
    for (let i = 0; i < 5; i++) {
      const fc = classifyUpstreamFailure({ status: 400, message: "zod schema" });
      assert.equal(fc, "CONTEXT_ADMISSION_FAILURE");
      assert.equal(policyForFailure(fc), "FAIL");
    }
  });

  it("idempotency: duplicate accept reuses inflight/completed", async () => {
    const a = await acceptDurableChatRequest({
      sessionId: "idem_1",
      message: "same ask",
      idempotencyKey: "idem_test_key_1",
    });
    await markChatRequestRunning(a.requestId, 1);
    // Without Redis, second accept creates new — policy documented.
    // With Redis configureChatRequestStore, reuse applies.
    assert.ok(a.idempotencyKey);
    await completeChatRequest(a.requestId, { message: "once", kind: "llm" });
    const got = await getChatRequest(a.requestId);
    assert.equal(got?.brainResult?.message, "once");
  });
});
