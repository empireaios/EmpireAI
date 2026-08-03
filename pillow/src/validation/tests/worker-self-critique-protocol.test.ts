import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CRITIQUE_CHECKS,
  SUBMISSION_DECISIONS,
  WSCP_CAPABILITIES,
  buildWorkerSelfCritiqueProtocolConfiguration,
  createWorkerSelfCritiqueProtocol,
  resetWorkerSelfCritiqueProtocolForTesting,
} from "../../worker-self-critique-protocol/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerSelfCritiqueProtocol>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerSelfCritiqueProtocol(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerSelfCritiqueProtocol();
  return engine;
}

/** Strong completed output — should pass self-critique and allow submit. */
const completedOutput = {
  workerId: "wcr-wkr-strategy-01",
  missionId: "Q0-28",
  outputReviewed: "Completed expansion brief with ranked options and evidence package.",
  completenessScore: 92,
  logicalConsistency: 90,
  factualConsistency: 88,
  evidenceReview: ["artifact:expansion-brief", "metric:conversion"],
  assumptionsIdentified: ["market_demand_stable"],
  missingEvidence: [] as string[],
  initialConfidenceScore: 90,
  validated: true,
};

describe("Q0-28 Worker Self-Critique Protocol", () => {
  beforeEach(resetWorkerSelfCritiqueProtocolForTesting);

  test("1 locks mandatory worker-self-critique-protocol boundaries", () => {
    const c = buildWorkerSelfCritiqueProtocolConfiguration(REPO_ROOT, {
      neverReplacePeerReviewRuntime: false as never,
      neverReplaceWorkerQualityStandard: false as never,
      neverExecuteWorkerTasks: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverReplacePeerReviewRuntime, true);
    assert.equal(c.neverReplaceWorkerQualityStandard, true);
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WSCP-001 for Q0-28", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-28");
    assert.equal(state.engineVersion, "PILLOW-WSCP-001");
    for (const check of CRITIQUE_CHECKS) {
      assert.ok(state.configuration.critiqueChecks.includes(check));
    }
    for (const decision of SUBMISSION_DECISIONS) {
      assert.ok(state.configuration.submissionDecisions.includes(decision));
    }
  });

  test("3 worker completes a task then performs self-critique", async () => {
    const engine = await build();
    const completedTask = {
      ...completedOutput,
      outputReviewed: "Task complete: regional expansion analysis delivered.",
    };
    const report = engine.critiqueOutput(completedTask);
    assert.equal(report.action, "critique");
    assert.ok(report.records.length >= 1);
    assert.equal(report.records[0]!.workerId, "wcr-wkr-strategy-01");
    assert.equal(report.records[0]!.missionId, "Q0-28");
    assert.ok(report.records[0]!.outputReviewed.includes("Task complete"));
    assert.ok(report.records[0]!.selfCritiqueId.startsWith("wscp-sc-"));
  });

  test("4 identifies weaknesses in weak completed output", async () => {
    const report = (await build()).identifyWeaknesses({
      ...completedOutput,
      completenessScore: 40,
      logicalConsistency: 45,
      factualConsistency: 50,
      evidenceReview: [],
      missingEvidence: ["source:market-data"],
      initialConfidenceScore: 70,
    });
    assert.ok(report.weaknessesFound.length > 0);
    assert.ok(report.records[0]!.weaknessesFound.includes("incomplete_output"));
    assert.ok(report.records[0]!.suggestedImprovements.length > 0);
  });

  test("5 recalculates confidence score from critique signals", async () => {
    const report = (await build()).recalculateConfidence({
      ...completedOutput,
      completenessScore: 50,
      logicalConsistency: 55,
      factualConsistency: 60,
      missingEvidence: ["cite:ops-log"],
      initialConfidenceScore: 85,
    });
    assert.ok(typeof report.revisedConfidenceScore === "number");
    assert.ok(report.revisedConfidenceScore! < 85);
    assert.equal(report.records[0]!.initialConfidenceScore, 85);
    assert.ok(report.records[0]!.revisedConfidenceScore < 85);
  });

  test("6 triggers revision when required before submission", async () => {
    const engine = await build();
    const revise = engine.decideSubmission({
      ...completedOutput,
      forceRevision: true,
    });
    assert.equal(revise.submissionDecision, "revise_before_submit");
    assert.equal(revise.revisionRequired, true);

    const weak = engine.critiqueOutput({
      ...completedOutput,
      completenessScore: 65,
      logicalConsistency: 85,
      factualConsistency: 85,
      evidenceReview: ["artifact:partial"],
      assumptionsIdentified: ["demand_ok"],
      missingEvidence: [],
      initialConfidenceScore: 70,
    });
    assert.equal(weak.submissionDecision, "revise_before_submit");
    assert.equal(weak.revisionRequired, true);
  });

  test("7 allows submit when self-critique clears quality bar", async () => {
    const report = (await build()).critiqueOutput({
      ...completedOutput,
      forceDecision: "submit",
    });
    assert.equal(report.submissionDecision, "submit");
    assert.equal(report.revisionRequired, false);
    assert.equal(report.records[0]!.submissionDecision, "submit");
  });

  test("8 rejects peer-review / WQS / execute / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.critiqueOutput({ ...completedOutput, replacePeerReviewRuntime: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.checkCompleteness({
        ...completedOutput,
        replaceWorkerQualityStandard: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.checkConsistency({ ...completedOutput, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.identifyWeaknesses({ ...completedOutput, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.decideSubmission({ ...completedOutput, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WSCP_CAPABILITIES.includes("extensible_critique_checks"));
  });

  test("9 supports extensible critique checks", async () => {
    const engine = await build({
      configuration: {
        critiqueChecks: [...CRITIQUE_CHECKS, "tool_discipline"],
      },
    });
    assert.ok(engine.getState().configuration.critiqueChecks.includes("tool_discipline"));
  });

  test("10 produces machine-readable self-critique records and validates them", async () => {
    const engine = await build();
    engine.critiqueOutput(completedOutput);
    const validation = engine.validateWorkerSelfCritiqueProtocol({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.ok(record.selfCritiqueId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.missionId);
    assert.ok(record.outputReviewed);
    assert.ok(typeof record.completenessScore === "number");
    assert.ok(typeof record.logicalConsistency === "number");
    assert.ok(Array.isArray(record.evidenceReview));
    assert.ok(Array.isArray(record.weaknessesFound));
    assert.ok(Array.isArray(record.suggestedImprovements));
    assert.ok(typeof record.revisedConfidenceScore === "number");
    assert.ok(record.submissionDecision);
    assert.equal(record.metadataVersion, "WSCP-001-v1");
    assert.equal(record.peerReviewRuntimeReplaced, false);
    assert.equal(record.workerQualityStandardReplaced, false);
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
  });
});
