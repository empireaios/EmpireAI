import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  NEGOTIATION_OUTCOMES,
  TNP_CAPABILITIES,
  buildTaskNegotiationProtocolConfiguration,
  createTaskNegotiationProtocol,
  resetTaskNegotiationProtocolForTesting,
} from "../../task-negotiation-protocol/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createTaskNegotiationProtocol>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createTaskNegotiationProtocol(bootstrap, config);
  await engine.initialize();
  engine.connectTaskNegotiationProtocol();
  return engine;
}

function sampleCandidates(overrides: Array<Record<string, unknown>> = []) {
  const base = [
    {
      workerId: "wcr-wkr-strategy-01",
      capabilityScore: 92,
      available: true,
      declaredCapabilities: ["planning", "routing"],
    },
    {
      workerId: "wcr-wkr-ops-02",
      capabilityScore: 74,
      available: true,
      declaredCapabilities: ["routing", "execution_support"],
    },
    {
      workerId: "wcr-wkr-support-03",
      capabilityScore: 61,
      available: true,
      declaredCapabilities: ["execution_support"],
    },
  ];
  return overrides.length
    ? overrides.map((o, i) => ({ ...base[i % base.length]!, ...o }))
    : base;
}

describe("Q0-20 Task Negotiation Protocol", () => {
  beforeEach(resetTaskNegotiationProtocolForTesting);

  test("1 locks mandatory task-negotiation-protocol boundaries", () => {
    const c = buildTaskNegotiationProtocolConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverReplacePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverPerformStrategicPlanning: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverReplacePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverPerformStrategicPlanning, true);
  });

  test("2 initializes PILLOW-TNP-001 for Q0-20", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-20");
    assert.equal(state.engineVersion, "PILLOW-TNP-001");
    for (const outcome of NEGOTIATION_OUTCOMES) {
      assert.ok(state.configuration.negotiationOutcomes.includes(outcome));
    }
  });

  test("3 multiple workers negotiate and a primary worker is selected", async () => {
    const report = (await build()).negotiate({
      missionId: "Q0-20",
      taskId: "task-route-alpha",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates(),
      validated: true,
    });
    assert.equal(report.primaryWorkerId, "wcr-wkr-strategy-01");
    assert.ok(report.candidateWorkers.length >= 2);
    assert.equal(report.records[0]!.negotiationResult, "accepted");
    assert.equal(report.records[0]!.metadataVersion, "TNP-001-v1");
  });

  test("4 supporting workers are assigned", async () => {
    const report = (await build()).negotiate({
      missionId: "Q0-20",
      taskId: "task-route-beta",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates(),
      validated: true,
    });
    assert.ok(report.supportingWorkers.includes("wcr-wkr-ops-02"));
    assert.ok(report.records[0]!.supportingWorkers.length >= 1);
  });

  test("5 dependency chains are generated", async () => {
    const report = (await build()).negotiate({
      missionId: "Q0-20",
      taskId: "task-parent",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates(),
      dependencyEdges: [
        { fromTaskId: "task-child", toTaskId: "task-parent", dependencyType: "blocks" },
        { fromTaskId: "task-parent", toTaskId: "task-followup", dependencyType: "handoff" },
      ],
      validated: true,
    });
    assert.equal(report.records[0]!.dependencyGraph.length, 2);
    assert.ok(
      report.records[0]!.dependencyGraph.some(
        (d) => d.fromTaskId === "task-child" && d.dependencyType === "blocks",
      ),
    );
  });

  test("6 detects negotiation conflicts on ownership ties", async () => {
    const report = (await build()).detectConflicts({
      missionId: "Q0-20",
      taskId: "task-tie",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates([
        {
          workerId: "wcr-wkr-strategy-01",
          capabilityScore: 88,
          available: true,
          declaredCapabilities: ["routing"],
        },
        {
          workerId: "wcr-wkr-ops-02",
          capabilityScore: 86,
          available: true,
          declaredCapabilities: ["routing"],
        },
      ]),
      validated: true,
    });
    assert.ok(report.conflicts.some((c) => c.startsWith("ownership_tie:")));
    assert.equal(report.records[0]!.negotiationResult, "escalated");
  });

  test("7 escalates unresolved negotiations to Pillow", async () => {
    const report = (await build()).escalateToPillow({
      missionId: "Q0-20",
      taskId: "task-escalate",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates(),
      validated: true,
    });
    assert.equal(report.escalationStatus, "escalated_to_pillow");
    assert.equal(report.records[0]!.negotiationResult, "escalated");
    assert.equal(report.primaryWorkerId, null);
  });

  test("8 rejects execute / replace orchestrator / replace Pillow / Grand King / strategic-planning boundaries", async () => {
    const engine = await build();
    const base = {
      missionId: "Q0-20",
      taskId: "task-boundary",
      candidateWorkers: sampleCandidates(),
      validated: true,
    };
    assert.equal(engine.negotiate({ ...base, executeWorkerTasks: true }).validation.decision, "fail");
    assert.equal(
      engine.negotiate({ ...base, replaceWorkforceOrchestrator: true }).validation.decision,
      "fail",
    );
    assert.equal(engine.negotiate({ ...base, replacePillow: true }).validation.decision, "fail");
    assert.equal(engine.escalateToPillow({ ...base, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(
      engine.detectConflicts({ ...base, performStrategicPlanning: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible negotiation outcomes", async () => {
    const engine = await build({
      configuration: { negotiationOutcomes: [...NEGOTIATION_OUTCOMES, "partial_handoff"] },
    });
    assert.ok(engine.getState().configuration.negotiationOutcomes.includes("partial_handoff"));
    assert.ok(TNP_CAPABILITIES.includes("extensible_negotiation_outcomes"));
  });

  test("10 produces machine-readable negotiation records and validates them", async () => {
    const engine = await build();
    engine.negotiate({
      missionId: "Q0-20",
      taskId: "task-validate",
      requiredCapabilities: ["routing"],
      candidateWorkers: sampleCandidates(),
      validated: true,
    });
    const validation = engine.validateTaskNegotiationProtocol({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.workerTasksExecuted, false);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
