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

  it("rejects invalid recorded spend and retains the original ledger event", () => {
    authorizePaidWork();
    recordCostSpend({ workspaceId: WS, kind: "operating", amountUsd: -1 });
    assertBlocked(0.02, /monthly operating ledger is invalid/);
    assert.equal(buildCostGuardStatus(WS).spend.monthlyOperating.actualUsd, -1);
  });

  it("keeps a zero owner limit and existing hard stops effective", () => {
    authorizePaidWork();
    setCostGuardLimits(WS, { dailyAiBudgetUsd: 0 }, "test-owner");
    assertBlocked(0, /Daily AI budget exhausted/);
    assertBlocked(0.02, /Daily AI budget exhausted/);
    const proof = runSafeHardStopProof(WS, "test-owner");
    assert.equal(proof.ok, true);
    assert.equal(getCostGuardLimits(WS).dailyAiBudgetUsd, 0);
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
});
