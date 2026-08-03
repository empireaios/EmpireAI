import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MONITORING_EVENTS,
  MONITORING_RULES,
  MONITORING_VERSION,
  WMO_CAPABILITIES,
  WORKER_HEALTH_STATES,
  buildWorkerMonitoringConfiguration,
  createWorkerMonitoring,
  resetWorkerMonitoringForTesting,
} from "../../worker-monitoring/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerMonitoring>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerMonitoring(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerMonitoring();
  return engine;
}

describe("Q1-10 Worker Monitoring", () => {
  beforeEach(resetWorkerMonitoringForTesting);

  test("1 locks mandatory worker-monitoring boundaries", () => {
    const c = buildWorkerMonitoringConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverRestartWorkersAutomatically: false as never,
      neverReplaceWorkforceCertificationMonitor: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverRestartWorkersAutomatically, true);
    assert.equal(c.neverReplaceWorkforceCertificationMonitor, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WMO-001 for Q1-10", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-10");
    assert.equal(state.engineVersion, "PILLOW-WMO-001");
    for (const rule of MONITORING_RULES) {
      assert.ok(state.configuration.monitoringRules.includes(rule));
    }
    for (const health of WORKER_HEALTH_STATES) {
      assert.ok(state.configuration.healthStates.includes(health));
    }
    for (const event of MONITORING_EVENTS) {
      assert.ok(state.configuration.monitoringEvents.includes(event));
    }
  });

  test("3 monitors worker health and progress", async () => {
    const engine = await build();
    const report = engine.observeWorker({
      workerId: "wkr-strategy-01",
      progress: 0.8,
      currentWorkload: 0.3,
      qualityScore: 0.95,
      performanceScore: 0.93,
      lastHeartbeatAt: new Date().toISOString(),
      validated: true,
    });
    assert.equal(report.action, "observe");
    assert.equal(report.latestRecord!.workerId, "wkr-strategy-01");
    assert.equal(report.latestRecord!.healthStatus, "healthy");
    assert.equal(report.latestRecord!.progress, 0.8);
    assert.ok(report.latestRecord!.performanceScore > 0);
  });

  test("4 detects failures and drift", async () => {
    const engine = await build();
    const report = engine.observeWorker({
      workerId: "wkr-ops-01",
      progress: 0.15,
      currentWorkload: 0.9,
      errorCount: 3,
      repeatedErrorCount: 3,
      executionTimeMs: 500000,
      expectedExecutionTimeMs: 200000,
      performanceScore: 0.4,
      lastHeartbeatAt: new Date().toISOString(),
      active: true,
      available: true,
      validated: true,
    });
    assert.ok(["warning", "critical"].includes(String(report.latestRecord!.healthStatus)));
    assert.notEqual(report.latestRecord!.driftStatus, "none");
    assert.ok(report.latestRecord!.errorCount >= 3);
  });

  test("5 detects stalled and offline workers", async () => {
    const engine = await build();
    const anomalies = engine.detectAnomalies({ validated: true });
    assert.equal(anomalies.action, "detect_anomalies");
    assert.ok(anomalies.anomalies.length >= 1);
    const offline = anomalies.records.find((r) => r.workerId === "wkr-offline-01");
    assert.ok(offline);
    assert.equal(offline!.healthStatus, "offline");
    const commerce = anomalies.records.find((r) => r.workerId === "wkr-commerce-01");
    assert.ok(commerce);
    assert.ok(["warning", "critical", "offline"].includes(String(commerce!.healthStatus)));
  });

  test("6 monitors performance across active workers", async () => {
    const engine = await build();
    const report = engine.scanActiveWorkers({ validated: true });
    assert.equal(report.action, "scan_active");
    assert.ok(report.records.length >= 1);
    assert.ok(report.records.every((r) => typeof r.performanceScore === "number"));
    assert.ok(report.workers.every((w) => w.active));
  });

  test("7 generates alerts reported to Pillow", async () => {
    const engine = await build();
    const report = engine.generateAlerts({ validated: true });
    assert.equal(report.action, "generate_alerts");
    assert.ok(report.alerts.length >= 1);
    assert.ok(report.alerts.every((a) => a.reportedToPillow === true));
    assert.ok(report.alerts.some((a) => a.severity === "critical" || a.severity === "warning"));
  });

  test("8 records monitoring events", async () => {
    const engine = await build();
    const stalled = engine.recordMonitoringEvent({
      workerId: "wkr-strategy-01",
      event: "worker_stalled",
      validated: true,
    });
    assert.equal(stalled.action, "record_event");
    assert.ok(stalled.latestRecord!.events.includes("worker_stalled"));
    assert.ok(["critical", "warning", "offline"].includes(String(stalled.latestRecord!.healthStatus)));
  });

  test("9 produces machine-readable monitoring records", async () => {
    const engine = await build();
    engine.scanActiveWorkers({ validated: true });
    const report = engine.produceMonitoring({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.monitoringVersion, MONITORING_VERSION);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.equal(catalog.supportsExecutiveReportingRuntime, true);
    assert.ok(catalog.records.length >= 1);
    const record = catalog.records[0]!;
    assert.ok(record.monitoringId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.workerName);
    assert.ok(record.department);
    assert.ok(record.healthStatus);
    assert.ok(typeof record.availability === "boolean");
    assert.ok(typeof record.progress === "number");
    assert.ok(typeof record.currentWorkload === "number");
    assert.ok(typeof record.errorCount === "number");
    assert.ok(record.driftStatus);
    assert.ok(record.runtimeHealth);
    assert.ok(typeof record.performanceScore === "number");
    assert.ok(Array.isArray(record.alerts));
    assert.equal(record.metadataVersion, "WMO-001-v1");
    assert.equal(record.neverExecuteWorkerTasks, true);
    assert.equal(record.neverRestartWorkersAutomatically, true);
  });

  test("10 rejects boundary bypasses and stays observe-only", async () => {
    const engine = await build();
    assert.equal(
      engine.observeWorker({
        workerId: "wkr-strategy-01",
        executeWorkerTasks: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.scanActiveWorkers({
        restartWorkersAutomatically: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.generateAlerts({
        replaceWorkforceCertificationMonitor: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceMonitoring({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerMonitoring({
        overrideGrandKing: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(WMO_CAPABILITIES.includes("detect_stalled_workers"));
    assert.ok(WMO_CAPABILITIES.includes("produce_machine_readable_monitoring_records"));
    assert.ok(WMO_CAPABILITIES.includes("extensible_health_states"));
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-strategy-01")!;
    assert.equal(worker.neverExecuteWorkerTasks, true);
  });
});
