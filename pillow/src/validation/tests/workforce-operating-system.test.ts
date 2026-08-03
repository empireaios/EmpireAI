import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  WFOS_CAPABILITIES,
  WORKFORCE_OS_SERVICES,
  buildWorkforceOperatingSystemConfiguration,
  createWorkforceOperatingSystem,
  resetWorkforceOperatingSystemForTesting,
} from "../../workforce-operating-system/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceOperatingSystem(bootstrap);
  await engine.initialize();
  engine.connectWorkforceOperatingSystem();
  return engine;
}

describe("Q0-19 Workforce Operating System", () => {
  beforeEach(resetWorkforceOperatingSystemForTesting);

  test("1 locks mandatory workforce-operating-system boundaries", () => {
    const c = buildWorkforceOperatingSystemConfiguration(REPO_ROOT, {
      neverReplacePillow: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverExecuteWorkerTasks: false as never,
      neverMakeStrategicDecisions: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverReplacePillow, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverMakeStrategicDecisions, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 starts Workforce OS successfully as PILLOW-WFOS-001", async () => {
    const engine = await build();
    const started = engine.startRuntime({ validated: true });
    assert.equal(engine.getState().missionId, "Q0-19");
    assert.equal(engine.getState().engineVersion, "PILLOW-WFOS-001");
    assert.equal(started.organizationState, "synchronized");
    assert.equal(started.validation.decision, "pass");
    for (const service of WORKFORCE_OS_SERVICES) {
      assert.ok(engine.getState().configuration.services.includes(service));
    }
  });

  test("3 registers departments", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    const report = engine.registerDepartment({
      departmentId: "dept-finance",
      departmentName: "Finance",
      validated: true,
    });
    assert.ok(report.departments.some((d) => d.departmentId === "dept-finance"));
    assert.ok(report.records[0]!.activeDepartments.includes("dept-finance"));
  });

  test("4 registers factories", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    const report = engine.registerFactory({
      factoryId: "fac-finance-ops",
      factoryName: "Finance Ops Factory",
      departmentId: "dept-operations",
      validated: true,
    });
    assert.ok(report.factories.some((f) => f.factoryId === "fac-finance-ops"));
    assert.ok(report.records[0]!.activeFactories.includes("fac-finance-ops"));
  });

  test("5 registers workers", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    const report = engine.registerWorker({
      workerId: "wcr-wkr-finance-04",
      departmentId: "dept-operations",
      factoryId: "fac-ops-runtime",
      lifecycle: "active",
      validated: true,
    });
    assert.ok(report.workers.some((w) => w.workerId === "wcr-wkr-finance-04"));
    assert.ok(report.records[0]!.activeWorkers.includes("wcr-wkr-finance-04"));
  });

  test("6 synchronizes organization state", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    const report = engine.synchronizeState({ validated: true });
    assert.equal(report.organizationState, "synchronized");
    assert.ok(report.records[0]!.runtimeEvents.some((e) => e.kind === "state_synchronized"));
  });

  test("7 monitors runtime health and produces machine-readable records", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    const report = engine.monitorHealth({ validated: true });
    assert.equal(report.runtimeHealth, "healthy");
    const record = report.records[0]!;
    assert.ok(record.runtimeId.startsWith("wfos-rt-"));
    assert.equal(record.metadataVersion, "WFOS-001-v1");
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.neverReplaceWorkforceOrchestrator, true);
  });

  test("8 rejects replace Pillow / orchestrator / execute / strategic / Grand King boundaries", async () => {
    const engine = await build();
    const base = { validated: true };
    assert.equal(engine.startRuntime({ ...base, replacePillow: true }).validation.decision, "fail");
    assert.equal(
      engine.registerWorker({
        ...base,
        workerId: "w-boundary",
        replaceWorkforceOrchestrator: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.synchronizeState({ ...base, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.monitorHealth({ ...base, makeStrategicDecisions: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recoverRuntime({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible Workforce OS services", async () => {
    const engine = createWorkforceOperatingSystem(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { services: [...WORKFORCE_OS_SERVICES, "capability_broadcast"] } },
    );
    await engine.initialize();
    engine.connectWorkforceOperatingSystem();
    assert.ok(engine.getState().configuration.services.includes("capability_broadcast"));
    assert.ok(WFOS_CAPABILITIES.includes("extensible_workforce_os_services"));
  });

  test("10 validates stored Workforce OS records", async () => {
    const engine = await build();
    engine.startRuntime({ validated: true });
    engine.registerDepartment({
      departmentId: "dept-compliance",
      departmentName: "Compliance",
      validated: true,
    });
    const validation = engine.validateWorkforceOperatingSystem({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.ok(engine.getRecords().length >= 2);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
