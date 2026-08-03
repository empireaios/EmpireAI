import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PWO_CAPABILITIES,
  WORKER_STATES,
  buildWorkforceOrchestratorConfiguration,
  createWorkforceOrchestrator,
  resetWorkforceOrchestratorForTesting,
} from "../../workforce-orchestrator/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceOrchestrator(bootstrap);
  await engine.initialize();
  engine.connectWorkforceOrchestrator();
  return engine;
}

describe("Q0-09 Pillow Workforce Orchestrator", () => {
  beforeEach(resetWorkforceOrchestratorForTesting);

  test("1 locks mandatory workforce-orchestrator boundaries", () => {
    const c = buildWorkforceOrchestratorConfiguration(REPO_ROOT, {
      neverPerformWorkerTasks: false as never,
      neverReplaceWorkerLogic: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverPerformStrategicPlanning: false as never,
    });
    assert.equal(c.neverPerformWorkerTasks, true);
    assert.equal(c.neverReplaceWorkerLogic, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverPerformStrategicPlanning, true);
  });

  test("2 initializes PILLOW-PWO-001 for Q0-09", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-09");
    assert.equal(state.engineVersion, "PILLOW-PWO-001");
    assert.ok(state.configuration.registeredWorkers.length >= 3);
    for (const stateName of ["available", "busy", "failed", "escalated", "completed"] as const) {
      assert.ok(WORKER_STATES.includes(stateName));
    }
  });

  test("3 receives executive intent and discovers workers", async () => {
    const report = (await build()).discoverWorkers({
      executiveRequest: "Coordinate engineering and operations delivery for platform integration",
      categoryHints: ["engineering", "operations"],
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.discoveredWorkers.length >= 2);
    assert.ok(report.records[0]!.workersSelected.length >= 1);
  });

  test("4 selects workers and coordinates multi-worker execution", async () => {
    const record = (await build()).coordinate({
      executiveRequest: "Run parallel engineering, operations, and data intelligence mission package",
      missionId: "Q0-09-demo",
      categoryHints: ["engineering", "operations", "data_intelligence"],
      coordinationMode: "parallel",
      maxWorkers: 3,
      validated: true,
    }).records[0]!;
    assert.ok(record.workersSelected.length >= 2);
    assert.equal(record.coordinationMode, "parallel");
    assert.ok(record.executionSequence.length >= 1);
    assert.ok(record.executionSequence.some((s) => s.mode === "parallel"));
    assert.equal(record.workerTasksPerformed, false);
  });

  test("5 monitors worker status and produces machine-readable records", async () => {
    const record = (await build()).monitor({
      executiveRequest: "Monitor sequential product and engineering handoff for release readiness",
      categoryHints: ["product", "engineering"],
      coordinationMode: "sequential",
      validated: true,
    }).records[0]!;
    assert.ok(record.orchestrationId.startsWith("pwo-orc-"));
    assert.equal(record.metadataVersion, "PWO-001-v1");
    assert.ok(record.workerStatus.length >= 1);
    assert.ok(record.currentProgress >= 0 && record.currentProgress <= 100);
    assert.ok(record.completionStatus);
  });

  test("6 detects worker failure", async () => {
    const record = (await build()).handleFailure({
      executiveRequest: "Coordinate operations monitoring for runtime delivery",
      categoryHints: ["operations"],
      failureHints: ["Primary operations worker crashed mid-cycle"],
      validated: true,
    }).records[0]!;
    assert.equal(record.completionStatus, "failed");
    assert.ok(record.workerStatus.some((w) => w.state === "failed"));
  });

  test("7 demonstrates escalation handling", async () => {
    const record = (await build()).handleEscalation({
      executiveRequest: "Escalate blocked compliance and governance coordination path",
      categoryHints: ["compliance", "executive_governance"],
      escalationHints: ["Blocked on missing Grand King approval gate"],
      validated: true,
    }).records[0]!;
    assert.ok(record.escalations.length >= 1);
    assert.ok(record.completionStatus === "escalated" || record.workerStatus.some((w) => w.state === "escalated"));
  });

  test("8 rejects perform-task / replace-logic / override / planning boundary violations", async () => {
    const engine = await build();
    const base = {
      executiveRequest: "Coordinate engineering delivery for platform work",
      validated: true as const,
    };
    assert.equal(engine.coordinate({ ...base, performWorkerTasks: true }).validation.decision, "fail");
    assert.equal(engine.coordinate({ ...base, replaceWorkerLogic: true }).validation.decision, "fail");
    assert.equal(engine.coordinate({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.coordinate({ ...base, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.coordinate({ ...base, performStrategicPlanning: true }).validation.decision, "fail");
  });

  test("9 supports timeout handling and extensible worker states", async () => {
    const engine = createWorkforceOrchestrator(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { workerStates: [...WORKER_STATES, "draining"] } },
    );
    await engine.initialize();
    engine.connectWorkforceOrchestrator();
    const timedOut = engine.handleTimeout({
      executiveRequest: "Coordinate engineering delivery under timeout pressure",
      categoryHints: ["engineering"],
      timeoutMsHint: 0,
      validated: true,
    }).records[0]!;
    assert.equal(timedOut.completionStatus, "timed_out");
    assert.ok(engine.getState().configuration.workerStates.includes("draining"));
    assert.ok(PWO_CAPABILITIES.includes("extensible_worker_states"));
  });

  test("10 validates stored orchestration records", async () => {
    const engine = await build();
    engine.produceRecord({
      executiveRequest: "Coordinate strategy and finance alignment for portfolio review",
      categoryHints: ["strategy", "finance"],
      coordinationMode: "multi",
      validated: true,
    });
    const validation = engine.validateOrchestrations({ executiveRequest: "", validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverPerformWorkerTasks, true);
    assert.ok((engine.getDiscoveredWorkers().length ?? 0) >= 1);
  });
});
