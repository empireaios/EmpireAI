import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test, type TestContext } from "node:test";
import { createPillowHostSession, retrievePillowChat, sendPillowChat, type DurablePollOptions } from "./client";
import { pendingDurableResult, resultFromDurableRecord } from "./durable-delivery";
import { mapPillowChatToAssistantResponse } from "./map-response";
import { toExecutiveChatMessage } from "./executive-surface";
import { clearPendingPillowReceipt, loadPendingPillowReceipts, savePendingPillowReceipt } from "./pending-receipts";
import { appendPillowTurn, clearPillowHostSession, loadPillowSession, savePillowSession, PILLOW_SESSION_STORAGE_KEY } from "../cockpit/pillow/pillow-session-store";

const receipt = { requestId: "pcr_saved", sessionId: "session_1" };
const input = { message: "Assess this synthetic product", sessionId: receipt.sessionId };
const answer = { kind: "llm", message: "The synthetic evidence is incomplete; keep commerce locked.", sessionId: receipt.sessionId };
const accepted = () => Response.json({ result: { ...receipt, kind: "durable_pending" } }, { status: 202 });
const record = (status: string, extra = {}) => Response.json({ ok: true, request: { ...receipt, status, ...extra } });

function transport(t: TestContext, responses: Array<() => Response | Promise<Response>>) {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  t.mock.method(globalThis, "fetch", async (path: string, init?: RequestInit) => {
    calls.push({ path, init });
    const next = responses.shift();
    assert.ok(next, "unexpected extra HTTP request");
    return next();
  });
  let time = 100;
  t.mock.method(Date, "now", () => time);
  const options: DurablePollOptions = { budgetMs: 3, pollMs: 1, wait: async (ms) => { time += ms; } };
  return { calls, options };
}

