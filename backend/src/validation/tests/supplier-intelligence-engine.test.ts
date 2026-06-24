import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import {
  bootstrapFoundation,
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  listMockCatalog,
  supplierIntelligenceEvaluationEngine,
} from "../../foundation/index.js";
import { intelligenceModuleRegistry } from "../../brain/contract/registry.js";
import { architectureValidator } from "../../guardian/architecture-validator.js";
import { getDatabase } from "../../brain/database.js";
import {
  computeAllScores,
  computeFakeSupplierRisk,
  computeTrustScore,
} from "../../intelligence/supplier-intelligence-engine/score-computers.js";
import {
  DEFAULT_SUPPLIER_RECOMMENDATION_THRESHOLDS,
  deriveSupplierRecommendation,
} from "../../intelligence/supplier-intelligence-engine/recommendation-engine.js";
import { getMockSupplier } from "../../intelligence/supplier-intelligence-engine/mock-catalog.js";
import { supplierIntelligenceGuard } from "../../intelligence/supplier-intelligence-engine/supplier-guard.js";
import { supplierIntelligenceModule } from "../../intelligence/supplier-intelligence-engine/module-contract.js";

configureValidationEnvironment();

describe("Mission 006 Supplier Intelligence Engine", () => {
  it("discoverSuppliers returns filtered mock catalog", () => {
    const all = discoverSuppliers("ws_sie_discover");
    assert.ok(all.count >= 4);

    const usOnly = discoverSuppliers("ws_sie_discover", { region: "US" });
    assert.ok(usOnly.suppliers.every((s) => s.region === "US"));
    assert.ok(usOnly.count >= 2);
  });

  it("evaluateSupplier returns all required output fields", () => {
    const evaluation = evaluateSupplier({
      supplierId: "sup-spocket-001",
      workspaceId: "ws_sie_eval",
      sellingPriceCents: 3999,
    });

    assert.equal(evaluation.supplierId, "sup-spocket-001");
    assert.ok(evaluation.trustScore >= 0 && evaluation.trustScore <= 100);
    assert.ok(evaluation.qualityScore >= 0 && evaluation.qualityScore <= 100);
    assert.ok(evaluation.shippingScore >= 0 && evaluation.shippingScore <= 100);
    assert.ok(evaluation.reliabilityScore >= 0 && evaluation.reliabilityScore <= 100);
    assert.ok(evaluation.pricingScore >= 0 && evaluation.pricingScore <= 100);
    assert.ok(evaluation.profitMarginEstimate >= -50 && evaluation.profitMarginEstimate <= 95);
    assert.ok(evaluation.fakeSupplierRisk >= 0 && evaluation.fakeSupplierRisk <= 100);
    assert.ok(evaluation.confidence >= 0 && evaluation.confidence <= 100);
    assert.ok(evaluation.explanation.length >= 10);
    assert.ok(["SELL", "REVIEW", "REJECT"].includes(evaluation.overallRecommendation));
    assert.ok(evaluation.guardianVerdict.reasons.length >= 1);
  });

  it("detects fake suppliers with high fakeSupplierRisk and REJECT recommendation", () => {
    const fake = evaluateSupplier({ supplierId: "sup-fake-001", workspaceId: "ws_sie_fake" });
    assert.ok(fake.fakeSupplierRisk >= 65);
    assert.equal(fake.overallRecommendation, "REJECT");
    assert.ok(fake.guardianVerdict.flags.includes("fake_supplier_risk"));
  });

  it("assigns trust score from independent dimension scores", () => {
    const supplier = getMockSupplier("sup-zendrop-001");
    assert.ok(supplier);

    const scores = computeAllScores(supplier, { supplierId: supplier.id });
    const expectedTrust = computeTrustScore({
      qualityScore: scores.qualityScore,
      shippingScore: scores.shippingScore,
      reliabilityScore: scores.reliabilityScore,
      pricingScore: scores.pricingScore,
      fakeSupplierRisk: scores.fakeSupplierRisk,
    });

    assert.equal(scores.trustScore, expectedTrust);
    assert.ok(scores.fakeSupplierRisk < 30);
  });

  it("compareSuppliers ranks trusted suppliers above fake ones", () => {
    const comparison = compareSuppliers("ws_sie_compare", [
      "sup-fake-001",
      "sup-spocket-001",
      "sup-cj-001",
    ]);

    assert.equal(comparison.evaluations.length, 3);
    assert.equal(comparison.bestSupplierId, "sup-spocket-001");
    assert.equal(comparison.ranking[0], "sup-spocket-001");
    assert.ok(comparison.explanation.includes("Spocket"));
  });

  it("recommendation engine applies threshold rules without recalculating scores", () => {
    const scores = {
      trustScore: 80,
      qualityScore: 82,
      shippingScore: 88,
      reliabilityScore: 85,
      pricingScore: 78,
      profitMarginEstimate: 48,
      fakeSupplierRisk: 12,
    };
    const guardianVerdict = supplierIntelligenceGuard.assess(scores, true);
    const result = deriveSupplierRecommendation({
      supplierName: "Threshold Probe Supplier",
      scores,
      guardianVerdict,
    });

    assert.equal(result.overallRecommendation, "SELL");
    assert.ok(result.explanation.includes("Threshold Probe Supplier"));
  });

  it("rejects suppliers below trust threshold via recommendation engine", () => {
    const supplier = getMockSupplier("sup-fraud-002");
    assert.ok(supplier);
    const fakeRisk = computeFakeSupplierRisk(supplier);
    assert.ok(fakeRisk >= DEFAULT_SUPPLIER_RECOMMENDATION_THRESHOLDS.rejectFakeRiskMin);

    const evaluation = evaluateSupplier({ supplierId: "sup-fraud-002", workspaceId: "ws_sie_reject" });
    assert.equal(evaluation.overallRecommendation, "REJECT");
  });

  it("persists evaluations to supplier_intelligence_evaluations table", () => {
    const evaluation = evaluateSupplier({ supplierId: "sup-cj-001", workspaceId: "ws_sie_persist" });
    supplierIntelligenceEvaluationEngine.persist(evaluation, "ws_sie_persist");

    const count = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM supplier_intelligence_evaluations WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_sie_persist" }) as { c: number }
    ).c;
    assert.ok(count >= 1);
  });

  it("bootstrapFoundation seeds supplier evaluations idempotently", () => {
    bootstrapFoundation("ws_sie_foundation");
    bootstrapFoundation("ws_sie_foundation");

    const count = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM supplier_intelligence_evaluations WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_sie_foundation" }) as { c: number }
    ).c;

    const verifiedCount = listMockCatalog().filter(
      (s) => !s.id.startsWith("sup-fake") && !s.id.startsWith("sup-fraud"),
    ).length;
    assert.equal(count, verifiedCount);
  });

  it("registers SupplierIntelligenceModule in Brain Contract registry", () => {
    assert.ok(intelligenceModuleRegistry.has("supplier-intelligence"));
    const mod = intelligenceModuleRegistry.get("supplier-intelligence");
    assert.equal(mod?.moduleId, "supplier-intelligence");
    assert.ok(mod?.capabilities.includes("supplier-intelligence.evaluate"));
  });

  it("Brain Contract module executes evaluate action", async () => {
    const result = await supplierIntelligenceModule.execute({
      id: "task-sie-1",
      moduleId: "supplier-intelligence",
      action: "supplier-intelligence.evaluate",
      workspaceId: "ws_sie_contract",
      input: { supplierId: "sup-spocket-001" },
      correlationId: "corr-sie-1",
      requestedAt: new Date().toISOString(),
    });

    assert.equal(result.status, "completed");
    assert.ok(result.output?.evaluation);
    assert.ok(result.confidence > 0);
  });

  it("architecture validation includes supplier-intelligence-engine check", () => {
    bootstrapFoundation("ws_sie_arch");
    const report = architectureValidator.validate("ws_sie_arch");
    const checkIds = report.checks.map((c) => c.id);
    assert.ok(checkIds.includes("supplier-intelligence-engine"));
    const sieCheck = report.checks.find((c) => c.id === "supplier-intelligence-engine");
    assert.ok(sieCheck?.status === "healthy" || sieCheck?.status === "degraded");
  });
});
