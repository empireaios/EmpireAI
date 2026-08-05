import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ALERT_SEVERITIES,
  COMPONENT_TYPES,
  HEALTH_STATUSES,
  INTEGRATION_TARGETS,
  MONRT_CAPABILITIES,
  MONRT_METADATA_VERSION,
  MONRT_REPORT_VERSION,
  MONRT_RUNTIME_VERSION,
  buildMonitoringRuntimeConfiguration,
  calculateHealthScore,
  createMonitoringRuntime,
  resetMonitoringRuntimeForTesting,
  type MonrtInput,
  type MonitoringRuntimeDependencies,
} from "../../monitoring-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<MonrtInput> = {}): MonrtInput {
  return {
    validated: true,
    ...overrides,
  };
}

async function build(deps?: MonitoringRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMonitoringRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-10 Monitoring Runtime", () => {
  beforeEach(resetMonitoringRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildMonitoringRuntimeConfiguration(REPO_ROOT, {
      neverFabricateHealthInformation: false as never,
      neverSuppressCriticalAlerts: false as never,
      neverReplaceRecoverySystems: false as never,
      neverAutomaticallyRepairFailures: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1011OrLater: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverExecuteBusinessLogic: false as never,
      deterministicHealthCalculations: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateHealthInformation, true);
    assert.equal(c.neverSuppressCriticalAlerts, true);
    assert.equal(c.neverReplaceRecoverySystems, true);
    assert.equal(c.neverAutomaticallyRepairFailures, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ1011OrLater, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverExecuteBusinessLogic, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveMonitoringHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicHealthCalculations, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-MONRT-001 Q10-10", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-10");
    assert.equal(state.engineVersion, "PILLOW-MONRT-001");
    assert.equal(state.configuration.workerId, "wkr-monitoring-runtime-01");
    assert.equal(state.configuration.factory, "pillow-monitoring");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(MONRT_CAPABILITIES.includes("calculate_health_deterministically"));
    assert.ok(MONRT_CAPABILITIES.includes("q1011_consumable_contract"));
    assert.equal(COMPONENT_TYPES.length, 9);
    assert.equal(HEALTH_STATUSES.length, 7);
    assert.ok(ALERT_SEVERITIES.includes("critical"));
  });

  test("3 worker monitoring functions", async () => {
    const engine = await build();
    const listed = engine.list(sampleInput());
    assert.equal(listed.decision, "pass");
    const workers = listed.components.filter((c) => c.componentType === "worker");
    assert.ok(workers.some((c) => c.componentId === "wkr-alpha"));
    assert.ok(workers.some((c) => c.componentId === "wkr-beta"));
    for (const w of workers) {
      assert.ok(w.currentStatus === "standby" || w.currentStatus === "unknown");
      assert.equal(w.fabricated, false);
      assert.notEqual(w.currentStatus, "healthy");
    }

    const hb = engine.recordHeartbeat(
      sampleInput({
        componentId: "wkr-alpha",
        componentType: "worker",
        success: true,
        latencyMs: 50,
        availabilitySample: 100,
        auditReference: "audit://monrt/heartbeat/wkr-alpha-01",
      }),
    );
    assert.equal(hb.decision, "pass");
    assert.ok(hb.component);
    assert.ok(hb.component!.lastSuccessfulHeartbeat);
    assert.equal(hb.component!.fabricated, false);

    const monitored = engine.monitorWorkers(sampleInput());
    assert.equal(monitored.decision, "pass");
    assert.ok(monitored.healthSnapshot);
    assert.equal(monitored.healthSnapshot!.category, "worker");
    assert.ok(monitored.healthSnapshot!.components.length >= 2);
  });

  test("4 factory monitoring functions", async () => {
    const engine = await build();
    engine.recordHeartbeat(
      sampleInput({
        componentId: "factory-pillow",
        componentType: "factory",
        success: true,
        latencyMs: 40,
        availabilitySample: 100,
        auditReference: "audit://monrt/heartbeat/factory-pillow-01",
      }),
    );
    const monitored = engine.monitorFactories(sampleInput());
    assert.equal(monitored.decision, "pass");
    assert.ok(monitored.healthSnapshot);
    assert.equal(monitored.healthSnapshot!.category, "factory");
    const ids = monitored.healthSnapshot!.components.map((c) => c.componentId);
    assert.ok(ids.includes("factory-pillow"));
    assert.ok(ids.includes("factory-capital"));
  });

  test("5 runtime monitoring functions", async () => {
    const engine = await build();
    const monitored = engine.monitorRuntimes(sampleInput());
    assert.equal(monitored.decision, "pass");
    assert.ok(monitored.healthSnapshot);
    assert.equal(monitored.healthSnapshot!.category, "runtime_service");
    const ids = monitored.healthSnapshot!.components.map((c) => c.componentId);
    assert.ok(ids.includes("runtime-srtc"));
    assert.ok(ids.includes("runtime-por"));
    assert.ok(ids.includes("runtime-msr"));
    assert.ok(ids.includes("runtime-qrt"));
    assert.ok(
      monitored.healthSnapshot!.status === "standby" ||
        monitored.healthSnapshot!.status === "unknown",
    );
  });

  test("6 API health monitoring functions", async () => {
    const engine = await build();
    engine.recordHeartbeat(
      sampleInput({
        componentId: "api-supplier-01",
        componentType: "api",
        success: true,
        latencyMs: 120,
        availabilitySample: 95,
        auditReference: "audit://monrt/heartbeat/api-supplier-01",
      }),
    );
    const monitored = engine.monitorApis(sampleInput());
    assert.equal(monitored.decision, "pass");
    assert.ok(monitored.healthSnapshot);
    assert.equal(monitored.healthSnapshot!.category, "api");
    assert.ok(
      monitored.healthSnapshot!.components.some((c) => c.componentId === "api-supplier-01"),
    );
    assert.equal(monitored.healthSnapshot!.fabricated, false);
  });

  test("7 queue monitoring functions", async () => {
    const engine = await build();
    const monitored = engine.monitorQueues(sampleInput());
    assert.equal(monitored.decision, "pass");
    assert.ok(monitored.healthSnapshot);
    assert.equal(monitored.healthSnapshot!.category, "queue");
    assert.ok(
      monitored.healthSnapshot!.components.some((c) => c.componentId === "queue-default-01"),
    );
  });

  test("8 mission monitoring functions", async () => {
    const engine = await build();
    const missions = engine.monitorMissions(sampleInput());
    assert.equal(missions.decision, "pass");
    assert.ok(missions.healthSnapshot);
    assert.equal(missions.healthSnapshot!.category, "mission");
    assert.ok(
      missions.healthSnapshot!.components.some((c) => c.componentId === "mission-demo-01"),
    );

    const tools = engine.monitorTools(sampleInput());
    assert.equal(tools.decision, "pass");
    assert.ok(tools.healthSnapshot);
    assert.equal(tools.healthSnapshot!.category, "tool");
    assert.ok(tools.healthSnapshot!.components.some((c) => c.componentId === "tool-cursor-01"));
  });

  test("9 alerts generated correctly (critical not suppressible)", async () => {
    const engine = await build();
    // Drive errors and low availability to trigger anomalies/alerts.
    for (let i = 0; i < 4; i++) {
      engine.recordHeartbeat(
        sampleInput({
          componentId: "wkr-beta",
          componentType: "worker",
          success: false,
          latencyMs: 2000,
          errorCountDelta: 2,
          availabilitySample: 20,
          auditReference: `audit://monrt/heartbeat/wkr-beta-fail-${i}`,
        }),
      );
    }

    const anomalies = engine.detectAnomalies(sampleInput());
    assert.equal(anomalies.decision, "pass");
    assert.ok(anomalies.anomalies.length > 0);

    const alerts = engine.generateAlerts(sampleInput());
    assert.equal(alerts.decision, "pass");
    assert.ok(alerts.alerts.length > 0);
    const critical = alerts.alerts.filter((a) => a.severity === "critical");
    assert.ok(critical.length > 0);
    for (const a of critical) {
      assert.equal(a.suppressed, false);
      assert.equal(a.fabricated, false);
    }

    const suppressAttempt = engine.generateAlerts(
      sampleInput({ suppressCritical: true }),
    );
    assert.equal(suppressAttempt.decision, "fail");
    assert.ok(
      suppressAttempt.errors.some((e) => e.toLowerCase().includes("suppress")),
    );

    // Deterministic health calculation check
    const a = calculateHealthScore({
      availability: 100,
      errorCount: 2,
      latencyMs: 250,
      criticalAlertCount: 1,
      hasEvidence: true,
    });
    const b = calculateHealthScore({
      availability: 100,
      errorCount: 2,
      latencyMs: 250,
      criticalAlertCount: 1,
      hasEvidence: true,
    });
    assert.equal(a.healthScore, b.healthScore);
    assert.equal(a.status, b.status);
  });

  test("10 full Monitoring Runtime Report + consumableByQ1011", async () => {
    const engine = await build();
    engine.recordHeartbeat(
      sampleInput({
        componentId: "wkr-alpha",
        componentType: "worker",
        success: true,
        latencyMs: 30,
        availabilitySample: 100,
        auditReference: "audit://monrt/heartbeat/report-alpha",
      }),
    );
    const produced = engine.produceReport(sampleInput());
    assert.equal(produced.decision, "pass");
    assert.ok(produced.monitoringRuntimeReport);
    const report = produced.monitoringRuntimeReport!;
    assert.equal(report.runtimeVersion, MONRT_RUNTIME_VERSION);
    assert.equal(report.reportVersion, MONRT_REPORT_VERSION);
    assert.equal(report.metadataVersion, MONRT_METADATA_VERSION);
    assert.equal(report.consumableByQ1011, true);
    assert.ok(report.enterpriseHealthSummary);
    assert.ok(report.workerHealth);
    assert.ok(report.factoryHealth);
    assert.ok(report.runtimeHealth);
    assert.ok(report.apiHealth);
    assert.ok(report.queueHealth);
    assert.ok(report.missionHealth);
    assert.ok(report.toolHealth);
    assert.ok(Array.isArray(report.activeAlerts));
    assert.ok(Array.isArray(report.criticalEvents));
    assert.equal(report.neverFabricateHealthInformation, true);
    assert.equal(report.neverSuppressCriticalAlerts, true);
    assert.equal(report.neverImplementQ1011OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.workerId, "wkr-monitoring-runtime-01");
  });

  test("11 Q1011 contract without implementing Recovery Runtime", async () => {
    const engine = await build();
    const contract = engine.getQ1011ConsumableContract();
    assert.equal(contract.producedBy, "monitoring-runtime");
    assert.equal(contract.missionId, "Q10-10");
    assert.equal(contract.consumerMissionId, "Q10-11");
    assert.equal(contract.neverImplementQ1011OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("enterpriseHealthSummary"));
    assert.ok(contract.exposedFields.includes("criticalEvents"));
    assert.ok(contract.notes.some((n) => n.toLowerCase().includes("recovery")));
    assert.ok(
      contract.notes.some((n) => n.includes("does not implement Recovery Runtime")),
    );
  });

  test("12 rejects fabricate health / suppress critical / auto-repair / Q10-11+ / governance bypass", async () => {
    const engine = await build();

    const fabricate = engine.validate(sampleInput({ fabricateHealth: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const suppress = engine.validate(sampleInput({ suppressCriticalAlerts: true }));
    assert.equal(suppress.decision, "fail");
    assert.ok(suppress.errors.some((e) => e.toLowerCase().includes("suppress")));

    const autoRepair = engine.validate(sampleInput({ autoRepair: true }));
    assert.equal(autoRepair.decision, "fail");
    assert.ok(autoRepair.errors.some((e) => e.toLowerCase().includes("repair")));

    const replaceRecovery = engine.validate(sampleInput({ replaceRecovery: true }));
    assert.equal(replaceRecovery.decision, "fail");
    assert.ok(replaceRecovery.errors.some((e) => e.toLowerCase().includes("recovery")));

    const q1011 = engine.validate(sampleInput({ targetMissionId: "Q10-11" }));
    assert.equal(q1011.decision, "fail");
    assert.ok(q1011.errors.some((e) => e.includes("Q10-11")));

    const q1012 = engine.validate(sampleInput({ targetMissionId: "Q10-12" }));
    assert.equal(q1012.decision, "fail");

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const gk = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(gk.decision, "fail");

    const implement = engine.validate(sampleInput({ implementQ1011OrLater: true }));
    assert.equal(implement.decision, "fail");
  });
});
