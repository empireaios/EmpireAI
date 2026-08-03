import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_CHECKS,
  CERTIFICATION_STATUSES,
  WCM_CAPABILITIES,
  buildWorkforceCertificationMonitorConfiguration,
  createWorkforceCertificationMonitor,
  resetWorkforceCertificationMonitorForTesting,
} from "../../workforce-certification-monitor/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkforceCertificationMonitor>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceCertificationMonitor(bootstrap, config);
  await engine.initialize();
  engine.connectWorkforceCertificationMonitor();
  return engine;
}

const healthyWorker = {
  workerId: "wcr-wkr-strategy-01",
  workerName: "Strategy Analyst",
  department: "strategy",
  missionId: "Q0-29",
  registered: true,
  available: true,
  reachable: true,
  capabilitiesRegistered: true,
  requiredToolsAccessible: true,
  governanceCompliant: true,
  qualityStandardCompliant: true,
  selfCritiqueCompliant: true,
  runtimeHealthy: true,
  dependenciesHealthy: true,
  executiveReady: true,
  validated: true,
};

describe("Q0-29 Workforce Certification Monitor", () => {
  beforeEach(resetWorkforceCertificationMonitorForTesting);

  test("1 locks mandatory workforce-certification-monitor boundaries", () => {
    const c = buildWorkforceCertificationMonitorConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverRepairWorkersAutomatically: false as never,
      neverReplaceWorkerQualityStandard: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverRepairWorkersAutomatically, true);
    assert.equal(c.neverReplaceWorkerQualityStandard, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WCM-001 for Q0-29", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-29");
    assert.equal(state.engineVersion, "PILLOW-WCM-001");
    for (const check of CERTIFICATION_CHECKS) {
      assert.ok(state.configuration.certificationChecks.includes(check));
    }
    for (const status of CERTIFICATION_STATUSES) {
      assert.ok(state.configuration.certificationStatuses.includes(status));
    }
  });

  test("3 certifies a production-ready worker", async () => {
    const report = (await build()).certifyWorker(healthyWorker);
    assert.equal(report.certificationStatus, "certified");
    assert.equal(report.records[0]!.certificationStatus, "certified");
    assert.ok(report.records[0]!.certificationId.startsWith("wcm-cr-"));
    assert.equal(report.records[0]!.recommendedAction, "assign_production_work");
    assert.equal(report.records[0]!.checksFailed.length, 0);
  });

  test("4 continuously monitors registered workers", async () => {
    const engine = await build();
    const report = engine.monitorWorkforce({
      workers: [
        healthyWorker,
        {
          ...healthyWorker,
          workerId: "wcr-wkr-ops-02",
          workerName: "Ops Coordinator",
          department: "operations",
        },
      ],
      validated: true,
    });
    assert.equal(report.action, "monitor_workforce");
    assert.equal(report.records.length, 2);
    assert.ok(report.engineRecord.lastMonitorCycleAt);
    assert.ok(report.records.every((r) => r.monitorCycleId));
  });

  test("5 detects certification failures", async () => {
    const engine = await build();
    engine.certifyWorker({
      ...healthyWorker,
      governanceCompliant: false,
      qualityStandardCompliant: false,
      selfCritiqueCompliant: false,
    });
    const failures = engine.detectFailures({ validated: true });
    assert.equal(failures.failureDetected, true);
    assert.ok(failures.records.length >= 1);
    assert.ok(failures.certificationIssues.length > 0);
  });

  test("6 decertifies a worker", async () => {
    const engine = await build();
    engine.certifyWorker(healthyWorker);
    const report = engine.decertifyWorker({
      workerId: healthyWorker.workerId,
      workerName: healthyWorker.workerName,
      department: healthyWorker.department,
      validated: true,
    });
    assert.equal(report.certificationStatus, "decertified");
    assert.equal(report.records[0]!.certificationStatus, "decertified");
    assert.ok(report.records[0]!.certificationIssues.includes("explicit_decertification"));
    assert.equal(report.records[0]!.recommendedAction, "recertify_worker");
  });

  test("7 recertifies a previously decertified worker", async () => {
    const engine = await build();
    engine.decertifyWorker({
      workerId: healthyWorker.workerId,
      workerName: healthyWorker.workerName,
      department: healthyWorker.department,
      validated: true,
    });
    const report = engine.recertifyWorker(healthyWorker);
    assert.equal(report.certificationStatus, "certified");
    assert.equal(report.records[0]!.certificationStatus, "certified");
    assert.equal(report.records[0]!.certificationIssues.length, 0);
  });

  test("8 rejects execute / auto-repair / WQS / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.certifyWorker({ ...healthyWorker, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.monitorWorkforce({
        ...healthyWorker,
        repairWorkersAutomatically: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.verifyQualityCompliance({
        ...healthyWorker,
        replaceWorkerQualityStandard: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.verifyGovernance({ ...healthyWorker, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.decertifyWorker({ ...healthyWorker, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WCM_CAPABILITIES.includes("extensible_certification_checks"));
  });

  test("9 supports extensible certification checks and statuses", async () => {
    const engine = await build({
      configuration: {
        certificationChecks: [...CERTIFICATION_CHECKS, "security_clearance"],
        certificationStatuses: [...CERTIFICATION_STATUSES, "quarantined"],
      },
    });
    const state = engine.getState();
    assert.ok(state.configuration.certificationChecks.includes("security_clearance"));
    assert.ok(state.configuration.certificationStatuses.includes("quarantined"));
  });

  test("10 produces machine-readable certification records and validates them", async () => {
    const engine = await build();
    engine.certifyWorker(healthyWorker);
    const validation = engine.validateWorkforceCertificationMonitor({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.ok(engine.getRecords().length >= 1);
    const record = engine.getLatestRecord()!;
    assert.ok(record.certificationId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.workerName);
    assert.ok(record.department);
    assert.ok(record.certificationStatus);
    assert.ok(record.availabilityStatus);
    assert.ok(record.capabilityStatus);
    assert.ok(record.toolAccessStatus);
    assert.ok(record.governanceStatus);
    assert.ok(record.runtimeHealth);
    assert.ok(record.qualityCompliance);
    assert.ok(Array.isArray(record.certificationIssues));
    assert.ok(record.recommendedAction);
    assert.equal(record.metadataVersion, "WCM-001-v1");
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.workersRepairedAutomatically, false);
    assert.equal(record.workerQualityStandardReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
  });
});
