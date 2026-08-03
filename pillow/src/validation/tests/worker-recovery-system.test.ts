import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  FAILURE_TYPES,
  RECOVERY_RULES,
  RECOVERY_STRATEGIES,
  RECOVERY_VERSION,
  WRS_CAPABILITIES,
  buildWorkerRecoverySystemConfiguration,
  createWorkerRecoverySystem,
  resetWorkerRecoverySystemForTesting,
} from "../../worker-recovery-system/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerRecoverySystem>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerRecoverySystem(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerRecoverySystem();
  return engine;
}

describe("Q1-12 Worker Recovery System", () => {
  beforeEach(resetWorkerRecoverySystemForTesting);

  test("1 locks mandatory worker-recovery-system boundaries", () => {
    const c = buildWorkerRecoverySystemConfiguration(REPO_ROOT, {
      neverExecuteWorkerBusinessLogic: false as never,
      neverReplaceWorkerMonitoring: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerBusinessLogic, true);
    assert.equal(c.neverReplaceWorkerMonitoring, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.respectAuthorityMatrix, true);
    assert.equal(c.respectWorkerLifecycle, true);
    assert.equal(c.respectMissionCoordinationEngine, true);
    assert.equal(c.preventDuplicateExecution, true);
  });

  test("2 initializes PILLOW-WRS-001 for Q1-12", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-12");
    assert.equal(state.engineVersion, "PILLOW-WRS-001");
    for (const rule of RECOVERY_RULES) {
      assert.ok(state.configuration.recoveryRules.includes(rule));
    }
    for (const strategy of RECOVERY_STRATEGIES) {
      assert.ok(state.configuration.recoveryStrategies.includes(strategy));
    }
    for (const failureType of FAILURE_TYPES) {
      assert.ok(state.configuration.failureTypes.includes(failureType));
    }
  });

  test("3 recovers worker crash via restart", async () => {
    const engine = await build();
    engine.detectFailure({
      workerId: "wkr-strategy-01",
      failureType: "crash",
      failureCause: "process_exit_nonzero",
      validated: true,
    });
    const report = engine.restartWorker({
      workerId: "wkr-strategy-01",
      failureType: "crash",
      validated: true,
    });
    assert.equal(report.action, "restart");
    assert.equal(report.latestRecord!.failureType, "crash");
    assert.equal(report.latestRecord!.recoveryStrategy, "restart");
    assert.equal(report.latestRecord!.recoveryStatus, "recovered");
    assert.equal(report.latestRecord!.missionContinued, true);
    assert.equal(report.validation.decision, "pass");
  });

  test("4 recovers worker hang via restart", async () => {
    const engine = await build();
    engine.detectHungWorker({
      workerId: "wkr-strategy-01",
      failureCause: "heartbeat_lost",
      validated: true,
    });
    const report = engine.restartWorker({
      workerId: "wkr-strategy-01",
      failureType: "hang",
      validated: true,
    });
    assert.equal(report.action, "restart");
    assert.equal(report.latestRecord!.failureType, "hang");
    assert.equal(report.latestRecord!.recoveryStrategy, "restart");
    assert.equal(report.latestRecord!.recoveryStatus, "recovered");
    assert.ok(report.options.some((o) => o.strategy === "restart"));
  });

  test("5 recovers worker timeout via resume", async () => {
    const engine = await build();
    engine.detectStalledWorker({
      workerId: "wkr-ops-01",
      failureCause: "deadline_exceeded",
      validated: true,
    });
    const report = engine.resumeWorker({
      workerId: "wkr-ops-01",
      failureType: "timeout",
      validated: true,
    });
    assert.equal(report.action, "resume");
    assert.equal(report.latestRecord!.failureType, "timeout");
    assert.equal(report.latestRecord!.recoveryStrategy, "resume");
    assert.equal(report.latestRecord!.recoveryStatus, "recovered");
    assert.equal(report.latestRecord!.executionStatePreserved, true);
  });

  test("6 reassigns work to another qualified worker", async () => {
    const engine = await build();
    const report = engine.reassignWork({
      workerId: "wkr-commerce-01",
      failureType: "resource_exhaustion",
      reassignToWorkerId: "wkr-support-01",
      validated: true,
    });
    assert.equal(report.action, "reassign");
    assert.equal(report.latestRecord!.recoveryStrategy, "reassign");
    assert.equal(report.latestRecord!.reassignedToWorkerId, "wkr-support-01");
    assert.equal(report.latestRecord!.missionContinued, true);
    assert.equal(report.latestRecord!.recoveryStatus, "recovered");
  });

  test("7 continues mission after recovery", async () => {
    const engine = await build();
    engine.preserveExecutionState({
      workerId: "wkr-ops-01",
      failureType: "timeout",
      validated: true,
    });
    const report = engine.recoverWorker({
      workerId: "wkr-ops-01",
      failureType: "timeout",
      recoveryStrategy: "retry",
      validated: true,
    });
    assert.equal(report.latestRecord!.missionContinued, true);
    assert.equal(report.latestRecord!.executionStatePreserved, true);
    assert.ok(
      ["recovered", "partially_recovered"].includes(String(report.latestRecord!.recoveryStatus)),
    );
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-ops-01")!;
    assert.equal(worker.available, true);
    assert.equal(worker.executionStatePreserved, true);
  });

  test("8 escalates unrecoverable repeated failures to Pillow", async () => {
    const engine = await build();
    const report = engine.escalateToPillow({
      workerId: "wkr-failed-01",
      failureType: "crash",
      failureCause: "repeated_crash_loop",
      validated: true,
    });
    assert.equal(report.action, "escalate");
    assert.equal(report.latestRecord!.recoveryStrategy, "escalate_to_pillow");
    assert.equal(report.latestRecord!.recoveryStatus, "escalated");
    assert.equal(report.latestRecord!.escalationStatus, "escalated");
    assert.equal(report.latestRecord!.missionContinued, false);
    assert.ok((engine.getEngineRecord()?.totalEscalations ?? 0) >= 1);
  });

  test("9 produces machine-readable recovery records", async () => {
    const engine = await build();
    engine.restartWorker({
      workerId: "wkr-strategy-01",
      failureType: "crash",
      validated: true,
    });
    const report = engine.produceRecovery({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.recoveryVersion, RECOVERY_VERSION);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(catalog.records.length >= 1);
    const record = catalog.records[catalog.records.length - 1]!;
    assert.ok(record.recoveryId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.workerName);
    assert.ok(record.missionId);
    assert.ok(record.failureType);
    assert.ok(record.failureCause);
    assert.ok(record.recoveryStrategy);
    assert.ok(record.recoveryAction);
    assert.ok(record.recoveryStatus);
    assert.ok(record.escalationStatus);
    assert.ok(typeof record.recoveryDurationMs === "number");
    assert.ok(Array.isArray(record.supportingEvidence));
    assert.equal(record.metadataVersion, "WRS-001-v1");
    assert.equal(record.neverExecuteWorkerBusinessLogic, true);
    assert.equal(record.neverReplaceWorkerMonitoring, true);
  });

  test("10 rejects boundary bypasses and stays recovery-only", async () => {
    const engine = await build();
    assert.equal(
      engine.restartWorker({
        workerId: "wkr-strategy-01",
        executeWorkerBusinessLogic: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.reassignWork({
        workerId: "wkr-commerce-01",
        replaceWorkerMonitoring: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.rollbackWork({
        workerId: "wkr-ops-01",
        replaceWorkforceOrchestrator: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceRecovery({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerRecoverySystem({
        overrideGrandKing: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(WRS_CAPABILITIES.includes("detect_worker_failures"));
    assert.ok(WRS_CAPABILITIES.includes("restart_workers"));
    assert.ok(WRS_CAPABILITIES.includes("reassign_work"));
    assert.ok(WRS_CAPABILITIES.includes("escalate_unrecoverable_failures_to_pillow"));
    assert.ok(WRS_CAPABILITIES.includes("produce_machine_readable_recovery_records"));
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-strategy-01")!;
    assert.equal(worker.neverExecuteWorkerBusinessLogic, true);
  });
});