describe("Pillow durable browser delivery — never repeat accepted execution", () => {
  test("202 persists receipt before GET and delivers RUNNING/RETRYABLE/COMPLETED using one POST", async (t) => {
    let saved = false;
    const { calls, options } = transport(t, [accepted,
      () => { assert.equal(saved, true); return record("RUNNING"); },
      () => record("RETRYABLE"),
      () => record("COMPLETED", { finalResult: answer }),
    ]);
    const result = await sendPillowChat(input, { ...options, onAccepted: (got) => { assert.deepEqual(got, receipt); saved = true; } });
    assert.equal(result.message, answer.message);
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.durableRetrieved, true);
    assert.equal(result.requestRemainsRunning, false);
    assert.deepEqual(calls.map((call) => call.init?.method), ["POST", "GET", "GET", "GET"]);
    for (const call of calls.slice(1)) {
      assert.equal(call.path, `/api/pillow/chat-request/${receipt.requestId}`);
      assert.equal(call.init?.credentials, "include");
      assert.equal(call.init?.cache, "no-store");
    }
  });

  test("202 header-only receipt is sufficient to retrieve, never treated as answer", async (t) => {
    const { calls, options } = transport(t, [
      () => new Response("", { status: 202, headers: { "x-empire-pillow-request-id": receipt.requestId } }),
      () => record("COMPLETED", { brainResult: answer }),
    ]);
    const result = await sendPillowChat(input, options);
    assert.equal(result.durableRetrieved, true);
    assert.equal(calls.length, 2);
  });

  test("legacy 200 durable_pending still switches to retrieval", async (t) => {
    const { calls, options } = transport(t, [
      () => Response.json({ result: { ...receipt, kind: "durable_pending" } }),
      () => record("COMPLETED", { finalResult: answer }),
    ]);
    assert.equal((await sendPillowChat(input, options)).message, answer.message);
    assert.deepEqual(calls.map((call) => call.init?.method), ["POST", "GET"]);
  });

  test("failed transport with a durable receipt retrieves the original job", async (t) => {
    const { calls, options } = transport(t, [
      () => Response.json({}, { status: 503, headers: { "x-empire-pillow-request-id": receipt.requestId } }),
      () => record("COMPLETED", { finalResult: answer }),
    ]);
    assert.equal((await sendPillowChat(input, options)).status, "COMPLETED");
    assert.equal(calls.filter((call) => call.init?.method === "POST").length, 1);
  });

  for (const status of ["FAILED_FATAL", "FAILED"]) {
    test(`${status} stops polling and never becomes still-running or successful`, async (t) => {
      const { calls, options } = transport(t, [accepted, () => record(status, { failureClass: "EXHAUSTED" })]);
      const result = await sendPillowChat(input, options);
      assert.equal(result.kind, "error");
      assert.equal(result.status, status);
      assert.equal(result.semanticSuccess, false);
      assert.equal(result.requestRemainsRunning, false);
      assert.match(result.message, /original request has stopped/);
      assert.equal(calls.length, 2);
    });
  }

  test("network loss after admission remains UNKNOWN and never repeats POST", async (t) => {
    const failed = () => { throw new TypeError("Failed to fetch"); };
    const { calls, options } = transport(t, [accepted, failed, failed, failed]);
    const result = await sendPillowChat(input, options);
    assert.equal(result.kind, "durable_pending");
    assert.equal(result.status, "UNKNOWN");
    assert.equal(result.requestRemainsRunning, false);
    assert.match(result.message, /could not be confirmed/);
    assert.equal(calls.filter((call) => call.init?.method === "POST").length, 1);
  });

  test("RETRYABLE stays an honest recoverable interruption at poll deadline", async (t) => {
    const { options } = transport(t, [accepted, ...Array.from({ length: 3 }, () => () => record("RETRYABLE"))]);
    const result = await sendPillowChat(input, options);
    assert.equal(result.status, "RETRYABLE");
    assert.equal(result.requestRemainsRunning, false);
    assert.equal(result.semanticSuccess, false);
    assert.match(result.message, /recoverable interruption/);
  });

  test("RUNNING at deadline is a receipt, not an executive answer", async (t) => {
    const { options } = transport(t, [accepted, ...Array.from({ length: 3 }, () => () => record("RUNNING"))]);
    const result = await sendPillowChat(input, options);
    assert.equal(result.status, "RUNNING");
    assert.equal(result.kind, "durable_pending");
    assert.equal(result.semanticSuccess, false);
    assert.equal(result.requestId, receipt.requestId);
  });

  for (const status of [401, 403, 404, 503]) {
    test(`GET ${status} never fabricates completion or rePOSTs`, async (t) => {
      const { calls, options } = transport(t, [accepted, ...Array.from({ length: 3 }, () => () => Response.json({ error: "unavailable" }, { status }))]);
      const result = await sendPillowChat(input, options);
      assert.equal(result.status, "UNKNOWN");
      assert.equal(result.semanticSuccess, false);
      assert.equal(calls.filter((call) => call.init?.method === "POST").length, 1);
    });
  }

  for (const status of [202, 401, 404, 503]) {
    test(`POST ${status} without a receipt is not automatically repeated`, async (t) => {
      const { calls, options } = transport(t, [() => Response.json({}, { status })]);
      await assert.rejects(sendPillowChat(input, options), /not been sent again automatically/);
      assert.equal(calls.length, 1);
    });
  }

  test("lost POST response cannot trigger a second submission", async (t) => {
    const { calls, options } = transport(t, [() => { throw new Error("Failed to fetch"); }]);
    await assert.rejects(sendPillowChat(input, options), /may have received this instruction/);
    assert.equal(calls.length, 1);
  });

  test("browser reopen resumes via GET only", async (t) => {
    const { calls, options } = transport(t, [() => record("COMPLETED", { finalResult: answer })]);
    assert.equal((await retrievePillowChat(receipt, options)).message, answer.message);
    assert.deepEqual(calls.map((call) => call.init?.method), ["GET"]);
  });

  test("completed GET preserves a later rebound session instead of an older POST envelope", async (t) => {
    const { options } = transport(t, [
      () => Response.json({ reboundSessionId: "first-rebound", result: { ...receipt, kind: "durable_pending" } }, { status: 202 }),
      () => record("COMPLETED", { finalResult: { ...answer, reboundSessionId: "durable-rebound" } }),
    ]);
    const result = await sendPillowChat(input, options);
    assert.equal(result.reboundSessionId, "durable-rebound");
    assert.equal(result.sessionId, "durable-rebound");
  });

  test("refresh retrieval preserves the saved rebound session", async (t) => {
    const { options } = transport(t, [
      () => record("COMPLETED", { finalResult: { ...answer, reboundSessionId: "restored-session" } }),
    ]);
    const result = await retrievePillowChat(receipt, options);
    assert.equal(result.reboundSessionId, "restored-session");
    assert.equal(result.sessionId, "restored-session");
  });

  test("cancelling restore does not poll or execute work", async (t) => {
    const { calls, options } = transport(t, []);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(retrievePillowChat(receipt, { ...options, signal: controller.signal }), /Aborted/);
    assert.equal(calls.length, 0);
  });

  test("session creation coalesces only inside the same owner and workspace", async (t) => {
    const { calls } = transport(t, [
      () => Response.json({ session: { sessionId: "owner-a-session" } }),
      () => Response.json({ session: { sessionId: "owner-b-session" } }),
    ]);
    const [a1, a2, b] = await Promise.all([
      createPillowHostSession("shared-workspace", "owner-a"),
      createPillowHostSession("shared-workspace", "owner-a"),
      createPillowHostSession("shared-workspace", "owner-b"),
    ]);
    assert.equal(a1.sessionId, "owner-a-session");
    assert.equal(a2.sessionId, a1.sessionId);
    assert.equal(b.sessionId, "owner-b-session");
    assert.equal(calls.length, 2);
  });
});

