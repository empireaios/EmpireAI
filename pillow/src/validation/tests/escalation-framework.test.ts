import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ESCALATION_CATEGORIES,
  ESCALATION_PRIORITIES,
  ESF_CAPABILITIES,
  buildEscalationFrameworkConfiguration,
  createEscalationFramework,
  resetEscalationFrameworkForTesting,
} from "../../escalation-framework/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEscalationFramework>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEscalationFramework(bootstrap, config);
  await engine.initialize();
  engine.connectEscalationFramework();
  return engine;
}

describe("Q0-22 Escalation Framework", () => {
  beforeEach(resetEscalationFrameworkForTesting);

  test("1 locks mandatory escalation-framework boundaries", () => {
    const c = buildEscalationFrameworkConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverResolveBusinessDisputes: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverReplaceExecutiveJudgement: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverResolveBusinessDisputes, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverReplaceExecutiveJudgement, true);
  });

  test("2 initializes PILLOW-ESF-001 for Q0-22", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-22");
    assert.equal(state.engineVersion, "PILLOW-ESF-001");
    for (const category of ESCALATION_CATEGORIES) {
      assert.ok(state.configuration.escalationCategories.includes(category));
    }
    for (const priority of ESCALATION_PRIORITIES) {
      assert.ok(["critical", "high", "medium", "low"].includes(priority));
    }
  });

  test("3 escalates low confidence to Pillow", async () => {
    const report = (await build()).escalateLowConfidence({
      missionId: "Q0-22",
      taskId: "task-low-conf-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-strategy-01"],
      signals: { confidenceScore: 35 },
      validated: true,
    });
    assert.equal(report.records[0]!.escalationCategory, "low_confidence");
    assert.ok(report.detectedConditions.includes("low_confidence"));
    assert.equal(report.routedToPillow, true);
    assert.equal(report.records[0]!.currentStatus, "routed_to_pillow");
  });

  test("4 escalates missing information to Pillow", async () => {
    const report = (await build()).escalateMissingInformation({
      missionId: "Q0-22",
      taskId: "task-missing-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-ops-01"],
      signals: { missingFields: ["budget", "market_size"] },
      validated: true,
    });
    assert.equal(report.records[0]!.escalationCategory, "missing_information");
    assert.ok(report.detectedConditions.includes("missing_information"));
    assert.ok(report.records[0]!.currentEvidence.some((e) => e.includes("missing:budget")));
    assert.equal(report.routedToPillow, true);
  });

  test("5 escalates conflicting recommendations to Pillow", async () => {
    const report = (await build()).escalateConflictingRecommendations({
      missionId: "Q0-22",
      taskId: "task-conflict-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-strategy-01", "wcr-wkr-finance-01"],
      signals: {
        conflictingRecommendations: ["expand_now", "pause_expansion"],
        unresolvedDisagreement: true,
      },
      validated: true,
    });
    assert.equal(report.records[0]!.escalationCategory, "conflicting_recommendations");
    assert.ok(report.detectedConditions.includes("conflicting_recommendations"));
    assert.equal(report.routedToPillow, true);
    assert.equal(report.escalationPriority, "high");
  });

  test("6 escalates worker deadlock to Pillow", async () => {
    const report = (await build()).escalateWorkerDeadlock({
      missionId: "Q0-22",
      taskId: "task-deadlock-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-ops-01", "wcr-wkr-ops-02"],
      signals: { workerDeadlock: true },
      validated: true,
    });
    assert.equal(report.records[0]!.escalationCategory, "worker_deadlock");
    assert.ok(report.detectedConditions.includes("worker_deadlock"));
    assert.equal(report.routedToPillow, true);
    assert.equal(report.escalationPriority, "high");
  });

  test("7 escalates executive decision required to Pillow", async () => {
    const report = (await build()).escalateExecutiveDecision({
      missionId: "Q0-22",
      taskId: "task-exec-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-strategy-01"],
      signals: { executiveDecisionRequired: true },
      riskLevel: "high",
      riskSummary: "Capital allocation requires Pillow authority",
      validated: true,
    });
    assert.equal(report.records[0]!.escalationCategory, "executive_decision_required");
    assert.ok(report.detectedConditions.includes("executive_decision_required"));
    assert.equal(report.routedToPillow, true);
    assert.equal(report.records[0]!.pillowNotified, true);
  });

  test("8 rejects execute / dispute / Pillow / Grand King / judgement boundaries", async () => {
    const engine = await build();
    const base = {
      missionId: "Q0-22",
      taskId: "task-boundary",
      businessId: "biz-marketplace",
      validated: true,
    };
    assert.equal(
      engine.generateEscalation({ ...base, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateEscalation({ ...base, resolveBusinessDisputes: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.routeEscalationToPillow({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.detectEscalation({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.escalateExecutiveDecision({
        ...base,
        replaceExecutiveJudgement: true,
      }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible escalation categories", async () => {
    const engine = await build({
      configuration: {
        escalationCategories: [...ESCALATION_CATEGORIES, "regulatory_hold"],
      },
    });
    assert.ok(engine.getState().configuration.escalationCategories.includes("regulatory_hold"));
    assert.ok(ESF_CAPABILITIES.includes("extensible_escalation_categories"));
  });

  test("10 produces machine-readable escalation records and validates them", async () => {
    const engine = await build();
    engine.generateEscalation({
      missionId: "Q0-22",
      taskId: "task-validate-01",
      businessId: "biz-marketplace",
      relatedWorkers: ["wcr-wkr-strategy-01"],
      signals: { confidenceScore: 40, missingFields: ["owner"] },
      validated: true,
    });
    const validation = engine.validateEscalationFramework({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.businessDisputesResolved, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.executiveJudgementReplaced, false);
    assert.equal(record.metadataVersion, "ESF-001-v1");
    assert.ok(record.escalationId);
    assert.ok(record.timestamp);
    assert.ok(record.escalationCategory);
    assert.ok(record.triggerReason);
    assert.ok(record.riskAssessment.summary);
    assert.ok(record.recommendedActions.length >= 1);
    assert.ok(record.escalationPriority);
    assert.ok(record.currentStatus);
  });
});
