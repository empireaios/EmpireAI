/**
 * Level A — accepted Pillow chat request ownership + bounded recovery.
 * Does not encode Nova / sealed closure content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptPillowChatRequest,
  assertsNoIrrelevantProtectedState,
  attemptTimeoutForBudget,
  buildTerminalInfrastructureMessage,
  isSyntheticIsolatedAsk,
  isTransientProxyFailure,
  PILLOW_CHAT_TIMEOUTS,
  remainingBudgetMs,
  runAcceptedPillowChatRecovery,
  shouldSurfaceBirthBoundary,
  type PillowProxyAttemptResult,
} from "../../runtime/pillow-accepted-request-recovery.js";

describe("pillow accepted-request recovery Level A", () => {
  it("1 accepts request with durable identity", () => {
    const a = acceptPillowChatRequest({
      message: "Synthetic multi-part ask",
      sessionId: "sess_1",
    });
    assert.ok(a.requestId.startsWith("pcr_"));
    assert.equal(a.sessionId, "sess_1");
    assert.equal(a.kind, "reasoning");
    assert.ok(a.acceptedAt > 0);
  });

  it("2 bounded retry succeeds after first transient failure", async () => {
    let attempts = 0;
    const accepted = acceptPillowChatRequest({ message: "SyntheticCanary: analyse two blockers." });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => true,
      attempt: async () => {
        attempts += 1;
        if (attempts === 1) return { ok: false, reason: "network" };
        return {
          ok: true,
          status: 200,
          body: Buffer.from(JSON.stringify({ result: { message: "Useful terminal answer." } })),
          headers: new Headers(),
          messagePreview: "Useful terminal answer.",
        };
      },
      totalBudgetMs: 30_000,
      attempt1Ms: 5_000,
      attempt2Ms: 5_000,
      workerWaitMs: 10,
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.match(result.messagePreview, /Useful terminal/);
    assert.equal(attempts, 2);
  });

  it("3 worker unavailable then recovers before attempt", async () => {
    let probes = 0;
    const accepted = acceptPillowChatRequest({ message: "Synthetic short ask" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => {
        probes += 1;
        return probes >= 2;
      },
      attempt: async () => ({
        ok: true,
        status: 200,
        body: Buffer.from(JSON.stringify({ result: { message: "Recovered answer" } })),
        headers: new Headers(),
        messagePreview: "Recovered answer",
      }),
      totalBudgetMs: 20_000,
      workerWaitMs: 3_000,
      attempt1Ms: 5_000,
      attempt2Ms: 5_000,
    });
    assert.equal(result.ok, true);
    assert.ok(probes >= 2);
  });

  it("4 timeout hierarchy constants are ordered FE >= BFF >= Tier0 budget", () => {
    assert.ok(PILLOW_CHAT_TIMEOUTS.frontendChatMs >= PILLOW_CHAT_TIMEOUTS.bffChatMs);
    assert.ok(PILLOW_CHAT_TIMEOUTS.bffChatMs >= PILLOW_CHAT_TIMEOUTS.tier0TotalBudgetMs);
    assert.ok(
      PILLOW_CHAT_TIMEOUTS.tier0Attempt1Ms + PILLOW_CHAT_TIMEOUTS.workerReadyWaitMs <=
        PILLOW_CHAT_TIMEOUTS.tier0TotalBudgetMs + 20_000,
    );
  });

  it("5 attempt timeout respects remaining budget", () => {
    assert.equal(attemptTimeoutForBudget(8_000, 40_000), 7_000);
    assert.ok(attemptTimeoutForBudget(100_000, 40_000) === 40_000);
  });

  it("6 remaining budget declines", () => {
    const t0 = Date.now() - 5_000;
    const rem = remainingBudgetMs(t0, 10_000);
    assert.ok(rem <= 5_500 && rem >= 4_000);
  });

  it("7 degraded/terminal suppresses Birth on synthetic isolation", () => {
    const a = acceptPillowChatRequest({
      message: "Synthetic analysis only — do not mention EmpireAI, Birth, products, or sales.",
    });
    assert.equal(isSyntheticIsolatedAsk(a.message), true);
    const msg = buildTerminalInfrastructureMessage(a);
    assert.equal(assertsNoIrrelevantProtectedState(msg, a.message), true);
    assert.doesNotMatch(msg, /Birth remains/i);
    assert.doesNotMatch(msg, /theme to deepen/i);
    assert.doesNotMatch(msg, /worker proxy/i);
    assert.doesNotMatch(msg, /do not need to resubmit/i);
  });

  it("8 Birth may appear only when asked", () => {
    const a = acceptPillowChatRequest({ message: "Is Birth authorised?" });
    assert.equal(shouldSurfaceBirthBoundary(a.message), true);
    const msg = buildTerminalInfrastructureMessage(a);
    assert.match(msg, /Birth remains unauthorised/i);
  });

  it("9 infrastructure failure is not clarification", () => {
    const a = acceptPillowChatRequest({ message: "Synthetic: complete all seven sections." });
    const msg = buildTerminalInfrastructureMessage(a);
    assert.doesNotMatch(msg, /which (?:theme|part) to deepen/i);
    assert.match(msg, /infrastructure/i);
  });

  it("10 idempotency: reasoning kind only; side_effect throws", async () => {
    const accepted = acceptPillowChatRequest({ message: "hi" });
    accepted.kind = "side_effect";
    await assert.rejects(
      () =>
        runAcceptedPillowChatRecovery({
          accepted,
          probeWorker: async () => true,
          attempt: async () => ({ ok: false, reason: "network" }),
        }),
      /side_effect_retry_forbidden/,
    );
  });

  it("11 recovery exhausted returns transient classification", async () => {
    const accepted = acceptPillowChatRequest({ message: "Synthetic long ask" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => true,
      attempt: async () => ({ ok: false, reason: "timeout" }),
      totalBudgetMs: 8_000,
      attempt1Ms: 2_000,
      attempt2Ms: 2_000,
      workerWaitMs: 50,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "timeout");
  });

  it("12 empty message is transient and retried", async () => {
    let attempts = 0;
    const accepted = acceptPillowChatRequest({ message: "Synthetic" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => true,
      attempt: async () => {
        attempts += 1;
        if (attempts === 1) {
          return {
            ok: true,
            status: 200,
            body: Buffer.from("{}"),
            headers: new Headers(),
            messagePreview: "",
          };
        }
        return {
          ok: true,
          status: 200,
          body: Buffer.from(JSON.stringify({ result: { message: "Filled" } })),
          headers: new Headers(),
          messagePreview: "Filled",
        };
      },
      totalBudgetMs: 20_000,
      workerWaitMs: 10,
    });
    // First returned ok:true with empty preview — recovery treats as failure via caller.
    // Our runAccepted checks first.ok && messagePreview.length — empty triggers retry.
    assert.equal(attempts, 2);
    assert.equal(result.ok, true);
  });

  it("13 503 upstream is transient", () => {
    const r: PillowProxyAttemptResult = { ok: false, reason: "upstream_error", status: 503 };
    assert.equal(isTransientProxyFailure(r), true);
  });

  it("14 400 upstream is not treated as worker-unavailable class only", () => {
    const r: PillowProxyAttemptResult = { ok: false, reason: "upstream_error", status: 400 };
    assert.equal(isTransientProxyFailure(r), false);
  });
});
