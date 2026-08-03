import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ASSIGNMENT_FACTORS,
  ASSIGNMENT_RULES,
  ASSIGNMENT_VERSION,
  WAE_CAPABILITIES,
  buildWorkerAssignmentEngineConfiguration,
  createWorkerAssignmentEngine,
  resetWorkerAssignmentEngineForTesting,
} from "../../worker-assignment-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerAssignmentEngine>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerAssignmentEngine(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerAssignmentEngine();
  return engine;
}

const researchMission = {
  missionId: "mission-research-01",
  businessId: "empireai",
  requiredSkills: ["skill-research-synthesis"],
  requiredTools: ["research_notebook"],
  requiredAuthority: "autonomous_worker_decision",
  maxRisk: 0.5,
  maxCost: 0.7,
  maxWorkload: 0.9,
  supportingWorkerCount: 1,
  responsibilityDomain: "strategy",
  validated: true,
};

describe("Q1-09 Worker Assignment Engine", () => {
  beforeEach(resetWorkerAssignmentEngineForTesting);

  test("1 locks mandatory worker-assignment-engine boundaries", () => {
    const c = buildWorkerAssignmentEngineConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverReplaceTaskNegotiationProtocol: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverReplaceTaskNegotiationProtocol, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WAE-001 for Q1-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-09");
    assert.equal(state.engineVersion, "PILLOW-WAE-001");
    for (const rule of ASSIGNMENT_RULES) {
      assert.ok(state.configuration.assignmentRules.includes(rule));
    }
    for (const factor of ASSIGNMENT_FACTORS) {
      assert.ok(state.configuration.assignmentFactors.includes(factor));
    }
  });

  test("3 submits mission requirements", async () => {
    const report = (await build()).submitMission(researchMission);
    assert.equal(report.action, "submit_mission");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.workers.length >= 5);
  });

  test("4 discovers and evaluates candidate workers", async () => {
    const engine = await build();
    engine.submitMission(researchMission);
    const discovered = engine.discoverEligibleWorkers({ validated: true });
    assert.equal(discovered.action, "discover_eligible");
    assert.ok(discovered.eligibleWorkers.length >= 1);
    assert.ok(discovered.eligibleWorkers.every((w) => w.certificationStatus === "certified"));
    assert.ok(discovered.eligibleWorkers.every((w) => w.available));

    const evaluated = engine.evaluateCandidates({ validated: true });
    assert.equal(evaluated.action, "evaluate_candidates");
    assert.ok(evaluated.evaluations.length >= 5);
    const strategy = evaluated.evaluations.find((e) => e.workerId === "wkr-strategy-01");
    assert.ok(strategy);
    assert.equal(strategy!.eligible, true);
    assert.ok(strategy!.totalScore > 0);
    const uncertified = evaluated.evaluations.find((e) => e.workerId === "wkr-eng-01");
    assert.equal(uncertified!.eligible, false);
    const suspended = evaluated.evaluations.find((e) => e.workerId === "wkr-suspended-01");
    assert.equal(suspended!.eligible, false);
  });

  test("5 recommends a primary worker", async () => {
    const engine = await build();
    engine.submitMission(researchMission);
    const report = engine.recommendPrimaryWorker({ validated: true });
    assert.equal(report.action, "recommend_primary");
    assert.equal(report.latestAssignment!.selectedPrimaryWorker, "wkr-strategy-01");
    assert.ok(report.latestAssignment!.assignmentReason.includes("Primary=wkr-strategy-01"));
  });

  test("6 recommends supporting workers", async () => {
    const engine = await build();
    const report = engine.recommendSupportingWorkers({
      ...researchMission,
      requiredSkills: ["skill-ops-foundation", "skill-research-synthesis"],
      requiredTools: [],
      responsibilityDomain: null,
      supportingWorkerCount: 1,
    });
    assert.equal(report.action, "recommend_supporting");
    assert.ok(report.latestAssignment!.selectedPrimaryWorker);
    assert.ok(Array.isArray(report.latestAssignment!.supportingWorkers));
  });

  test("7 produces full assignment with reasoning", async () => {
    const engine = await build();
    const report = engine.recommendAssignment(researchMission);
    assert.equal(report.action, "recommend_assignment");
    const assignment = report.latestAssignment!;
    assert.equal(assignment.selectedPrimaryWorker, "wkr-strategy-01");
    assert.ok(assignment.assignmentReason.length > 0);
    assert.ok(assignment.confidenceScore > 0);
    assert.ok(assignment.riskAssessment.overallRisk >= 0);
    assert.ok(assignment.evaluations.length >= 1);
  });

  test("8 produces machine-readable assignment records", async () => {
    const engine = await build();
    engine.recommendAssignment(researchMission);
    const report = engine.produceAssignments({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.assignmentVersion, ASSIGNMENT_VERSION);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(catalog.records.length >= 1);
    const record = catalog.records[0]!;
    assert.ok(record.assignmentId);
    assert.ok(record.timestamp);
    assert.ok(record.missionId);
    assert.ok(record.businessId);
    assert.ok(record.missionRequirements);
    assert.ok(Array.isArray(record.candidateWorkers));
    assert.ok(Array.isArray(record.evaluationCriteria));
    assert.ok(record.selectedPrimaryWorker);
    assert.ok(Array.isArray(record.supportingWorkers));
    assert.ok(record.assignmentReason);
    assert.ok(record.riskAssessment);
    assert.ok(typeof record.estimatedCost === "number");
    assert.ok(typeof record.confidenceScore === "number");
    assert.equal(record.metadataVersion, "WAE-001-v1");
    assert.equal(record.neverExecuteWorkerTasks, true);
  });

  test("9 never assigns uncertified or unavailable workers", async () => {
    const engine = await build();
    const report = engine.recommendAssignment({
      missionId: "mission-eng-blocked",
      requiredSkills: ["skill-engineering-software"],
      requiredTools: ["code_workspace"],
      requiredAuthority: "pillow_approval",
      validated: true,
    });
    assert.notEqual(report.latestAssignment!.selectedPrimaryWorker, "wkr-eng-01");
    const eng = report.latestAssignment!.evaluations.find((e) => e.workerId === "wkr-eng-01")!;
    assert.equal(eng.eligible, false);
    assert.ok(eng.rejectionReasons.some((r) => /certified/i.test(r)));

    const suspendedMission = engine.evaluateCandidates({
      missionId: "mission-suspended",
      requiredSkills: ["skill-research-synthesis"],
      validated: true,
    });
    const suspended = suspendedMission.evaluations.find((e) => e.workerId === "wkr-suspended-01")!;
    assert.equal(suspended.eligible, false);
  });

  test("10 rejects boundary bypasses and keeps recommend-only posture", async () => {
    const engine = await build();
    assert.equal(
      engine.submitMission({ ...researchMission, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.discoverEligibleWorkers({
        replaceWorkforceOrchestrator: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recommendAssignment({
        ...researchMission,
        replaceTaskNegotiationProtocol: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceAssignments({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerAssignmentEngine({
        overrideGrandKing: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(WAE_CAPABILITIES.includes("recommend_primary_worker"));
    assert.ok(WAE_CAPABILITIES.includes("produce_machine_readable_assignment_records"));
    assert.ok(WAE_CAPABILITIES.includes("extensible_assignment_factors"));
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-strategy-01")!;
    assert.equal(worker.neverExecuteWorkerTasks, true);
  });
});
