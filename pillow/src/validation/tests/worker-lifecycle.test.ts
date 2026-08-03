import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LIFECYCLE_RULES,
  LIFECYCLE_STATES,
  LIFECYCLE_VERSION,
  WLC_CAPABILITIES,
  buildWorkerLifecycleConfiguration,
  createWorkerLifecycle,
  resetWorkerLifecycleForTesting,
} from "../../worker-lifecycle/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerLifecycle>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerLifecycle(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerLifecycle();
  return engine;
}

async function activateReady(engine: Awaited<ReturnType<typeof build>>, workerId: string) {
  engine.createWorker({
    workerId,
    workerName: `Lifecycle Worker ${workerId}`,
    requestedBy: "pillow",
    validated: true,
  });
  engine.onboardWorker({ workerId, validated: true });
  engine.configureWorker({ workerId, validated: true });
  return engine.activateWorker({ workerId, approvedBy: "pillow", validated: true });
}

describe("Q1-08 Worker Lifecycle", () => {
  beforeEach(resetWorkerLifecycleForTesting);

  test("1 locks mandatory worker-lifecycle boundaries", () => {
    const c = buildWorkerLifecycleConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkerRegistry: false as never,
      neverReplaceWorkforceCertificationMonitor: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverPermanentlyDeleted: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkerRegistry, true);
    assert.equal(c.neverReplaceWorkforceCertificationMonitor, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverPermanentlyDeleted, true);
  });

  test("2 initializes PILLOW-WLC-001 for Q1-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-08");
    assert.equal(state.engineVersion, "PILLOW-WLC-001");
    for (const rule of LIFECYCLE_RULES) {
      assert.ok(state.configuration.lifecycleRules.includes(rule));
    }
    for (const status of LIFECYCLE_STATES) {
      assert.ok(state.configuration.lifecycleStates.includes(status));
    }
  });

  test("3 creates a worker into registered state", async () => {
    const report = (await build()).createWorker({
      workerId: "wkr-life-01",
      workerName: "Lifecycle Specialist One",
      triggerReason: "factory_intake",
      requestedBy: "pillow",
      validated: true,
    });
    assert.equal(report.action, "create");
    assert.equal(report.records.length, 1);
    assert.equal(report.records[0]!.workerId, "wkr-life-01");
    assert.equal(report.records[0]!.lifecycleEvent, "create");
    assert.equal(report.records[0]!.previousState, null);
    assert.equal(report.records[0]!.newState, "registered");
    assert.equal(report.profiles[0]!.currentState, "registered");
  });

  test("4 onboards a registered worker", async () => {
    const engine = await build();
    engine.createWorker({
      workerId: "wkr-life-02",
      workerName: "Onboard Candidate",
      validated: true,
    });
    const report = engine.onboardWorker({
      workerId: "wkr-life-02",
      triggerReason: "onboarding_started",
      validated: true,
    });
    assert.equal(report.action, "onboard");
    assert.equal(report.records[0]!.previousState, "registered");
    assert.equal(report.records[0]!.newState, "onboarding");
    assert.equal(report.validation.decision, "pass");
  });

  test("5 activates a certified worker for production", async () => {
    const engine = await build();
    const report = await activateReady(engine, "wkr-life-03");
    assert.equal(report.action, "activate");
    assert.equal(report.records[0]!.newState, "active");
    const profile = engine.getProfiles().find((p) => p.workerId === "wkr-life-03")!;
    assert.equal(profile.currentState, "active");
    assert.equal(profile.certified, true);
  });

  test("6 suspends then resumes an active worker", async () => {
    const engine = await build();
    await activateReady(engine, "wkr-life-04");
    const suspended = engine.suspendWorker({
      workerId: "wkr-life-04",
      triggerReason: "maintenance_window",
      validated: true,
    });
    assert.equal(suspended.action, "suspend");
    assert.equal(suspended.records[0]!.newState, "suspended");

    const resumed = engine.resumeWorker({
      workerId: "wkr-life-04",
      triggerReason: "maintenance_complete",
      validated: true,
    });
    assert.equal(resumed.action, "resume");
    assert.equal(resumed.records[0]!.previousState, "suspended");
    assert.equal(resumed.records[0]!.newState, "active");
  });

  test("7 replaces a worker with Pillow authorization", async () => {
    const engine = await build();
    await activateReady(engine, "wkr-life-05");
    const denied = engine.replaceWorker({
      workerId: "wkr-life-05",
      approvedBy: "ops-manager",
      validated: true,
    });
    assert.equal(denied.validation.decision, "fail");

    const replaced = engine.replaceWorker({
      workerId: "wkr-life-05",
      replacementWorkerId: "wkr-life-05b",
      approvedBy: "pillow",
      triggerReason: "capability_upgrade",
      validated: true,
    });
    assert.equal(replaced.action, "replace");
    assert.equal(replaced.records[0]!.newState, "replaced");
    assert.equal(replaced.records[0]!.approvedBy, "pillow");
  });

  test("8 retires a worker with Pillow authorization", async () => {
    const engine = await build();
    await activateReady(engine, "wkr-life-06");
    const denied = engine.retireWorker({
      workerId: "wkr-life-06",
      validated: true,
    });
    assert.equal(denied.validation.decision, "fail");

    const retired = engine.retireWorker({
      workerId: "wkr-life-06",
      approvedBy: "pillow",
      triggerReason: "end_of_service",
      validated: true,
    });
    assert.equal(retired.action, "retire");
    assert.equal(retired.records[0]!.newState, "retired");
    assert.equal(retired.records[0]!.permanentlyDeleted, false);
  });

  test("9 produces machine-readable lifecycle records", async () => {
    const engine = await build();
    await activateReady(engine, "wkr-life-07");
    const report = engine.produceLifecycle({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.lifecycleVersion, LIFECYCLE_VERSION);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(catalog.records.length >= 1);
    const record = catalog.records[0]!;
    assert.ok(record.lifecycleId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.workerName);
    assert.ok(record.lifecycleEvent);
    assert.ok(record.newState);
    assert.ok(record.triggerReason);
    assert.ok(record.requestedBy);
    assert.ok(Array.isArray(record.supportingEvidence));
    assert.equal(record.metadataVersion, "WLC-001-v1");
    assert.equal(record.neverExecuteWorkerTasks, true);
    assert.equal(record.permanentlyDeleted, false);
  });

  test("10 rejects boundary bypasses and preserves history", async () => {
    const engine = await build();
    await activateReady(engine, "wkr-life-08");
    assert.equal(
      engine.suspendWorker({
        workerId: "wkr-life-08",
        executeWorkerTasks: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.auditWorker({
        workerId: "wkr-life-08",
        replaceWorkerRegistry: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceLifecycle({
        replaceWorkforceCertificationMonitor: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerLifecycle({ overridePillow: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.createWorker({
        workerId: "wkr-life-09",
        permanentlyDelete: true,
        overrideGrandKing: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    const profile = engine.getProfiles().find((p) => p.workerId === "wkr-life-08")!;
    assert.ok(profile.history.length >= 4);
    assert.equal(profile.neverPermanentlyDeleted, true);
    assert.ok(WLC_CAPABILITIES.includes("produce_machine_readable_lifecycle_records"));
    assert.ok(WLC_CAPABILITIES.includes("extensible_lifecycle_states"));
  });
});
