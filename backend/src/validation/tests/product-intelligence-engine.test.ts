import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { configureValidationEnvironment } from "../harness.js";
import {
  bootstrapFoundation,
  evaluateProduct,
  productIntelligenceEvaluationEngine,
  buildMockEvaluationInput,
  PIE_MOCK_EVALUATIONS,
} from "../../foundation/index.js";
import { architectureValidator } from "../../guardian/architecture-validator.js";
import { getDatabase } from "../../brain/database.js";
import {
  computeAllScores,
  computeCompetitionScore,
  computeDemandScore,
  computeMarginScore,
  computeShippingScore,
  computeSupplierReliability,
} from "../../intelligence/product-intelligence-engine/score-computers.js";
import {
  DEFAULT_RECOMMENDATION_THRESHOLDS,
  deriveRecommendation,
} from "../../intelligence/product-intelligence-engine/recommendation-engine.js";

configureValidationEnvironment();

describe("Mission 005 Product Intelligence Engine", () => {
  it("computes each score independently from input signals", () => {
    const input = buildMockEvaluationInput(0);
    const scores = computeAllScores(input);

    const demandOnly = computeDemandScore(input.historicalDemand);
    const competitionOnly = computeCompetitionScore(input.competitionScore);
    const marginOnly = computeMarginScore(
      input.purchasePriceCents,
      input.estimatedSellingPriceCents,
      input.shippingCostCents,
    );
    const shippingOnly = computeShippingScore(
      input.shippingCostCents,
      input.estimatedSellingPriceCents,
      input.supplierData,
    );
    const supplierOnly = computeSupplierReliability(input.supplierData);

    assert.equal(scores.demandScore, demandOnly);
    assert.equal(scores.competitionScore, competitionOnly);
    assert.equal(scores.marginScore, marginOnly);
    assert.equal(scores.shippingScore, shippingOnly);
    assert.equal(scores.supplierReliability, supplierOnly);
  });

  it("evaluateProduct returns all required output fields", () => {
    const evaluation = evaluateProduct(buildMockEvaluationInput(3));
    assert.ok(evaluation.demandScore >= 0 && evaluation.demandScore <= 100);
    assert.ok(evaluation.competitionScore >= 0 && evaluation.competitionScore <= 100);
    assert.ok(evaluation.marginScore >= 0 && evaluation.marginScore <= 100);
    assert.ok(evaluation.shippingScore >= 0 && evaluation.shippingScore <= 100);
    assert.ok(evaluation.supplierReliability >= 0 && evaluation.supplierReliability <= 100);
    assert.ok(evaluation.overallScore >= 0 && evaluation.overallScore <= 100);
    assert.ok(evaluation.confidence >= 0 && evaluation.confidence <= 100);
    assert.ok(evaluation.explanation.length >= 10);
    assert.ok(["SELL", "DO_NOT_SELL", "REVIEW"].includes(evaluation.recommendation));
  });

  it("recommends SELL for strong mock product (pet hair remover)", () => {
    const evaluation = evaluateProduct(buildMockEvaluationInput(3));
    assert.equal(evaluation.recommendation, "SELL");
    assert.ok(evaluation.overallScore >= DEFAULT_RECOMMENDATION_THRESHOLDS.sellOverallMin);
  });

  it("recommends DO_NOT_SELL for weak mock product (mystery gadget)", () => {
    const evaluation = evaluateProduct(buildMockEvaluationInput(1));
    assert.equal(evaluation.recommendation, "DO_NOT_SELL");
    assert.ok(evaluation.marginScore <= DEFAULT_RECOMMENDATION_THRESHOLDS.rejectMarginMax + 5);
  });

  it("recommends REVIEW for mixed-signal product (generic phone case)", () => {
    const evaluation = evaluateProduct(buildMockEvaluationInput(4));
    assert.equal(evaluation.recommendation, "REVIEW");
  });

  it("recommendation engine applies threshold rules without recalculating scores", () => {
    const scores = {
      demandScore: 80,
      competitionScore: 70,
      marginScore: 75,
      shippingScore: 65,
      supplierReliability: 78,
    };
    const result = deriveRecommendation({
      scores,
      overallScore: 76,
      confidence: 80,
      productTitle: "Threshold Probe",
    });
    assert.equal(result.recommendation, "SELL");
    assert.ok(result.explanation.includes("Threshold Probe"));
  });

  it("persists evaluations to product_intelligence_evaluations table", () => {
    const evaluation = evaluateProduct(buildMockEvaluationInput(0));
    productIntelligenceEvaluationEngine.persist(evaluation, "ws_pie_eval_persist", "pie-test-1");
    const count = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM product_intelligence_evaluations WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_pie_eval_persist" }) as { c: number }
    ).c;
    assert.ok(count >= 1);
  });

  it("bootstrapFoundation seeds PIE evaluations idempotently", () => {
    bootstrapFoundation("ws_pie_foundation");
    bootstrapFoundation("ws_pie_foundation");
    const count = (
      getDatabase()
        .prepare(
          `SELECT COUNT(*) AS c FROM product_intelligence_evaluations WHERE workspace_id = @workspaceId`,
        )
        .get({ workspaceId: "ws_pie_foundation" }) as { c: number }
    ).c;
    assert.equal(count, PIE_MOCK_EVALUATIONS.length);
  });

  it("architecture validation includes product-intelligence-engine check", () => {
    bootstrapFoundation("ws_pie_arch");
    const report = architectureValidator.validate("ws_pie_arch");
    const checkIds = report.checks.map((c) => c.id);
    assert.ok(checkIds.includes("product-intelligence-engine"));
    const pieCheck = report.checks.find((c) => c.id === "product-intelligence-engine");
    assert.ok(pieCheck?.status === "healthy" || pieCheck?.status === "degraded");
  });
});
