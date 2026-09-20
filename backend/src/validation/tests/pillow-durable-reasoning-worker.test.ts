import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeReasoningProxy, startDurableReasoningSweeper } from "../../runtime/pillow-durable-reasoning-worker.js";
import { createServer } from "node:http";
import { once } from "node:events";
import type { ClaimedReasoningRequest } from "../../runtime/pillow-chat-request-store.js";

const job = {
  request: { requestId: "test-request", leaseToken: 3 },
  input: { kind: "reasoning", bodyText: JSON.stringify({ message: "Reason only", sessionId: "synthetic" }), sessionToken: "synthetic-token" },
} as ClaimedReasoningRequest;

describe("durable worker completion contract", { concurrency: false }, () => {
  it("rejects production fallback kinds rather than misreporting completed capability", async () => {
    const original = globalThis.fetch;
    try {
      for (const kind of ["degraded", "degraded_useful", "command_fallback", "shadow_ceo_blocked",
        "response_contract_blocked", "durable_pending", "terminal_infrastructure", "unknown"]) {
        globalThis.fetch = async () => new Response(JSON.stringify({ result: { kind, message: "Nonempty fallback" } }), { status: 200 });
        const result = await executeReasoningProxy(job, 9999);
        assert.equal(result.ok, false, kind);
      }
    } finally { globalThis.fetch = original; }
  });
  it("permits complete reasoning and deliberate non-action constitutional responses", async () => {
    const original = globalThis.fetch;
    try {
      for (const kind of ["llm", "authority_refusal", "authority_facts", "response_contract"]) {
        globalThis.fetch = async (url, init) => {
          assert.equal(String(url), "http://127.0.0.1:9999/api/pillow/chat");
          assert.equal((init?.headers as Record<string, string>)["x-empire-pillow-request-kind"], "reasoning");
          assert.equal((init?.headers as Record<string, string>)["x-empire-pillow-fence"], "3");
          return new Response(JSON.stringify({ result: { kind, message: "Complete safe response" } }), { status: 200 });
        };
        const result = await executeReasoningProxy(job, 9999);
        assert.equal(result.ok, true, kind);
        if (result.ok) assert.equal(result.result.durableRequestId, "test-request");
      }
    } finally { globalThis.fetch = original; }
  });
  it("never promotes a contradictory pending/blocked/empty llm response", async () => {
    const original = globalThis.fetch;
    try {
      for (const extra of [{ brainCompleted: false }, { requestRemainsRunning: true },
        { degradedUsed: true }, { transportContractPassed: false }, { semanticSuccess: false },
        { constitutionalGate: { allowed: false } }, { responseContract: { code: "response_contract_blocked" } },
        { message: "" }, { message: "PILLOW_RESULT_PENDING: still waiting" }]) {
        globalThis.fetch = async () => new Response(JSON.stringify({ result: { kind: "llm", message: "Answer", ...extra } }), { status: 200 });
        assert.equal((await executeReasoningProxy(job, 9999)).ok, false);
      }
    } finally { globalThis.fetch = original; }
  });
  it("classifies authentication refusal as fatal; infrastructure as retryable", async () => {
    const original = globalThis.fetch;
    try {
      for (const [status, failureClass] of [[401, "UPSTREAM_4XX_FATAL"], [503, "UPSTREAM_5XX_RETRYABLE"], [429, "UPSTREAM_4XX_RETRYABLE"]] as const) {
        globalThis.fetch = async () => new Response("{}", { status });
        const result = await executeReasoningProxy(job, 9999);
        assert.equal(result.ok, false);
        if (!result.ok) assert.equal(result.failureClass, failureClass);
      }
    } finally { globalThis.fetch = original; }
  });
  it("rejects action replay before making any request", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    try {
      globalThis.fetch = async () => { calls++; return new Response("{}"); };
      await assert.rejects(() => executeReasoningProxy({ ...job, input: { ...job.input, kind: "side_effect" } } as unknown as ClaimedReasoningRequest, 9999),
        /side_effect_retry_forbidden/);
      assert.equal(calls, 0);
    } finally { globalThis.fetch = original; }
  });
  it("shutdown cancels an in-flight real HTTP request without acknowledging completion", async () => {
    const server = createServer();
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const cancellation = new AbortController();
    try {
      const requestArrived = once(server, "request");
      const result = executeReasoningProxy(job, (server.address() as { port: number }).port, 200_000, cancellation.signal);
      await requestArrived;
      cancellation.abort();
      const attempt = await result;
      assert.equal(attempt.ok, false);
      if (!attempt.ok) assert.equal(attempt.failureClass, "NETWORK");
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
  it("sweeper stop awaits its readiness probe and does not claim new work after shutdown", async () => {
    let ready!: (value: boolean) => void;
    const probe = new Promise<boolean>((resolve) => { ready = resolve; });
    const errors: unknown[] = [];
    const stop = startDurableReasoningSweeper({ owner: "shutdown-test", workerPort: 1,
      ready: () => probe, onError: (error) => errors.push(error) });
    let stopped = false;
    const stopping = stop().then(() => { stopped = true; });
    await Promise.resolve();
    assert.equal(stopped, false);
    ready(true);
    await stopping;
    assert.equal(stopped, true);
    assert.deepEqual(errors, [], "no durable store exists, so any claim after the probe would fail");
    await stop();
  });
  it("shutdown propagates an in-flight failure instead of reporting a confirmed queue drain", async () => {
    let rejectProbe!: (error: Error) => void;
    const probe = new Promise<boolean>((_resolve, reject) => { rejectProbe = reject; });
    const errors: unknown[] = [];
    const stop = startDurableReasoningSweeper({ owner: "shutdown-failure", workerPort: 1,
      ready: () => probe, onError: (error) => errors.push(error) });
    const stopping = stop();
    const failure = new Error("shutdown queue operation unavailable");
    rejectProbe(failure);
    await assert.rejects(stopping, failure);
    assert.deepEqual(errors, [failure]);
    await assert.rejects(stop(), failure);
  });
});