describe("Honest delivery state and receipt persistence", () => {
  for (const kind of ["llm", "authority_refusal", "authority_facts", "response_contract"] as const) {
    test(`accepts completed ${kind} without mislabeling it as unavailable`, () => {
      const result = resultFromDurableRecord(receipt, { status: "COMPLETED", finalResult: { ...answer, kind } });
      assert.equal(result?.kind, kind);
      assert.equal(result?.status, "COMPLETED");
      assert.equal(result?.durableRetrieved, true);
      assert.equal(result?.message, answer.message);
    });
    for (const negative of [
      { constitutionalGate: { allowed: false } },
      { responseContract: { code: "EXECUTIVE_RESPONSE_BLOCKED" } },
      { degradedUsed: true }, { transportContractPassed: false },
      { semanticSuccess: false }, { brainCompleted: false },
      { requestRemainsRunning: true }, { message: "PILLOW_RESULT_PENDING: still queued" },
    ]) {
      test(`${kind} fails closed when ${JSON.stringify(negative)}`, () => {
        const result = resultFromDurableRecord(receipt, { status: "COMPLETED", finalResult: { ...answer, kind, ...negative } });
        assert.equal(result?.kind, "error");
        assert.equal(result?.failureClass, "INVALID_COMPLETED_RESULT");
        assert.equal(result?.semanticSuccess, false);
      });
    }
  }
  for (const bad of [null, {}, { message: "" }, { kind: "llm", message: " " },
    { kind: "error", message: "error" }, { kind: "durable_pending", message: "pending" },
    { ...answer, kind: "command_fallback" }, { ...answer, kind: "unrecognised" },
    { ...answer, semanticSuccess: false }, { ...answer, brainCompleted: false },
    { ...answer, requestRemainsRunning: true }]) {
    test(`COMPLETED with invalid payload is not success: ${JSON.stringify(bad)}`, () => {
      const result = resultFromDurableRecord(receipt, { status: "COMPLETED", finalResult: bad });
      assert.equal(result?.kind, "error");
      assert.equal(result?.failureClass, "INVALID_COMPLETED_RESULT");
      assert.equal(result?.semanticSuccess, false);
    });
  }

  test("retrieval ID mismatch fails closed", () => {
    const result = resultFromDurableRecord(receipt, { requestId: "someone_else", status: "COMPLETED", finalResult: answer });
    assert.equal(result?.failureClass, "RESULT_ID_MISMATCH");
  });

  test("pending text remains a status through UI mapping and sanitization", () => {
    const result = pendingDurableResult(receipt, "RETRYABLE");
    const ui = mapPillowChatToAssistantResponse(result, input.message);
    assert.equal(ui.confidence, "unavailable");
    assert.match(ui.currentContext, /no completed answer/);
    assert.equal(toExecutiveChatMessage(ui.interactionSummary), result.message);
    assert.doesNotMatch(ui.recommendedNextAction, /Continue the conversation/);
  });

  test("owner namespaces isolate receipts, deduplicate IDs, and retain other requests", (t) => {
    const rows = new Map<string, string>();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: (key: string) => rows.get(key) ?? null,
      setItem: (key: string, value: string) => rows.set(key, value),
    } } });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, "window", previous);
      else Reflect.deleteProperty(globalThis, "window");
    });
    savePendingPillowReceipt("owner-a", { ...receipt, query: input.message });
    savePendingPillowReceipt("owner-a", { ...receipt, query: input.message });
    savePendingPillowReceipt("owner-a", { ...receipt, requestId: "second", query: "Other ask" });
    assert.equal(loadPendingPillowReceipts("owner-b").length, 0);
    assert.equal(loadPendingPillowReceipts("owner-a").length, 2);
    clearPendingPillowReceipt("owner-a", receipt.requestId);
    assert.deepEqual(loadPendingPillowReceipts("owner-a").map((row) => row.requestId), ["second"]);
  });

  test("the completed answer replaces its receipt instead of appending another assistant turn", () => {
    const first = appendPillowTurn(null, { role: "pillow", requestId: receipt.requestId, content: "Pending", screenPath: "/" });
    const completed = appendPillowTurn(first, { role: "pillow", requestId: receipt.requestId, content: answer.message, screenPath: "/" });
    assert.equal(completed.turns.length, 1);
    assert.equal(completed.turns[0].id, first.turns[0].id);
    assert.equal(completed.turns[0].content, answer.message);
  });

  test("conversation and host sessions cannot cross owners or import the legacy unscoped key", (t) => {
    const rows = new Map<string, string>();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: (key: string) => rows.get(key) ?? null,
      setItem: (key: string, value: string) => rows.set(key, value),
    } } });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, "window", previous);
      else Reflect.deleteProperty(globalThis, "window");
    });
    const legacy = { hostSessionId: "old-owner-session", turns: [{ content: "Private old-owner context" }] };
    rows.set(PILLOW_SESSION_STORAGE_KEY, JSON.stringify(legacy));
    assert.equal(loadPillowSession(), null);
    assert.equal(loadPillowSession("owner-b"), null);
    const a = appendPillowTurn(null, { role: "grand-king", content: "Private A context", screenPath: "/" }, "owner-a");
    savePillowSession({ ...a, hostSessionId: "session-a" }, "owner-a");
    assert.equal(loadPillowSession("owner-a")?.hostSessionId, "session-a");
    assert.equal(loadPillowSession("owner-b"), null);
    clearPillowHostSession("owner-b");
    assert.equal(loadPillowSession("owner-a")?.hostSessionId, "session-a");
    const b = appendPillowTurn(loadPillowSession("owner-b"), { role: "grand-king", content: "Private B context", screenPath: "/" }, "owner-b");
    assert.deepEqual(b.turns.map((row) => row.content), ["Private B context"]);
    assert.deepEqual(loadPillowSession("owner-a")?.turns.map((row) => row.content), ["Private A context"]);
  });

  test("provider has exactly one attempt and BFF does not hold back the accepted ID", () => {
    const provider = readFileSync(new URL("../cockpit/global-assistant/GlobalAiAssistantProvider.tsx", import.meta.url), "utf8");
    assert.equal(provider.match(/await attemptChat\(sessionId\)/g)?.length, 1);
    assert.match(provider, /retrievePillowChat\(priorReceipt\)/);
    assert.match(provider, /loadPendingPillowReceipts\(user.id\)/);
    assert.doesNotMatch(provider, /loadPillowSession\(\)/);
    assert.match(provider, /GlobalAiAssistantSession key=\{user\?\.id/);
    const bff = readFileSync(new URL("../../app/api/pillow/[...path]/route.ts", import.meta.url), "utf8");
    assert.doesNotMatch(bff, /while \(Date.now\(\) < deadline\)/);
    assert.match(bff, /new Response\(raw, \{ status: 202, headers \}\)/);
    assert.match(bff, /isFailClosedPillowResponse\(upstream.status, raw\)/);
  });
});
