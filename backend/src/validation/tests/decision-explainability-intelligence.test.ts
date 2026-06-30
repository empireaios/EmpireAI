import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  CERTAINTY_LEVELS,
  DECISION_TYPES,
  EVIDENCE_CATEGORIES,
  EVIDENCE_SOURCES,
  TRADEOFF_DIMENSIONS,
  createDecisionExplainabilityIntelligenceModule,
  createInMemoryDecisionExplainabilityIntelligenceRepository,
  generateDecisionExplainability,
  validateDecisionExplainabilityReport,
  type DecisionType,
} from "../../execution/decision-explainability-intelligence/index.js";

const WORKSPACE_ID = "ws-m092";

function buildExplainabilityInput(
  storeId = randomUUID(),
  decisionType: DecisionType = "MARKETING",
) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 85,
    },
    decision: {
      decisionType,
      decisionTitle: "Scale Meta Ads for Q3",
      chosenOption: "Increase Meta Ads budget by 25%",
      context: "Strong ROAS and rising demand in kitchen appliances",
    },
    storeId,
    decisionIndex: 78,
  };
}

describe("Mission 092 Decision Explainability Intelligence Engine", () => {
  it("generates explainability report with safety flags", async () => {
    const module = createDecisionExplainabilityIntelligenceModule();
    const record = await module.persistExplainability(WORKSPACE_ID, buildExplainabilityInput());

    assert.ok(record.reportId);
    assert.equal(record.decisionType, "MARKETING");
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoExecuteEnabled, false);
    assert.ok(record.explainabilityScore >= 55);
    assert.ok(record.overallScore >= 50);
    assert.ok(
      record.supportingSignals.some((signal) => signal.signalType === "decision_composite"),
    );
  });

  it("generates structured reasoning with steps and conclusion", () => {
    const reasoning = generateDecisionExplainability(buildExplainabilityInput()).reasoning;

    assert.ok(reasoning.summary.length > 0);
    assert.ok(reasoning.steps.length >= 2);
    for (const step of reasoning.steps) {
      assert.ok(step.stepOrder >= 1);
      assert.ok(step.claim.length > 0);
      assert.ok(step.rationale.length > 0);
    }
    assert.ok(reasoning.conclusion.length > 0);
    assert.ok(reasoning.score >= 0 && reasoning.score <= 100);
  });

  it("collects evidence from multiple sources", () => {
    const evidence = generateDecisionExplainability(buildExplainabilityInput()).evidence;

    assert.ok(evidence.length >= 3);
    for (const item of evidence) {
      assert.ok(EVIDENCE_SOURCES.includes(item.source));
      assert.ok(EVIDENCE_CATEGORIES.includes(item.category));
      assert.ok(item.weight >= 0 && item.weight <= 1);
      assert.ok(item.reliabilityPercent >= 0 && item.reliabilityPercent <= 100);
    }
  });

  it("assesses confidence with certainty level", () => {
    const confidence = generateDecisionExplainability(buildExplainabilityInput()).confidence;

    assert.ok(confidence.overallConfidence >= 0 && confidence.overallConfidence <= 100);
    assert.ok(CERTAINTY_LEVELS.includes(confidence.certaintyLevel));
    assert.ok(confidence.factors.length >= 1);
    assert.ok(Array.isArray(confidence.uncertaintyNotes));
  });

  it("evaluates alternatives with rejection reasons", () => {
    const alternatives = generateDecisionExplainability(buildExplainabilityInput()).alternatives;

    assert.ok(alternatives.length >= 2);
    const selected = alternatives.filter((alt) => alt.selected);
    const rejected = alternatives.filter((alt) => !alt.selected);
    assert.equal(selected.length, 1);
    assert.ok(rejected.length >= 1);
    for (const alt of rejected) {
      assert.ok(alt.rejectionReason);
    }
    assert.equal(selected[0]!.label, "Increase Meta Ads budget by 25%");
  });

  it("analyzes tradeoffs across dimensions", () => {
    const tradeoffs = generateDecisionExplainability(buildExplainabilityInput()).tradeoffs;

    assert.ok(tradeoffs.length >= 2);
    for (const tradeoff of tradeoffs) {
      assert.ok(TRADEOFF_DIMENSIONS.includes(tradeoff.dimension));
      assert.ok(tradeoff.chosenOption.length > 0);
      assert.ok(tradeoff.rejectedOption.length > 0);
      assert.ok(tradeoff.benefit.length > 0);
      assert.ok(tradeoff.cost.length > 0);
      assert.ok(tradeoff.netImpact.length > 0);
    }
  });

  it("computes weighted supporting signals", () => {
    const report = generateDecisionExplainability(buildExplainabilityInput());

    assert.ok(report.supportingSignals.length >= 5);
    const composite = report.supportingSignals.find(
      (signal) => signal.signalType === "decision_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.explainabilityScore);
  });

  it("covers all decision types in schema", () => {
    for (const decisionType of DECISION_TYPES) {
      const report = generateDecisionExplainability(buildExplainabilityInput(randomUUID(), decisionType));
      assert.equal(report.decisionType, decisionType);
    }
  });

  it("validates decision explainability report schema", () => {
    const report = generateDecisionExplainability(buildExplainabilityInput());
    const validated = validateDecisionExplainabilityReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.reasoning.steps.length >= 1);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoExecuteEnabled, false);
    assert.ok(validated.alternatives.length >= 2);
  });

  it("persists decision explainability records in the repository", async () => {
    const repository = createInMemoryDecisionExplainabilityIntelligenceRepository();
    const module = createDecisionExplainabilityIntelligenceModule(repository);
    const input = buildExplainabilityInput();

    const saved = await module.persistExplainability(WORKSPACE_ID, input);
    const loadedByStore = await module.getExplainabilityByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getExplainabilityRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.explainabilityScore, saved.explainabilityScore);
    assert.equal(loadedById!.evidence.length, saved.evidence.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
