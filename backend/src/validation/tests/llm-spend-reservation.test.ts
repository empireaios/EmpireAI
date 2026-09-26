import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { closeDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { LLMRouter } from "../../brain/llm/llm-router.js";
import type { LLMProvider } from "../../brain/llm/provider.js";
import { buildCostGuardStatus, setCostGuardLimits } from "../../orchestration/pillow-commissioning/cost-guard.js";

const priorPath = process.env.DATABASE_PATH;
const priorPrices = process.env.LLM_AUTHORIZED_PRICING_JSON;
const priorEngineering = process.env.EMPIRE_ENGINEERING_TEST_MODE;
let directory: string | null = null;
function useDisk() {
  directory = mkdtempSync(join(tmpdir(), "llm-reserve-proof-"));
  process.env.DATABASE_PATH = join(directory, "brain.db");
  delete process.env.EMPIRE_ENGINEERING_TEST_MODE;
  resetDatabaseInstance();
}
afterEach(() => {
  resetDatabaseInstance();
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
  if (priorPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = priorPath;
  if (priorPrices === undefined) delete process.env.LLM_AUTHORIZED_PRICING_JSON;
  else process.env.LLM_AUTHORIZED_PRICING_JSON = priorPrices;
  if (priorEngineering === undefined) delete process.env.EMPIRE_ENGINEERING_TEST_MODE;
  else process.env.EMPIRE_ENGINEERING_TEST_MODE = priorEngineering;
});
const request = {
  workspaceId: "ws-llm-durable-reservation", correlationId: "offline-no-provider-call",
  provider: "openai" as const, model: "offline-approved-model", maxTokens: 100,
  messages: [{ role: "user" as const, content: "offline bounded proof" }],
};
function fakeRouter(onCall: () => Promise<void>): LLMRouter {
  const router = new LLMRouter();
  const fake: LLMProvider = {
    name: "openai", isAvailable: () => true,
    complete: async () => {
      await onCall();
      return { provider: "openai", model: request.model, content: "offline",
        usage: { promptTokens: 12, completionTokens: 1, totalTokens: 13 } };
    },
  };
  (router as unknown as { providers: Map<string, LLMProvider> }).providers.set("openai", fake);
  return router;
}
test("unpriced exact model never reaches a provider", async () => {
  useDisk();
  delete process.env.LLM_AUTHORIZED_PRICING_JSON;
  setCostGuardLimits(request.workspaceId, {
    dailyAiBudgetUsd: 1,
    monthlyOperatingBudgetUsd: 1,
    autonomousPaidActionLimitUsd: 1,
    providerModelBudgetUsd: 1,
  }, "offline-founder");
  let calls = 0;
  const router = fakeRouter(async () => { calls++; });
  await assert.rejects(router.complete(request), /pricing authorization unavailable/);
  assert.equal(calls, 0);
  assert.equal(buildCostGuardStatus(request.workspaceId).spend.dailyAi.committedUsd, 0);
});

test("owner-budgeted exact price reserves to disk before one fake provider call and blocks another", async () => {
  useDisk();
  const now = Date.now();
  process.env.LLM_AUTHORIZED_PRICING_JSON = JSON.stringify([{
    provider: "openai", model: request.model, inputUsdPerMillion: 1,
    outputUsdPerMillion: 1, approvedBy: "founder",
    approvedAt: new Date(now - 60_000).toISOString(),
    expiresAt: new Date(now + 60 * 60_000).toISOString(),
  }]);
  setCostGuardLimits(request.workspaceId, {
    dailyAiBudgetUsd: 0.003,
    monthlyOperatingBudgetUsd: 0.003,
    autonomousPaidActionLimitUsd: 0.003,
    providerModelBudgetUsd: 0.003,
  }, "offline-founder");
  let calls = 0;
  const router = fakeRouter(async () => {
    calls++;
    closeDatabase(); // Provider starts only after actual durable export.
    const status = buildCostGuardStatus(request.workspaceId);
    assert.ok(status.spend.dailyAi.committedUsd > 0);
    assert.equal(status.spend.dailyAi.actualUsd, 0);
  });
  const result = await router.complete(request);
  assert.equal(result.content, "offline");
  await assert.rejects(router.complete(request), /HARD STOP|budget exceeded|Projected/);
  assert.equal(calls, 1);
  closeDatabase();
  const status = buildCostGuardStatus(request.workspaceId);
  assert.ok(status.spend.dailyAi.committedUsd > 0);
  assert.equal(status.spend.dailyAi.actualUsd, 0); // Only invoice can settle it.
  assert.equal(status.spend.monthlyOperating.committedUsd, status.spend.dailyAi.committedUsd);
});
