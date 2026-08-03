import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DMEM_CAPABILITIES,
  LOOKUP_DIMENSIONS,
  buildDecisionMemoryConfiguration,
  createDecisionMemory,
  resetDecisionMemoryForTesting,
} from "../../decision-memory/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDecisionMemory(bootstrap);
  await engine.initialize();
  engine.connectDecisionMemory();
  return engine;
}

function sampleDecision(overrides: Record<string, unknown> = {}) {
  return {
    executiveObjective: "Choose phased marketplace expansion path",
    businessId: "biz-marketplace-alpha",
    missionId: "Q0-12",
    decisionSummary: "Adopt phased marketplace expansion with compliance gates",
    recommendedOption: "phased_expansion",
    alternativeOptions: [
      { optionId: "opt-aggressive", summary: "Aggressive full launch", rejectedReason: "risk_too_high" },
      { optionId: "opt-hold", summary: "Hold indefinitely", rejectedReason: "missed_opportunity" },
    ],
    decisionRationale: "Balances growth opportunity against compliance and cost risk",
    supportingEvidence: ["routing_confidence_high", "grand_king_feedback_present"],
    assumptions: ["compliance_capacity_available", "budget_within_ceiling"],
    riskLevel: "medium" as const,
    riskSummary: "Moderate compliance and cost exposure",
    riskFactors: ["policy_variance", "cost_ceiling"],
    confidenceScore: 82,
    approvalStatus: "approved" as const,
    finalOutcome: "pending" as const,
    relatedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-compliance-01"],
    validated: true as const,
    ...overrides,
  };
}

describe("Q0-16 Decision Memory", () => {
  beforeEach(resetDecisionMemoryForTesting);

  test("1 locks mandatory decision-memory boundaries", () => {
    const c = buildDecisionMemoryConfiguration(REPO_ROOT, {
      neverMakeDecisions: false as never,
      neverExecuteWork: false as never,
      neverReplaceExecutionMemory: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverMakeDecisions, true);
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverReplaceExecutionMemory, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-DMEM-001 for Q0-16", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-16");
    assert.equal(state.engineVersion, "PILLOW-DMEM-001");
    for (const dimension of LOOKUP_DIMENSIONS) {
      assert.ok(state.configuration.lookupDimensions.includes(dimension));
    }
  });

  test("3 records executive decisions with rationale, evidence, and alternatives", async () => {
    const record = (await build()).recordDecision(sampleDecision()).records[0]!;
    assert.ok(record.decisionId.startsWith("dmem-dec-"));
    assert.equal(record.recommendedOption, "phased_expansion");
    assert.ok(record.alternativeOptions.length >= 2);
    assert.ok(record.supportingEvidence.length >= 1);
    assert.ok(record.assumptions.length >= 1);
    assert.equal(record.decisionsMade, false);
    assert.equal(record.metadataVersion, "DMEM-001-v1");
  });

  test("4 retrieves historical decisions by decision ID", async () => {
    const engine = await build();
    const recorded = engine.recordDecision(sampleDecision()).records[0]!;
    const retrieved = engine.retrieveDecision({
      decisionId: recorded.decisionId,
      validated: true,
    }).records[0]!;
    assert.equal(retrieved.decisionId, recorded.decisionId);
    assert.equal(retrieved.businessId, "biz-marketplace-alpha");
  });

  test("5 searches by business, mission, and confidence", async () => {
    const engine = await build();
    engine.recordDecision(sampleDecision());
    engine.recordDecision(
      sampleDecision({
        businessId: "biz-finance-beta",
        missionId: "Q0-15",
        confidenceScore: 61,
        recommendedOption: "finance_close_standard",
        decisionSummary: "Use standard finance close playbook",
      }),
    );

    const byBusiness = engine.searchDecisions({
      dimension: "business",
      businessId: "biz-marketplace-alpha",
      validated: true,
    }).records;
    assert.ok(byBusiness.every((r) => r.businessId === "biz-marketplace-alpha"));

    const byMission = engine.searchDecisions({
      dimension: "mission",
      missionId: "Q0-15",
      validated: true,
    }).records;
    assert.ok(byMission.every((r) => r.missionId === "Q0-15"));

    const byConfidence = engine.searchDecisions({
      dimension: "confidence",
      minConfidence: 80,
      validated: true,
    }).records;
    assert.ok(byConfidence.every((r) => r.confidenceScore >= 80));
  });

  test("6 compares previous decisions", async () => {
    const engine = await build();
    const a = engine.recordDecision(sampleDecision()).records[0]!;
    const b = engine.recordDecision(
      sampleDecision({
        recommendedOption: "aggressive_launch",
        confidenceScore: 55,
        assumptions: ["compliance_capacity_available", "unlimited_budget"],
        finalOutcome: "failure",
      }),
    ).records[0]!;
    const comparison = engine.compareDecisions({
      compareDecisionIds: [a.decisionId, b.decisionId],
      validated: true,
    });
    assert.equal(comparison.comparisons.length, 1);
    assert.ok(comparison.comparisons[0]!.sharedAssumptions.includes("compliance_capacity_available"));
    assert.ok(comparison.comparisons[0]!.differingOptions.length >= 1);
  });

  test("7 updates final outcomes and produces machine-readable records", async () => {
    const engine = await build();
    const recorded = engine.recordDecision(sampleDecision()).records[0]!;
    const updated = engine.updateDecisionOutcome({
      decisionId: recorded.decisionId,
      finalOutcome: "success",
      validated: true,
    }).records[0]!;
    assert.equal(updated.finalOutcome, "success");
    assert.equal(updated.neverReplaceExecutionMemory, true);
    assert.equal(updated.executionMemoryReplaced, false);
  });

  test("8 rejects make-decisions / execute / replace memory / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = sampleDecision();
    assert.equal(engine.recordDecision({ ...base, makeDecisions: true }).validation.decision, "fail");
    assert.equal(engine.recordDecision({ ...base, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.recordDecision({ ...base, replaceExecutionMemory: true }).validation.decision, "fail");
    assert.equal(engine.recordDecision({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.recordDecision({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports extensible lookup dimensions", async () => {
    const engine = createDecisionMemory(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { lookupDimensions: [...LOOKUP_DIMENSIONS, "risk_level"] } },
    );
    await engine.initialize();
    engine.connectDecisionMemory();
    assert.ok(engine.getState().configuration.lookupDimensions.includes("risk_level"));
    assert.ok(DMEM_CAPABILITIES.includes("extensible_lookup_dimensions"));
  });

  test("10 validates stored decision records", async () => {
    const engine = await build();
    engine.recordDecision(sampleDecision());
    const validation = engine.validateDecisionMemory({ validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
