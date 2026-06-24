import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import { bootstrapFoundation, productScoutEngine } from "../../foundation/index.js";
import { architectureValidator } from "../../guardian/architecture-validator.js";
import { productScoutGuard } from "../../intelligence/product-scout/product-scout-guard.js";
import {
  listScoutCatalog,
  SCOUT_MOCK_PRODUCTS,
} from "../../intelligence/product-scout/mock-products.js";
import { workforceIntelligenceQuery } from "../../workforce/intelligence-query.js";
import { workforceRegistry } from "../../workforce/registry.js";
import { createBrain } from "../../brain/index.js";
import { getDatabase } from "../../brain/database.js";

configureValidationEnvironment();

describe("Mission 003 AI Product Scout", () => {
  it("evaluates mock products with Empire scoring dimensions", () => {
    const evaluation = productScoutEngine.evaluateMock("ws_scout_test", "prod-pet-hair-remover");
    assert.ok(evaluation.demandScore >= 0);
    assert.ok(evaluation.marginScore >= 0);
    assert.ok(evaluation.trendScore >= 0);
    assert.ok(evaluation.brandabilityScore >= 0);
    assert.ok(evaluation.confidenceScore >= 0);
    assert.ok(evaluation.finalEmpireScore >= 0);
    assert.ok(evaluation.why.length >= 1);
    assert.ok(["APPROVE", "REVIEW", "REJECT"].includes(evaluation.recommendation));
  });

  it("Guardian rejects extreme refund risk products", () => {
    const evaluation = productScoutEngine.evaluateMock("ws_scout_test", "prod-mystery-gadget");
    assert.equal(evaluation.recommendation, "REJECT");
    assert.ok(evaluation.guardianVerdict.flags.includes("extreme_refund_risk"));
    assert.ok(evaluation.guardianVerdict.reasons.length >= 1);
  });

  it("Guardian flags low margin and poor supplier reliability", () => {
    const verdict = productScoutGuard.assess({
      demandScore: 50,
      competitionScore: 50,
      marginScore: 30,
      shippingScore: 60,
      supplierReliabilityScore: 40,
      adDifficultyScore: 75,
      refundRiskScore: 40,
      trendScore: 45,
      brandabilityScore: 40,
      finalEmpireScore: 48,
    });
    assert.ok(verdict.flags.includes("low_margin"));
    assert.ok(verdict.flags.includes("poor_supplier_reliability"));
    assert.ok(verdict.flags.includes("high_ad_difficulty"));
    assert.equal(verdict.recommendation, "REJECT");
  });

  it("scanPortfolio ranks products and returns top pick", () => {
    const scan = productScoutEngine.scanPortfolio("ws_scout_test");
    assert.equal(scan.scannedCount, SCOUT_MOCK_PRODUCTS.length);
    assert.ok(scan.evaluations.length === SCOUT_MOCK_PRODUCTS.length);
    assert.ok(scan.topPick);
    const sorted = [...scan.evaluations].sort((a, b) => b.finalEmpireScore - a.finalEmpireScore);
    assert.equal(scan.evaluations[0]?.productId, sorted[0]?.productId);
  });

  it("persists evaluations to product_scout_evaluations table", () => {
    const evaluation = productScoutEngine.evaluateMock("ws_scout_persist", 0);
    productScoutEngine.persist(evaluation);
    const count = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM product_scout_evaluations WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_scout_persist" }) as { c: number }
    ).c;
    assert.ok(count >= 1);
  });

  it("registers AI Product Scout workforce role with scout capabilities", () => {
    const role = workforceRegistry.get("ai-product-scout");
    assert.ok(role);
    assert.equal(role?.agentId, "product-scout");
    assert.equal(role?.module, "product-scout");

    const allowed = workforceIntelligenceQuery.query({
      roleId: "ai-product-scout",
      queryType: "scout.scan",
      workspaceId: "ws_scout_test",
    });
    assert.equal(allowed.allowed, true);
    assert.ok(allowed.data);

    const denied = workforceIntelligenceQuery.query({
      roleId: "ai-product-scout",
      queryType: "finance.summary",
      workspaceId: "ws_scout_test",
    });
    assert.equal(denied.allowed, false);
  });

  it("architecture validation includes product-scout-engine check", () => {
    bootstrapFoundation("ws_scout_arch");
    const report = architectureValidator.validate("ws_scout_arch");
    const checkIds = report.checks.map((c) => c.id);
    assert.ok(checkIds.includes("product-scout-engine"));
    const scoutCheck = report.checks.find((c) => c.id === "product-scout-engine");
    assert.ok(scoutCheck?.status === "healthy" || scoutCheck?.status === "degraded");
  });

  it("routes through Brain orchestrator dispatch without bypass", async () => {
    const brain = await createBrain({ startWorkers: false, startScheduler: false });
    try {
      const result = await brain.orchestrator.dispatch({
        module: "product-scout",
        action: "evaluate",
        workspaceId: "ws_scout_dispatch",
        payload: { productId: "prod-eco-bottle" },
      });
      assert.equal(result.status, "completed");
      assert.ok(result.result);
      const evaluation = result.result as { recommendation: string; finalEmpireScore: number };
      assert.ok(["APPROVE", "REVIEW", "REJECT"].includes(evaluation.recommendation));
      assert.ok(evaluation.finalEmpireScore >= 0);
    } finally {
      await brain.shutdown();
    }
  });

  it("mock catalog lists scout products", () => {
    const catalog = listScoutCatalog();
    assert.equal(catalog.length, SCOUT_MOCK_PRODUCTS.length);
    assert.ok(catalog.some((p) => p.productId === "prod-mystery-gadget"));
  });
});
