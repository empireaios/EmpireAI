import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { LLMRouter } from "../../brain/llm/llm-router.js";
import {
  assertPaidAutonomousAllowed,
  buildCostGuardStatus,
  getCostGuardLimits,
  recordCostSpend,
  runSafeHardStopProof,
  setCostGuardLimits,
} from "../../orchestration/pillow-commissioning/cost-guard.js";

const WS = "ws_cost_authorization_test";
const requiredKeys = [
  "dailyAiBudgetUsd",
  "autonomousPaidActionLimitUsd",
  "monthlyOperatingBudgetUsd",
] as const;

function authorizePaidWork(): void {
  setCostGuardLimits(WS, {
    dailyAiBudgetUsd: 10,
    autonomousPaidActionLimitUsd: 10,
    monthlyOperatingBudgetUsd: 10,
  }, "test-owner");
}

function assertBlocked(estimate: number, reason: RegExp): void {
  const result = assertPaidAutonomousAllowed(WS, estimate);
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.match(result.reason, reason);
}

describe("paid autonomous cost authorization", () => {
  let previousDatabasePath: string | undefined;
  let previousEngineeringMode: string | undefined;

  beforeEach(() => {
    previousDatabasePath = process.env.DATABASE_PATH;
    previousEngineeringMode = process.env.EMPIRE_ENGINEERING_TEST_MODE;
    process.env.DATABASE_PATH = ":memory:cost-guard-authorization";
    delete process.env.EMPIRE_ENGINEERING_TEST_MODE;
    resetDatabaseInstance();
  });

  afterEach(() => {
    mock.restoreAll();
    resetDatabaseInstance();
    if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previousDatabasePath;
    if (previousEngineeringMode === undefined) delete process.env.EMPIRE_ENGINEERING_TEST_MODE;
    else process.env.EMPIRE_ENGINEERING_TEST_MODE = previousEngineeringMode;
  });

  it("blocks unknown authority without inventing budgets or recording spend", () => {
    assertBlocked(0.02, /authorization is UNKNOWN/);
    assertBlocked(0, /authorization is UNKNOWN/);
    for (const key of requiredKeys) assert.equal(getCostGuardLimits(WS)[key], null);
    const row = getDatabase().prepare("SELECT COUNT(*) AS n FROM pillow_cost_spend_events").get() as { n: number };
    assert.equal(row.n, 0);
  });

  for (const key of requiredKeys) {
    it(`requires ${key} even when the other budgets are known`, () => {
      authorizePaidWork();
      setCostGuardLimits(WS, { [key]: null }, "test-owner");
      assertBlocked(0.02, new RegExp(key));
    });
  }

  it("does not turn a deployment-only amount into paid AI authority", () => {
    setCostGuardLimits(WS, { monthlyOperatingBudgetUsd: 5 }, "test-owner");
    assertBlocked(0.02, /dailyAiBudgetUsd/);
    assert.equal(getCostGuardLimits(WS).autonomousPaidActionLimitUsd, null);
  });

  it("rejects nonfinite and negative estimates before any paid work", () => {
    authorizePaidWork();
    for (const estimate of [NaN, Infinity, -Infinity, -0.01]) {
      assertBlocked(estimate, /finite nonnegative/);
    }
  });

  it("rejects malformed stored authorization rather than coercing it into permission", () => {
    authorizePaidWork();
    const stored = getCostGuardLimits(WS);
    getDatabase().prepare("UPDATE pillow_cost_guard_limits SET record_json = @json WHERE workspace_id = @workspaceId").run({
      workspaceId: WS,
      json: JSON.stringify({ ...stored, monthlyOperatingBudgetUsd: "10" }),
    });
    assertBlocked(0.02, /UNKNOWN or invalid: monthlyOperatingBudgetUsd/);
  });

  for (const [kind, label] of [
    ["ai", "daily AI"],
    ["autonomous_paid", "autonomous paid"],
    ["operating", "monthly operating"],
  ] as const) {
    it(`counts actual and committed ${label} spend in the projection`, () => {
      authorizePaidWork();
      recordCostSpend({ workspaceId: WS, kind, amountUsd: 8 });
      recordCostSpend({ workspaceId: WS, kind, amountUsd: 1.5, committed: true });
      assertBlocked(0.51, new RegExp(`Projected ${label} spend`));
      assert.deepEqual(assertPaidAutonomousAllowed(WS, 0.5), { allowed: true });
    });
  }

  it("rejects invalid new spend and halts on a malformed persisted event", () => {
    authorizePaidWork();
    for (const invalid of [-1, NaN, Infinity]) {
      assert.throws(() => recordCostSpend({ workspaceId: WS, kind: "operating", amountUsd: invalid }), /finite nonnegative/);
    }
    const db = getDatabase();
    db.prepare(`INSERT INTO pillow_cost_spend_events
      (spend_id, workspace_id, recorded_at, kind, amount_usd, provider, attribution_json)
      VALUES (@id, @workspaceId, @recordedAt, @kind, @amountUsd, @provider, @attribution)`).run({
      id: "tampered", workspaceId: WS, recordedAt: new Date().toISOString(),
      kind: "operating", amountUsd: "not-a-number", provider: null, attribution: "{}",
    });
    assertBlocked(0.02, /monthly operating ledger is invalid/);
    assert.equal(Number.isNaN(buildCostGuardStatus(WS).spend.monthlyOperating.actualUsd), true);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM pillow_cost_spend_events").get() as { n: number }).n, 1);
  });

  it("counts AI charges toward the monthly operating cap without double-posting spend", () => {
    setCostGuardLimits(WS, {
      dailyAiBudgetUsd: 100,
      autonomousPaidActionLimitUsd: 100,
      monthlyOperatingBudgetUsd: 10,
    }, "test-owner");
    recordCostSpend({ workspaceId: WS, kind: "ai", amountUsd: 8 });
    const status = buildCostGuardStatus(WS);
    assert.equal(status.spend.monthlyAi.actualUsd, 8);
    assert.equal(status.spend.monthlyOperating.actualUsd, 8);
    assertBlocked(2.01, /Projected monthly operating spend/);
    assert.deepEqual(assertPaidAutonomousAllowed(WS, 2), { allowed: true });
  });

  it("keeps a zero owner limit and existing hard stops effective", () => {
    authorizePaidWork();
    setCostGuardLimits(WS, { dailyAiBudgetUsd: 0 }, "test-owner");
    assertBlocked(0, /Daily AI budget exhausted/);
    assertBlocked(0.02, /Daily AI budget exhausted/);
    const db = getDatabase();
    const before = db.prepare("SELECT COUNT(*) AS n FROM pillow_cost_spend_events WHERE workspace_id = @workspaceId")
      .get({ workspaceId: WS }) as { n: number };
    const prior = getCostGuardLimits(WS);
    const proof = runSafeHardStopProof(WS, "test-owner");
    assert.equal(proof.ok, true);
    assert.deepEqual(getCostGuardLimits(WS), prior);
    const after = db.prepare("SELECT COUNT(*) AS n FROM pillow_cost_spend_events WHERE workspace_id = @workspaceId")
      .get({ workspaceId: WS }) as { n: number };
    assert.equal(after.n, before.n, "synthetic proof spend must never affect owner budget");
  });

  it("allows bounded AI work without inventing unrelated commerce authority", () => {
    authorizePaidWork();
    assert.deepEqual(assertPaidAutonomousAllowed(WS, 0.02), { allowed: true });
    assert.equal(getCostGuardLimits(WS).commerceOperationalBudgetUsd, null);
    assert.equal(getCostGuardLimits(WS).customerOrderFulfilmentBudgetUsd, null);
    assert.equal(assertPaidAutonomousAllowed("ws_other_owner", 0.02).allowed, false);
  });

  it("stops the real LLM router before resolving or contacting a provider", async () => {
    const router = new LLMRouter();
    const resolve = mock.method(router, "resolve", () => {
      throw new Error("provider resolution must not be reached");
    });
    await assert.rejects(router.complete({
      workspaceId: WS,
      correlationId: "unknown-paid-authority",
      messages: [{ role: "user", content: "offline cost gate test" }],
    }), /Cost Guard HARD STOP: Paid autonomous authorization is UNKNOWN/);
    assert.equal(resolve.mock.callCount(), 0);
  });

  it("blocks existing AI budgets during engineering testing without contacting a provider", async () => {
    authorizePaidWork();
    process.env.EMPIRE_ENGINEERING_TEST_MODE = "true";
    assertBlocked(0.02, /disabled during engineering deployment\/recovery testing/);
    const router = new LLMRouter();
    const resolve = mock.method(router, "resolve", () => {
      throw new Error("provider resolution must not be reached");
    });
    await assert.rejects(router.complete({
      workspaceId: WS,
      correlationId: "engineering-budget-is-not-ai-authority",
      messages: [{ role: "user", content: "offline engineering mode test" }],
    }), /Paid autonomous work is disabled during engineering deployment\/recovery testing/);
    assert.equal(resolve.mock.callCount(), 0);
    assert.equal(getCostGuardLimits(WS).dailyAiBudgetUsd, 10);
  });

  it("router aborts its actual provider invocation on timeout without retry", async () => {
    authorizePaidWork();
    setCostGuardLimits(WS, { providerModelBudgetUsd: 10 }, "test-owner");
    const previous = process.env.LLM_REQUEST_TIMEOUT_MS;
    const previousPrices = process.env.LLM_AUTHORIZED_PRICING_JSON;
    const now = Date.now();
    process.env.LLM_AUTHORIZED_PRICING_JSON = JSON.stringify([{
      provider: "openai", model: "offline-timeout-model",
      inputUsdPerMillion: 1, outputUsdPerMillion: 1, approvedBy: "founder",
      approvedAt: new Date(now - 60_000).toISOString(),
      expiresAt: new Date(now + 60 * 60_000).toISOString(),
    }]);
    process.env.LLM_REQUEST_TIMEOUT_MS = "15";
    let calls = 0, aborted = false;
    const router = new LLMRouter();
    mock.method(router, "resolve", () => ({ name: "openai" as const, isAvailable: () => true,
      complete: (request: import("../../brain/types.js").LLMCompletionRequest) => new Promise<never>((_resolve, reject) => {
        calls++;
        request.signal?.addEventListener("abort", () => { aborted = true; reject(request.signal?.reason); }, { once: true });
      }),
    }));
    try {
      await assert.rejects(router.complete({
        workspaceId: WS, correlationId: "offline-timeout",
        model: "offline-timeout-model", maxTokens: 100,
        messages: [{ role: "user", content: "offline timeout" }],
      }), /timed out/);
      assert.equal(calls, 1); assert.equal(aborted, true);
      assert.ok(buildCostGuardStatus(WS).spend.dailyAi.committedUsd > 0);
    } finally {
      if (previous === undefined) delete process.env.LLM_REQUEST_TIMEOUT_MS;
      else process.env.LLM_REQUEST_TIMEOUT_MS = previous;
      if (previousPrices === undefined) delete process.env.LLM_AUTHORIZED_PRICING_JSON;
      else process.env.LLM_AUTHORIZED_PRICING_JSON = previousPrices;
    }
  });

  it("invalid router timeout fails before provider resolution", async () => {
    authorizePaidWork();
    const previous = process.env.LLM_REQUEST_TIMEOUT_MS;
    process.env.LLM_REQUEST_TIMEOUT_MS = "Infinity";
    const router = new LLMRouter();
    const resolve = mock.method(router, "resolve", () => { throw new Error("provider must not be reached"); });
    try {
      await assert.rejects(router.complete({ workspaceId: WS, correlationId: "offline-invalid-timeout", messages: [] }), /Invalid LLM_REQUEST_TIMEOUT_MS/);
      assert.equal(resolve.mock.callCount(), 0);
    } finally { if (previous === undefined) delete process.env.LLM_REQUEST_TIMEOUT_MS; else process.env.LLM_REQUEST_TIMEOUT_MS = previous; }
  });
});
