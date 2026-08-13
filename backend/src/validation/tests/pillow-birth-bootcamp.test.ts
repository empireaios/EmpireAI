import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allocatePortfolioAttention,
  attentionPlanIsScaleCompatible,
  runExecutiveBirthBootcamp,
} from "../../orchestration/pillow-commissioning/birth-bootcamp/index.js";

describe("pillow executive birth bootcamp", () => {
  it("allocates selective attention at 1000-SKU scale", () => {
    const entities = Array.from({ length: 1000 }, (_, i) => ({
      entityId: `e${i}`,
      asin: `B0${i}`,
      title: `Item ${i}`,
      corridor: "SupplierA → Amazon US",
      realisedRevenueUsd: i < 5 ? 1000 : 0,
      realisedOrders: i < 5 ? 50 : 0,
      expectedProfitUsd: 5,
      marginPct: i === 10 ? 2 : 20,
      stockOut: i === 11,
      deliveryBreach: i === 12,
      priceShockPct: i === 13 ? 20 : 0,
      daysSinceLastSignal: 3,
      publishState: "LISTED" as const,
    }));
    const plan = allocatePortfolioAttention(entities);
    const ok = attentionPlanIsScaleCompatible(plan);
    assert.equal(ok.pass, true, ok.detail);
    assert.ok(plan.tierCounts.TIER_0_MONITOR >= 700);
  });

  it("runs full Bootcamp deterministically without Birth authorisation", () => {
    const report = runExecutiveBirthBootcamp({ seed: 20260813 });
    assert.equal(report.birthAuthorised, false);
    assert.equal(report.birthTimestamp, null);
    assert.equal(report.realGkChatgptExamQuestionsSeen, false);
    assert.equal(report.hiddenT1T2T3Executed, false);
    assert.ok(report.cost.scenariosExecuted >= 20);
    assert.equal(report.cost.llmCalls, 0);
    assert.equal(report.cost.estimatedLlmUsd, 0);

    const failed = report.results.filter((r) => r.status === "FAIL");
    assert.equal(
      failed.length,
      0,
      failed.map((f) => `${f.scenarioId}:${f.checks.map((c) => c.name + "=" + c.pass).join(",")}`).join(" | "),
    );
    assert.equal(report.bootcampReady, true);
    assert.equal(report.safeForGkChatgptSealedExam, true);
  });
});
