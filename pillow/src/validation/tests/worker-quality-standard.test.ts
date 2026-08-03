import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  QUALITY_STANDARDS,
  WQS_CAPABILITIES,
  buildWorkerQualityStandardConfiguration,
  createWorkerQualityStandard,
  resetWorkerQualityStandardForTesting,
} from "../../worker-quality-standard/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerQualityStandard>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerQualityStandard(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerQualityStandard();
  return engine;
}

const compliantInput = {
  workerId: "wcr-wkr-strategy-01",
  missionId: "Q0-27",
  reasoningSummary: "Evaluated options, weighed tradeoffs, and selected the safer expansion path.",
  confidenceScore: 82,
  evidence: ["artifact:expansion-brief"],
  assumptions: ["market_demand_stable"],
  limitations: ["limited_regional_data"],
  structuredReasoningPerformed: true,
  selfValidationPerformed: true,
  governanceCompliant: true,
  completionReport: "Worker completed with full quality package.",
  validated: true,
};

describe("Q0-27 Worker Quality Standard", () => {
  beforeEach(resetWorkerQualityStandardForTesting);

  test("1 locks mandatory worker-quality-standard boundaries", () => {
    const c = buildWorkerQualityStandardConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkerImplementations: false as never,
      neverReplacePeerReviewRuntime: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkerImplementations, true);
    assert.equal(c.neverReplacePeerReviewRuntime, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WQS-001 for Q0-27", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-27");
    assert.equal(state.engineVersion, "PILLOW-WQS-001");
    for (const standard of QUALITY_STANDARDS) {
      assert.ok(state.configuration.qualityStandards.includes(standard));
    }
  });

  test("3 validates worker quality as compliant", async () => {
    const report = (await build()).validateWorkerQuality(compliantInput);
    assert.equal(report.qualityDecision, "compliant");
    assert.equal(report.records[0]!.validationResult, "compliant");
    assert.ok(report.records[0]!.qualityRecordId.startsWith("wqs-qr-"));
    assert.equal(report.standardsFailed.length, 0);
  });

  test("4 scores confidence", async () => {
    const report = (await build()).scoreConfidence({
      ...compliantInput,
      confidenceScore: 91,
    });
    assert.equal(report.confidenceScore, 91);
    assert.equal(report.records[0]!.confidenceScore, 91);
  });

  test("5 records evidence", async () => {
    const report = (await build()).recordEvidence({
      ...compliantInput,
      evidence: ["artifact:ops-log", "metric:conversion"],
    });
    assert.ok(report.records[0]!.evidence.includes("artifact:ops-log"));
    assert.ok(report.records[0]!.evidence.includes("metric:conversion"));
  });

  test("6 records assumptions", async () => {
    const report = (await build()).recordAssumptions({
      ...compliantInput,
      assumptions: ["supplier_capacity_ok", "budget_unchanged"],
    });
    assert.ok(report.records[0]!.assumptions.includes("supplier_capacity_ok"));
    assert.ok(report.records[0]!.assumptions.includes("budget_unchanged"));
  });

  test("7 reports limitations and detects uncertainty", async () => {
    const report = (await build()).reportLimitations({
      ...compliantInput,
      limitations: ["uncertain_demand_forecast"],
      uncertaintySignals: ["forecast_gap"],
      confidenceScore: 55,
    });
    assert.ok(report.records[0]!.limitations.includes("uncertain_demand_forecast"));
    assert.equal(report.records[0]!.uncertaintyDetected, true);
  });

  test("8 rejects execute / replace-worker / peer-review / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.validateWorkerQuality({ ...compliantInput, executeWorkerTasks: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.scoreConfidence({
        ...compliantInput,
        replaceWorkerImplementations: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordEvidence({
        ...compliantInput,
        replacePeerReviewRuntime: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.checkGovernance({ ...compliantInput, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.reportLimitations({ ...compliantInput, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WQS_CAPABILITIES.includes("extensible_quality_standards"));
  });

  test("9 supports extensible quality standards", async () => {
    const engine = await build({
      configuration: {
        qualityStandards: [...QUALITY_STANDARDS, "tool_discipline"],
      },
    });
    assert.ok(engine.getState().configuration.qualityStandards.includes("tool_discipline"));
  });

  test("10 produces machine-readable quality records and validates them", async () => {
    const engine = await build();
    engine.validateWorkerQuality(compliantInput);
    const validation = engine.validateWorkerQualityStandard({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.workerImplementationsReplaced, false);
    assert.equal(record.peerReviewRuntimeReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "WQS-001-v1");
    assert.ok(record.qualityRecordId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.missionId);
    assert.ok(record.reasoningSummary);
    assert.ok(typeof record.confidenceScore === "number");
    assert.ok(Array.isArray(record.evidence));
    assert.ok(Array.isArray(record.assumptions));
    assert.ok(Array.isArray(record.limitations));
    assert.ok(record.validationResult);
    assert.equal(typeof record.governanceCompliance, "boolean");
  });
});
